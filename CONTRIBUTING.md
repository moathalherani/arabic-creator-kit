# Contributing / المساهمة

Thank you for helping Arabic creators and developers. Every contribution counts, from one hook in your dialect to a new package.

شكراً إنك بتساهم. كل مساهمة بتفرق، من هوك واحد بلهجتك لأداة كاملة.

## Easiest first contribution: hooks in your dialect / أسهل مساهمة

1. Fork the repo and open `packages/arabic-hooks/src/hooks-data.js`.
2. Add entries at the end, for example:

   ```json
   {
     "id": "curiosity-eg-001",
     "category": "curiosity",
     "dialect": "eg",
     "ar": "في سبب محدش بيقولهولك عن الريلز…",
     "en": "There's a reason nobody tells you about reels…"
   }
   ```

   - `category`: `shock`, `curiosity`, `promise`, `challenge` or `story`
   - `dialect`: `jo`, `eg`, `gulf`, `sy`, `ma`, `msa` (or propose a new code)
   - `id`: `<category>-<dialect>-<3 digits>`, unique. (The original Jordanian set uses `<category>-<3 digits>`.)
   - Lines must be your own, 12 words or fewer, with no greeting at the start.
3. Run `npm test`, then open a pull request.

Not on GitHub much? Open a "Hooks in my dialect" issue and we will add them for you, with credit.

## Code

- Node 18+, no runtime dependencies. Keep it that way unless there is a strong reason.
- Plain ES modules with hand-written `.d.ts` types next to the source.
- Tests use the built-in `node:test`: `npm test`.
- Skills: one folder per skill in `skills/`, with a `SKILL.md` whose `name` matches the folder. Check with `npm run check:skills`.

## Good first issues

Look for the [`good first issue`](https://github.com/moathalherani/arabic-creator-kit/labels/good%20first%20issue) label. Ideas that are always welcome:

- Hooks in Egyptian, Gulf, Syrian, Maghrebi or Fusha
- Better transliteration in `arabic-seo` (e.g. for names)
- More filler words per dialect in `arabic-captions`
- New skills (podcast show notes, product reviews, real estate listings…)

## Code of conduct

Be kind and specific. Critique the work, not the person. No harassment of any kind.
