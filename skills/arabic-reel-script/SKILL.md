---
name: arabic-reel-script
description: Turn a raw idea into a ready-to-shoot Arabic Reel, TikTok or Short script with a hook, timed beats, on-screen text, B-roll notes and one call to action. Use when someone wants a reel script, "سكربت ريل", "اكتبلي فيديو", or a short video in an Arabic dialect.
---

# Arabic reel script

Write scripts the creator can read aloud once and film. Spoken dialect, short sentences, one idea per beat.

## Before writing, confirm

- **Idea** in one line and **who it is for**.
- **Length**: 30, 45 or 60 seconds (default 45). Spoken Arabic runs about 2.3 words per second, so 45 s ≈ 100 words.
- **Dialect** (default: the dialect the user writes in).
- **Proof**: real results, numbers, screenshots or clips the creator has. Do not invent statistics. If a claim needs a source, mark it `[source needed]`.
- **The one action** the viewer should take (save, comment a word, follow, link in bio). One only.

## Structure

| Beat | Time (45 s) | Job |
| --- | --- | --- |
| Hook | 0–3 s | Stop the scroll. Use the arabic-hook-writer rules. |
| Stakes | 3–8 s | Why this matters to the viewer, in their words. |
| Value 1–3 | 8–38 s | One point per beat. Each point = claim + concrete example or proof. |
| Payoff | 38–42 s | Deliver exactly what the hook promised. |
| CTA | 42–45 s | One action, said naturally. |

## Writing rules

1. Write how people talk, not how they write: هاد، هيك، رح، شو (or the dialect's equivalent).
2. Sentences of 4 to 10 words. Cut every word that does not move the story.
3. **Every sentence needs something on screen**: the product, a screenshot, the creator doing the step. If the creator says "plug in the USB", the clip shows the USB going in.
4. When a product, app or car model is named, show the real thing, not an icon.
5. English words in English letters (Claude, CapCut, BYD Seal); digits 0-9.
6. Numbers and claims must come from the creator or a cited source.
7. Do not attack named companies or quote their prices to make a point; keep comparisons generic unless the creator insists and has the facts.
8. No dashes or slashes in titles or on-screen text.

## Output

A table, one row per beat:

| Time | Spoken (dialect) | On-screen text (≤ 5 words) | Visual / B-roll | Sound |
| --- | --- | --- | --- | --- |

Then:

- **Caption**: first line repeats the hook idea in different words, then 2 to 3 lines of value, then the CTA. 3 relevant hashtags max.
- **Cover text**: 2 to 4 words.
- **Word count and estimated duration.**
- **Keyword captions**: after filming, export the transcript as SRT and run `npx arabic-captions talk.srt -f ass -o talk.ass` (see the arabic-keyword-captions skill).
