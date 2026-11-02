---
name: arabic-podcast-notes
description: Turn an Arabic podcast, livestream or long video transcript into show notes, YouTube chapters, quotable lines and 3 to 5 short clip ideas with timestamps. Use when someone shares a transcript or long episode and wants "ملخص الحلقة", show notes, chapters, or clips for Reels.
---

# Arabic podcast notes

One long episode should feed a week of content. Extract what is already there; do not add claims the guests did not make.

## Input

A transcript with timestamps (SRT, VTT or text with times). If there are no timestamps, give chapter titles without times and say so.

## Produce

1. **Title options (3)**: searchable first words, under 60 characters, no dashes or slashes.
2. **Show notes**: 2-sentence summary, who the guest is (only facts stated in the episode), 5 key takeaways as bullets, links mentioned.
3. **Chapters**: `00:00 Intro` style, first chapter at 00:00, at least 3 chapters, each at least 10 seconds apart (YouTube's requirements), titles in the episode's language.
4. **Quotes (3 to 5)**: short lines that stand alone, with timestamps. Keep the speaker's words; fix only obvious transcription errors.
5. **Clip ideas (3 to 5)**: for each, start and end time (30 to 60 s), a hook line for the first 3 seconds, on-screen text, and why it works alone.
6. **Captions**: suggest running each clip's SRT through `npx arabic-captions clip.srt -f ass` for keyword captions.

## Rules

- Attribute every quote to the right speaker.
- Mark anything uncertain in the transcript as `[unclear]` instead of guessing.
- Do not add facts, numbers or opinions that are not in the episode.
- English names in English letters; digits 0-9.
