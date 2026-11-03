#!/usr/bin/env python3
"""
Arabic auto-captions: video in, keyword captions burned in.

    python arabic_autocaptions.py video.mp4                  # -> video.captioned.mp4 (+ .ass, .srt)
    python arabic_autocaptions.py video.mp4 --words 2 --font "Noto Kufi Arabic" --highlight "#F5C518"
    python arabic_autocaptions.py video.mp4 --words-json my_words.json   # bring your own transcript

Speech recognition uses faster-whisper (word timestamps). Everything else is plain Python:
short keyword chunks (1 to 3 words), Arabic fillers removed, Latin digits, the strongest word
highlighted, English words kept in the right order inside Arabic lines (bidi isolates),
and an .ass file that ffmpeg burns into the video.

Part of Arabic Creator Kit (MIT): https://github.com/moathalherani/arabic-creator-kit
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path

__version__ = "0.1.0"

LRI, PDI, RLM = "\u2066", "\u2069", "\u200f"
ARABIC = re.compile(r"[\u0600-\u06ff]")
ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹", "01234567890123456789")
LATIN_RUN = re.compile(r"[A-Za-z0-9][A-Za-z0-9 .,:%+\-'’/]*[A-Za-z0-9%]|[A-Za-z0-9]")
SENTENCE_END = re.compile(r"[.!?؟…]$")

FILLERS = {"يعني", "اممم", "امم", "ااا", "آآآ", "اه", "آه", "إيه", "ايه", "اممم", "um", "uh", "uhm", "erm", "hmm"}
STOP_AR = set(
    (
        "في من على عن الى إلى و يا هاد هذا هاي هذه هذي اللي الذي التي ان أن إن كان كانت رح راح بس لا ما مش مو هو هي "
        "انا أنا انت إنت انتي إنتي احنا إحنا نحن كل شو ليش كيف وين مع عند لما اذا إذا لو قد ثم او أو بعد قبل كمان "
        "كثير شوي عشان لانه لأنه هيك هلق هسا هسه يعني اشي إشي ف وال بال لل حتى لسا لسه انو إنو اني إني اللي ده دي "
        "دا ايش وش هذول هدول كده كدا يلا خلص طيب"
    ).split()
)
STOP_EN = set(
    (
        "a an the and or but if to of in on at for with from by is are was were be been it this that these those i you "
        "he she we they me my your our their so just very really what when where why how do does did not no yes can will"
    ).split()
)

FONT_URLS = {
    "Changa": "https://github.com/google/fonts/raw/main/ofl/changa/Changa%5Bwght%5D.ttf",
    "Noto Kufi Arabic": "https://github.com/google/fonts/raw/main/ofl/notokufiarabic/NotoKufiArabic%5Bwght%5D.ttf",
    "Cairo": "https://github.com/google/fonts/raw/main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf",
    "Tajawal": "https://github.com/google/fonts/raw/main/ofl/tajawal/Tajawal-Bold.ttf",
    "Kufam": "https://github.com/google/fonts/raw/main/ofl/kufam/Kufam%5Bwght%5D.ttf",
}


@dataclass
class Word:
    text: str
    start: float
    end: float


@dataclass
class Chunk:
    words: list[str]
    start: float
    end: float
    keyword: int = -1
    text: str = field(init=False)

    def __post_init__(self) -> None:
        self.text = " ".join(self.words)


# ---------------------------------------------------------------- text helpers

def bare(word: str) -> str:
    return re.sub(r"[^\w%]", "", word)


def is_filler(word: str) -> bool:
    return bare(word).lower() in FILLERS


def is_stop(word: str) -> bool:
    w = bare(word)
    return w in STOP_AR or w.lower() in STOP_EN or (len(w) > 2 and w[0] in "وفب" and w[1:] in STOP_AR)


def clean_word(word: str, latin_digits: bool = True) -> str:
    w = word.strip()
    if latin_digits:
        w = w.translate(ARABIC_DIGITS)
    w = re.sub(r"^[\s\"'«»“”(\[]+", "", w)
    return re.sub(r"[\s\"'«»“”)\].,،؛:…]+$", "", w)


def pick_keyword(words: list[str]) -> int:
    """Numbers first, then Latin words (brands, English terms), then the longest non-stopword."""
    best, best_score = -1, 0
    for i, w in enumerate(words):
        b = bare(w)
        if not b or is_stop(w):
            continue
        if re.search(r"\d", b):
            score = 1000 + len(b)
        elif re.search(r"[A-Za-z]", b):
            score = 500 + len(b)
        else:
            score = len(b)
        if score > best_score:
            best, best_score = i, score
    return best


def isolate_latin(text: str) -> str:
    """Wrap Latin/number runs in Unicode isolates so they keep their order inside Arabic text."""
    text = text.replace(LRI, "").replace(PDI, "")
    if not ARABIC.search(text):
        return text
    return LATIN_RUN.sub(lambda m: f"{LRI}{m.group(0)}{PDI}", text)


# ---------------------------------------------------------------- chunking

def make_chunks(
    words: list[Word],
    max_words: int = 3,
    max_gap: float = 0.6,
    max_duration: float = 1.8,
    latin_digits: bool = True,
    remove_fillers: bool = True,
) -> list[Chunk]:
    """Group word timestamps into short caption chunks (1 to max_words words)."""
    if max_words < 1:
        raise ValueError("max_words must be at least 1")
    groups: list[list[Word]] = []
    cur: list[Word] = []
    for w in words:
        if remove_fillers and is_filler(w.text):
            continue
        text = clean_word(w.text, latin_digits)
        if not bare(text):
            continue
        item = Word(text, float(w.start), float(w.end))
        if cur and (
            len(cur) >= max_words
            or item.start - cur[-1].end > max_gap
            or item.end - cur[0].start > max_duration
        ):
            groups.append(cur)
            cur = []
        cur.append(item)
        if SENTENCE_END.search(w.text.strip()):
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)

    # a lonely last word sticks to the chunk before it when they are close
    merged: list[list[Word]] = []
    for g in groups:
        if merged and len(g) == 1 and len(merged[-1]) <= max_words and g[0].start - merged[-1][-1].end < 0.25:
            merged[-1].extend(g)
        else:
            merged.append(g)

    chunks: list[Chunk] = []
    for i, g in enumerate(merged):
        start, end = g[0].start, g[-1].end
        nxt = merged[i + 1][0].start if i + 1 < len(merged) else None
        if nxt is not None and 0 <= nxt - end < 0.35:
            end = nxt  # no flicker between close chunks
        end = max(end, start + 0.3)
        if nxt is not None:
            end = min(end, nxt)
        texts = [w.text for w in g]
        chunks.append(Chunk(texts, round(start, 3), round(end, 3), pick_keyword(texts)))
    return chunks


# ---------------------------------------------------------------- output formats

def srt_time(t: float) -> str:
    ms = max(0, round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def ass_time(t: float) -> str:
    cs = max(0, round(t * 100))
    h, cs = divmod(cs, 360_000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f"{h}:{m:02}:{s:02}.{cs:02}"


def hex_to_ass(color: str) -> str:
    m = re.fullmatch(r"#?([0-9a-fA-F]{6})", color.strip())
    if not m:
        raise ValueError(f'invalid color "{color}", use a hex color like "#7FB069"')
    rgb = m.group(1).upper()
    return f"&H00{rgb[4:6]}{rgb[2:4]}{rgb[0:2]}&"


def to_srt(chunks: list[Chunk]) -> str:
    out = []
    for i, c in enumerate(chunks, 1):
        line = (RLM if ARABIC.search(c.text) else "") + isolate_latin(c.text)
        out.append(f"{i}\n{srt_time(c.start)} --> {srt_time(c.end)}\n{line}\n")
    return "\n".join(out)


def to_ass(
    chunks: list[Chunk],
    width: int = 1080,
    height: int = 1920,
    font: str = "Changa",
    font_size: int | None = None,
    color: str = "#FFFFFF",
    highlight: str = "#7FB069",
    position: float | None = None,
    outline: int | None = None,
) -> str:
    vertical = height >= width
    size = font_size or round(height * (0.044 if vertical else 0.062))
    from_bottom = position if position is not None else (0.27 if vertical else 0.12)
    margin_v = round(height * from_bottom)
    border = outline if outline is not None else max(2, round(size / 20))
    primary, hi = hex_to_ass(color), hex_to_ass(highlight)
    header = "\n".join(
        [
            "[Script Info]",
            "ScriptType: v4.00+",
            f"PlayResX: {width}",
            f"PlayResY: {height}",
            "WrapStyle: 0",
            "ScaledBorderAndShadow: yes",
            "",
            "[V4+ Styles]",
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
            "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, "
            "MarginR, MarginV, Encoding",
            f"Style: Default,{font},{size},{primary},{primary},&H00000000&,&H64000000&,-1,0,0,0,100,100,0,0,1,{border},0,2,"
            f"{round(width * 0.06)},{round(width * 0.06)},{margin_v},-1",  # -1: libass picks each line's direction (RTL for Arabic)
            "",
            "[Events]",
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
        ]
    )
    events = []
    for c in chunks:
        rtl = bool(ARABIC.search(c.text))
        parts = []
        for i, w in enumerate(c.words):
            safe = re.sub(r"[{}\\]", "", w)
            t = isolate_latin(safe) if rtl else safe
            parts.append(f"{{\\c{hi}}}{t}{{\\c{primary}}}" if i == c.keyword else t)
        # a short pop-in so each chunk lands with the voice
        # RLM makes the line right-to-left even when it starts with a number or an English word
        line = (RLM if rtl else "") + " ".join(parts)
        events.append(f"Dialogue: 0,{ass_time(c.start)},{ass_time(c.end)},Default,,0,0,0,,{{\\fscx92\\fscy92\\t(0,90,\\fscx100\\fscy100)}}{line}")
    return f"{header}\n" + "\n".join(events) + "\n"


# ---------------------------------------------------------------- media

def need(tool: str) -> None:
    if not shutil.which(tool):
        sys.exit(f"{tool} is not installed. Install ffmpeg first (https://ffmpeg.org/download.html).")


def video_size(path: Path) -> tuple[int, int]:
    need("ffprobe")
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:stream_side_data=rotation",
         "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    info = json.loads(out)["streams"][0]
    w, h = int(info["width"]), int(info["height"])
    rot = next((abs(int(d.get("rotation", 0))) for d in info.get("side_data_list", []) if "rotation" in d), 0)
    return (h, w) if rot in (90, 270) else (w, h)


def extract_audio(video: Path, wav: Path) -> None:
    need("ffmpeg")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", str(wav)], check=True)


def transcribe(audio: Path, model_name: str, language: str, prompt: str | None) -> list[Word]:
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("faster-whisper is not installed. Run: pip install faster-whisper")
    device, compute = "cpu", "int8"
    try:
        import ctranslate2

        if ctranslate2.get_cuda_device_count() > 0:
            device, compute = "cuda", "float16"
    except Exception:
        pass
    def run(device: str, compute: str) -> list[Word]:
        print(f"Loading {model_name} on {device}…", file=sys.stderr)
        model = WhisperModel(model_name, device=device, compute_type=compute)
        segments, _ = model.transcribe(
            str(audio), language=language, word_timestamps=True, vad_filter=True, initial_prompt=prompt, beam_size=5
        )
        words: list[Word] = []
        for seg in segments:
            for w in seg.words or []:
                words.append(Word(w.word.strip(), w.start, w.end))
            print(f"  {seg.end:6.1f}s  {seg.text.strip()[:70]}", file=sys.stderr)
        return words

    try:
        return run(device, compute)
    except Exception as e:  # e.g. a GPU without the right CUDA/cuDNN libraries
        if device == "cpu":
            raise
        print(f"GPU failed ({e}); trying again on the CPU (slower).", file=sys.stderr)
        return run("cpu", "int8")


def ensure_font(font: str, fonts_dir: Path) -> Path:
    fonts_dir.mkdir(parents=True, exist_ok=True)
    if any(fonts_dir.glob("*.[ot]tf")) and any(font.split()[0].lower() in p.name.lower() for p in fonts_dir.iterdir()):
        return fonts_dir
    url = FONT_URLS.get(font)
    if url:
        target = fonts_dir / Path(urllib.request.unquote(url)).name.replace("[", "_").replace("]", "_").replace(",", "_")
        if not target.exists():
            print(f"Downloading font {font}…", file=sys.stderr)
            try:
                urllib.request.urlretrieve(url, target)
            except Exception as e:  # offline: libass falls back to a system font
                print(f"  could not download the font ({e}); using a system font", file=sys.stderr)
    return fonts_dir


def burn(video: Path, ass: Path, out: Path, fonts_dir: Path, crf: int = 20) -> None:
    need("ffmpeg")
    # run inside the .ass folder so the filter path has no characters that need escaping
    rel_fonts = os.path.relpath(fonts_dir, ass.parent).replace("\\", "/")
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-stats", "-i", str(video.resolve()), "-vf", f"ass={ass.name}:fontsdir={rel_fonts}",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", str(crf), "-pix_fmt", "yuv420p", "-c:a", "copy", str(out.resolve())],
        check=True, cwd=ass.parent,
    )


# ---------------------------------------------------------------- CLI

def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Arabic auto-captions: keyword captions burned into your video.")
    p.add_argument("video", type=Path, help="input video (mp4, mov…)")
    p.add_argument("-o", "--output", type=Path, help="output video (default: <name>.captioned.mp4)")
    p.add_argument("--model", default="large-v3-turbo", help="faster-whisper model or a CTranslate2 model path (default: large-v3-turbo)")
    p.add_argument("--language", default="ar", help="spoken language code (default: ar)")
    p.add_argument("--prompt", help="words to help recognition, e.g. names or English terms you say")
    p.add_argument("--words-json", type=Path, help="skip recognition: a JSON list of {text,start,end} words")
    p.add_argument("--words", type=int, default=3, help="max words per caption (default: 3)")
    p.add_argument("--font", default="Changa", help=f"font name (auto-downloaded: {', '.join(FONT_URLS)})")
    p.add_argument("--fonts-dir", type=Path, default=Path.home() / ".cache" / "arabic-autocaptions" / "fonts")
    p.add_argument("--size", type=int, help="font size in pixels (default: by video height)")
    p.add_argument("--color", default="#FFFFFF", help="text color (default: #FFFFFF)")
    p.add_argument("--highlight", default="#7FB069", help="keyword color (default: #7FB069)")
    p.add_argument("--position", type=float, help="distance from the bottom as a fraction of the height (default 0.27 vertical, 0.12 landscape)")
    p.add_argument("--keep-fillers", action="store_true", help="keep يعني، اممم… in the captions")
    p.add_argument("--arabic-digits", action="store_true", help="keep Arabic-Indic digits instead of 0-9")
    p.add_argument("--no-burn", action="store_true", help="only write .ass and .srt")
    p.add_argument("--version", action="version", version=__version__)
    a = p.parse_args(argv)

    if not a.video.exists():
        p.error(f"{a.video} not found")
    out = a.output or a.video.with_name(f"{a.video.stem}.captioned.mp4")
    base = out.with_suffix("")

    if a.words_json:
        raw = json.loads(a.words_json.read_text(encoding="utf8"))
        words = [Word(str(w["text"]), float(w["start"]), float(w["end"])) for w in raw]
    else:
        wav = base.with_suffix(".wav")
        extract_audio(a.video, wav)
        try:
            words = transcribe(wav, a.model, a.language, a.prompt)
        finally:
            wav.unlink(missing_ok=True)
        Path(f"{base}.words.json").write_text(
            json.dumps([w.__dict__ for w in words], ensure_ascii=False, indent=1), encoding="utf8"
        )

    chunks = make_chunks(words, a.words, latin_digits=not a.arabic_digits, remove_fillers=not a.keep_fillers)
    if not chunks:
        sys.exit("No speech found.")
    width, height = video_size(a.video)
    ass = Path(f"{base}.ass")
    ass.write_text(
        to_ass(chunks, width, height, a.font, a.size, a.color, a.highlight, a.position), encoding="utf8"
    )
    Path(f"{base}.srt").write_text(to_srt(chunks), encoding="utf8")
    print(f"{len(chunks)} captions → {ass.name}, {base.name}.srt", file=sys.stderr)
    if not a.no_burn:
        burn(a.video, ass, out, ensure_font(a.font, a.fonts_dir))
        print(f"Done: {out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
