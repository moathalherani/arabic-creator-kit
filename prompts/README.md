# برومبتات عربية / Arabic prompts

برومبتات عربية جاهزة لـ ChatGPT وClaude وأي مساعد ذكاء اصطناعي، لصنّاع المحتوى العرب وللشغل والدراسة.
**شوفها وانسخها بكبسة:** https://moathalherani.github.io/arabic-creator-kit/prompts/

Ready-to-use Arabic prompts for ChatGPT, Claude and other assistants. Browse and copy them on the [prompts page](https://moathalherani.github.io/arabic-creator-kit/prompts/).

## ضيف برومبتك / Add yours

أسهل طريقة: النموذج بآخر [صفحة البرومبتات](https://moathalherani.github.io/arabic-creator-kit/prompts/#add). بيفتحلك GitHub والملف جاهز.

Each prompt is one file in this folder, `prompts/<latin-slug>.md`:

```markdown
---
title: كاتب وصف منتجات
category: business
for: وصف بيبيع للمتجر أو الإعلان
---

اكتبلي وصف منتج لـ [المنتج]…
```

- `category`: `content`, `business`, `writing`, `learning`, `personal` or `tech`
- Write the prompt in Arabic, and put `[ ]` around the parts people replace.
- It must be your own wording. Check it with `npm run check:prompts`.

Some prompts are inspired by [prompts.chat](https://github.com/f/prompts.chat) (CC0, public domain) and rewritten in Arabic for Arab creators.
