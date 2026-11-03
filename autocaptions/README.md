# كابشن عربي أوتوماتيك / Arabic Auto Captions

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/moathalherani/arabic-creator-kit/blob/main/autocaptions/Arabic_AutoCaptions.ipynb)

حط فيديو، وبيطلعلك نفس الفيديو مع **كابشن كلمات مفتاحية بالعربي** محروق عليه. مجاني، وبيشتغل من المتصفح على Google Colab بدون ما تنزّل إشي.

Drop in a video, get it back with short **Arabic keyword captions** burned in. Free, runs in your browser on Google Colab.

## What it does / شو بيعمل

- Recognises Arabic speech (dialects included) with word timestamps, using [faster-whisper](https://github.com/SYSTRAN/faster-whisper).
- Short captions of 1 to 3 words that land with the voice, not long subtitle lines.
- Highlights the strongest word in each caption: numbers first, then English words, then the longest word.
- Removes fillers (يعني، اممم، um), uses 0-9 digits.
- Keeps English words and numbers in the right order inside Arabic lines, a common problem in editors.
- Writes `.srt` and `.ass` too, so you can keep editing in CapCut, Premiere or DaVinci.

## Use it on Colab (no setup)

Click **Open in Colab** above, switch the runtime to a free T4 GPU, run the cells, upload your video, download the result.

## Use it on your computer

Needs Python 3.9+ and [ffmpeg](https://ffmpeg.org/download.html).

```bash
pip install faster-whisper
python arabic_autocaptions.py my-reel.mp4
# → my-reel.captioned.mp4, my-reel.captioned.srt, my-reel.captioned.ass, my-reel.captioned.words.json
```

Options:

| Option | Default | What it does |
| --- | --- | --- |
| `--words` | `3` | Max words per caption |
| `--font` | `Changa` | `Changa`, `Noto Kufi Arabic`, `Cairo`, `Tajawal` or `Kufam` are downloaded automatically |
| `--color` / `--highlight` | `#FFFFFF` / `#7FB069` | Text and keyword colors |
| `--position` | `0.27` vertical, `0.12` landscape | Distance from the bottom, as a fraction of the height |
| `--model` | `large-v3-turbo` | Any faster-whisper model, or a path to a CTranslate2 model (e.g. a dialect fine-tune) |
| `--prompt` | | Names or English terms you say, to help recognition |
| `--words-json` | | Skip recognition and use your own `[{"text","start","end"}]` words |
| `--keep-fillers`, `--arabic-digits`, `--no-burn` | | Self-explanatory |

`--words-json` lets you plug in any speech recognizer. Adding a backend for [Cohere Transcribe Arabic](https://cohere.com/blog/transcribe-arabic) or a dialect fine-tune is a great first contribution.

## Tests

```bash
python -m unittest discover autocaptions
```

MIT. Part of [Arabic Creator Kit](https://github.com/moathalherani/arabic-creator-kit).
