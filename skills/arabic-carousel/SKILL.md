---
name: arabic-carousel
description: Write an Instagram or LinkedIn carousel in Arabic, slide by slide, with a cover that earns the swipe, one idea per slide and a save-worthy last slide. Use when someone asks for a carousel, "كاروسيل", "سلايدات", "بوست سحب", or wants to turn a list or a guide into slides.
---

# Arabic carousel

A carousel is read, not watched. People decide on the cover, swipe if each slide pays off, and save it if the last slide is useful on its own.

## Gather

- Topic and the single promise of the carousel ("5 تطبيقات لسيارتك BYD", "كيف تكتب هوك").
- Audience and dialect (light Fusha reads best for LinkedIn; dialect works on Instagram).
- Real material: steps, screenshots, numbers, examples. Do not invent stats; mark `[source needed]` if a claim needs one.
- Number of slides: 6 to 10 (default 8).

## Slide plan

| Slide | Job | Words |
| --- | --- | --- |
| 1 Cover | Promise + number or tension. 6 words max on the main line. | ≤ 12 |
| 2 Hook-in | Why this matters, or the mistake most people make. | ≤ 25 |
| 3 to N-2 | One idea per slide: a short title + 1 to 2 lines + a visual note. | ≤ 35 |
| N-1 Summary | The whole carousel in one checklist. | ≤ 40 |
| N CTA | One action: save, share, or comment a keyword. | ≤ 15 |

## Rules

1. Cover text must be readable on a phone grid thumbnail: big, few words, high contrast.
2. Each slide title is a complete thought someone could screenshot.
3. Right-to-left order: slide content reads right to left; arrows that invite swiping point left (←).
4. English names in English letters (CapCut, BYD), digits 0-9.
5. No dashes or slashes in titles.
6. Every slide gets a visual note: a real screenshot, a product photo, an icon, or a simple diagram.

## Output

For each slide: **Title**, **Body**, **Visual**. Then a caption (first line = the cover promise in new words, 3 lines of context, the CTA, up to 5 hashtags), and an alt text for slide 1.

If the `arabic-social` package is available, run the caption through `checkPost(caption, "instagram")` before handing it over.
