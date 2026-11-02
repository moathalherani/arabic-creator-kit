---
name: arabic-keyword-captions
description: Make short keyword captions for Arabic and English talking videos from an SRT or VTT transcript, with one highlighted word per caption, Latin digits and correct right-to-left rendering, and burn them in with ffmpeg. Use when someone wants captions, subtitles, "كابشن", or "ترجمة على الفيديو" for a reel.
---

# Arabic keyword captions

Continuous full-sentence subtitles are hard to read on a phone. Short captions (2 to 4 words) with one colored keyword keep the eye on the video.

## Steps

1. **Get a transcript as SRT or VTT.** From Whisper, CapCut, Premiere, DaVinci, Descript or YouTube Studio. Fix spelling of names and brands first.
2. **Make the captions**

   ```bash
   npx arabic-captions talk.srt -w 3 -f ass --font "Changa" --size 84 --highlight "#7FB069" -o talk.ass
   ```

   - `-w 2` for fast talkers, `-w 4` for slow ones.
   - The highlight picks numbers first, then English product names, then the most meaningful word.
   - Fillers like يعني and اممم are dropped; use `--keep-fillers` to keep them.
3. **Burn in**

   ```bash
   ffmpeg -i talk.mp4 -vf ass=talk.ass -c:a copy talk.captioned.mp4
   ```

   Install the font on the machine first. For a 1080×1920 video the default position sits in the lower third, above the platform UI.
4. **Check** three moments: the hook, any line with English words, and any number. Arabic should read right to left with the English word in place.

## Choosing the highlight color

Pick one color from the video itself (a plant, a car, a wall) so the captions feel part of the shot. Keep text white with a dark outline. Use red only for a warning or a mistake, green for a solution or result.

## When editing by hand

- One idea per caption; never split a name like "BYD Seal" across two captions if you can avoid it.
- Digits 0-9; English words in English letters.
- Captions must not cover the speaker's face or the product being shown.
