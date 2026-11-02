# Community hooks / هوكس المجتمع

The easiest way to add a hook is the page **[ضيف هوكك](https://moathalherani.github.io/arabic-creator-kit/contribute/)**: write it, pick the dialect, and it opens GitHub with the file ready. Press **Propose new file**, then **Create pull request**.

أسهل طريقة: افتح صفحة [ضيف هوكك](https://moathalherani.github.io/arabic-creator-kit/contribute/)، اكتب الهوك واختار لهجتك، وبتفتحلك GitHub والملف جاهز. اكبس **Propose new file** وبعدها **Create pull request**.

Each file in this folder holds one hook:

```json
{
  "category": "curiosity",
  "dialect": "eg",
  "ar": "في سبب محدش بيقولهولك عن الريلز…",
  "en": "There's a reason nobody tells you about reels…"
}
```

- `category`: `shock`, `curiosity`, `promise`, `challenge` or `story`
- `dialect`: `jo`, `eg`, `gulf`, `sy`, `ma` or `msa`
- `en` is optional.

CI checks the file (`node scripts/merge-hooks.js --check`). After the pull request is merged, a workflow gives the hook its id, moves it into `packages/arabic-hooks/src/hooks-data.js` and deletes the file here.
