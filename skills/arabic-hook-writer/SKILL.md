---
name: arabic-hook-writer
description: Write scroll-stopping opening lines (hooks) in Arabic dialects or English for Reels, TikTok and YouTube Shorts, then score and improve them. Use when someone asks for a hook, an opening line, "أول جملة", "هوك", or a stronger start for a short video.
---

# Arabic hook writer

A hook is the first sentence of a short video. It has about 3 seconds to stop the scroll, so it is one line, spoken, with no warm-up.

## 1. Get what you need (ask only for what is missing)

- **Topic**: what the video is about, in one sentence.
- **Viewer**: who should stop scrolling (beginner creators, car owners in UAE, small business owners…).
- **Dialect**: Jordanian, Egyptian, Gulf, Syrian, Maghrebi, Fusha, or English. If the user writes in a dialect, use that dialect.
- **A real fact**: a number, a result, a moment that actually happened. Never invent one. If there is none, write hooks that do not need it.

## 2. Write 5 options, one per family

| Family | Job | Jordanian example |
| --- | --- | --- |
| صدمة Shock | break a belief | الخوارزمية مش عدوّك… البداية تبعك هي المشكلة. |
| فضول Curiosity | open a gap | الفرق بين مليون مشاهدة و100 مشاهدة… جملة وحدة. |
| وعد Promise | a concrete result, fast | في 20 ثانية رح تتعلّم تكتب هوك قوي. |
| تحدّي Challenge | call out the viewer | إذا عندك أقل من ألف متابع، ما تتخطّى هالفيديو. |
| قصة Story | start mid-moment | كنت رح أوقّف الصفحة… لولا فيديو واحد. |

More examples: the [arabic-hooks](../../packages/arabic-hooks) dataset (`npx arabic-hooks list curiosity`).

## 3. Rules every hook must pass

1. **12 words or fewer.** It must fit in the first 3 seconds when spoken.
2. **No greeting, no intro.** Never start with مرحبا، السلام عليكم، يا جماعة، "في هذا الفيديو", "hi guys".
3. **Talk to one person**: إنت، عندك، إلك / you, your.
4. **A real number beats a vague word** (30 يوم, 47 مشاهدة, 3 خطوات). Only use numbers the user gave you.
5. **Tension**: a question, a "…" pause, or a contrast (بس، لولا، بينما).
6. **English words stay in English letters** (YouTube, AI, iPhone), never Arabic transliteration. Digits are 0-9.
7. **No dashes or slashes** in the hook. Use "…" or a comma.
8. **The video must deliver what the hook promises.** No clickbait the content cannot pay off.

## 4. Score and improve

For each option, give a score out of 100 and one sentence on how to make it stronger. If the `arabic-hooks` package is available, use its scorer:

```bash
npx arabic-hooks score "جرّبت هالشي 30 يوم… والنتيجة صدمتني"
```

The scorer checks length, weak openers, talking to the viewer, a number and tension. Treat it as a checklist, not a prediction of views.

## 5. Output format

```
1. [صدمة] الهوك — 85/100
   ليش بيشتغل: …
   أقوى لو: …
```

End by recommending one option and the on-screen text for it (3 to 5 words max).
