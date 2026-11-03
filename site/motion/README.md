# استوديو الموشن / Motion Studio

**جرّبه:** https://moathalherani.github.io/arabic-creator-kit/motion/

Pick a template, type your words, download an MP4 (or WebM) and drop it over your video in CapCut or Premiere. Everything runs in the browser on a `<canvas>`; nothing is uploaded.

اختار قالب، اكتب كلامك، ونزّل الفيديو. كل إشي بيصير بمتصفحك.

## Add a template / ضيف قالبك

Each template is **one file** in [`templates/`](templates/). Add `templates/<your-id>.js`, open a pull request, and it appears in the studio (the index is generated at build time). Your name goes on the contributors list.

```js
import { enter, prog, ease, text } from "../engine.js";

export default {
  id: "my-template",               // same as the file name
  name: "اسم القالب",              // shown on the button
  description: "سطر بيشرح متى تستخدمه.",
  duration: 3,                     // seconds
  fields: [                        // what people type
    { key: "title", label: "العنوان", type: "text", default: "نص تجريبي" },
    // types: "text", "textarea", "number", "image"
  ],
  cues: [{ t: 0.4, sfx: "Impact", note: "متى" }],  // suggested sound effects
  draw(ctx, t, props, env) {
    // t: seconds from the start. env: W, H, u (1% of the short side), theme, accent, danger, font
    ctx.save();
    enter(ctx, env, t);            // the 3D turn into the scene
    ctx.globalAlpha *= 1 - prog(t, this.duration - 0.35, 0.35);  // fade out
    text(ctx, env, props.title, env.W / 2, env.H / 2, { size: env.u * 9, weight: 800, color: env.accent });
    ctx.restore();
  },
};
```

Rules that keep the studio consistent:

- Size everything with `env.u` so it works in 9:16, 1:1 and 16:9.
- Use `env.theme.ink`, `env.theme.card`, `env.accent`, `env.onAccent` (text on the accent) and `env.danger`, never fixed colors, so every background and palette works. Use `env.font` for every `ctx.font`: it holds the English font then the Arabic one.
- Arabic text goes through `text()` or `layoutWords()` from `engine.js`, which handle right-to-left.
- Keep it under 6 seconds, one idea per template, and fade out at the end.
- Check it with `npm run check:motion`.

## Engine helpers

`engine.js` exports: `FORMATS`, `BACKGROUNDS`, `FONTS`, `ease` (`out`, `inOut`, `back`), `prog`, `roundRect`, `drawGrid`, `ring` (the glow ring on the floor, keep it rare), `enter` (3D scene entry), `shake` (for Deep Drop or Impact), `layoutWords` (per-word animation, right-to-left), `wrapLines`, `text`, `card`, `renderFrame`.

MIT. Part of [Arabic Creator Kit](https://github.com/moathalherani/arabic-creator-kit).
