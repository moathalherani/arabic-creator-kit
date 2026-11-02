# arabic-hooks

Arabic + English opening lines ("hooks") for Reels, TikTok and YouTube Shorts: a curated dataset, fill-in templates and a transparent hook scorer. Zero dependencies, works in Node and the browser.

هوكس عربية وإنجليزية جاهزة لبداية الريلز والتيك توك والشورتس، مع قوالب تعبّيها بنفسك وأداة بتقيّم الهوك تبعك.

```bash
npm install arabic-hooks
# or try it without installing
npx arabic-hooks
npx arabic-hooks score "جرّبت هالشي 30 يوم… والنتيجة صدمتني"
```

## Usage

```js
import { getHooks, randomHook, templates, fillTemplate, scoreHook } from "arabic-hooks";

randomHook({ category: "curiosity" }).ar;
// "الفرق بين مليون مشاهدة و100 مشاهدة… جملة وحدة."

getHooks({ category: "story", dialect: "jo" }); // filter by category and dialect
getHooks({ search: "خوارزمية" });               // Arabic-aware search (ignores tashkeel, أ/إ/ا, ة/ه)

const t = templates.find((t) => t.id === "t-days");
fillTemplate(t, { thing: "الصيام المتقطع", days: 30 });
// "جرّبت الصيام المتقطع لمدة 30 يوم… والنتيجة صدمتني."
fillTemplate(t, { thing: "cold showers", days: 7 }, "en");

scoreHook("مرحبا يا جماعة اليوم رح نحكي عن موضوع");
// { score: 30, words: 8, tips: [{ ar: "ابدأ بالفكرة مباشرة…", en: "Start with the idea…" }, …] }
```

## Endings that ask for one thing / خاتمة الفيديو

```js
import { getCtas, fillTemplate } from "arabic-hooks";

getCtas({ intent: "save" })[0].ar; // "احفظ الفيديو عشان ترجعله وقت ما تحتاجه."
fillTemplate(getCtas({ intent: "comment" })[0], { keyword: "دليل", gift: "الملف" });
// "اكتب «دليل» بالتعليقات وببعتلك الملف."
```

Intents: `save`, `comment`, `share`, `follow`, `link`, `dm`, `try`. There are 30 hook templates and 14 call-to-action lines, all in Arabic and English.

## Categories / الأنواع

| key | عربي | When to use |
| --- | --- | --- |
| `shock` | صدمة | Break a belief the viewer holds |
| `curiosity` | فضول | Open a gap they need closed |
| `promise` | وعد | Promise a concrete result fast |
| `challenge` | تحدّي | Call out the viewer directly |
| `story` | قصة | Start in the middle of a real moment |

## Data shape

```json
{ "id": "shock-001", "category": "shock", "dialect": "jo", "ar": "…", "en": "…" }
```

The raw dataset is also available as `import data from "arabic-hooks/data"`.

## How `scoreHook` works

It is a heuristic, not a prediction. It starts at 40 and checks: length (12 words or fewer), a weak opener (greetings, "in this video"), whether it talks to the viewer, a concrete number, and tension (a question, an ellipsis or a contrast). Every point it takes away comes with a tip in Arabic and English.

## Contribute a dialect / ساهم بلهجتك

The first 50 hooks are Jordanian (`jo`). We want Egyptian, Gulf, Syrian, Maghrebi and Fusha versions. Open a pull request that adds entries to `src/hooks-data.js` with your dialect code. See [CONTRIBUTING](../../CONTRIBUTING.md).

بدنا هوكس باللهجة المصرية والخليجية والسورية والمغاربية والفصحى. افتح Pull Request وضيف هوكس بلهجتك.

## License

MIT © [Eng. Moath Alherani](https://moathalherani.com)
