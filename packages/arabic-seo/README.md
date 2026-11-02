# arabic-seo

SEO helpers for Arabic + English websites. Readable Arabic slugs, hreflang tags, JSON-LD that is safe to drop into a `<script>` tag, and the small text fixes Arabic sites always need (digits, tashkeel, direction). Zero dependencies, works in Node, Deno, Bun, edge runtimes and the browser.

أدوات SEO للمواقع العربية والإنجليزية: روابط عربية مقروءة، hreflang، وJSON-LD آمن، وتنظيف الأرقام والتشكيل.

```bash
npm install arabic-seo
```

## Slugs

```js
import { slugify } from "arabic-seo";

slugify("دليل تطبيقات BYD الكامل ٢٠٢٦!");
// "دليل-تطبيقات-byd-الكامل-2026"   (tashkeel removed, digits converted)

slugify("سيارات كهربائية", { transliterate: true });
// "syarat-khrbaeya"

slugify(longTitle, { maxLength: 60 }); // cuts on a word boundary
```

Google reads Arabic URLs fine and browsers show them decoded, so keeping Arabic is usually the better choice for Arabic pages. Use `transliterate` when a platform only accepts Latin characters.

## hreflang

```js
import { hreflangLinks, hreflangHtml } from "arabic-seo";

hreflangHtml(
  { ar: "https://example.com/ar/guide", en: "https://example.com/en/guide" },
  { xDefault: "ar" },
);
// <link rel="alternate" hreflang="ar" href="https://example.com/ar/guide" />
// <link rel="alternate" hreflang="en" href="https://example.com/en/guide" />
// <link rel="alternate" hreflang="x-default" href="https://example.com/ar/guide" />
```

It throws on relative URLs and invalid codes, the two mistakes Search Console flags most.

## JSON-LD

```js
import { personJsonLd, articleJsonLd, faqJsonLd, videoJsonLd, jsonLdScript } from "arabic-seo";

jsonLdScript(
  personJsonLd({
    name: "Moath Alherani",
    alternateName: "معاذ الهريني",
    url: "https://moathalherani.com",
    jobTitle: "Content Creator",
  }),
);

articleJsonLd({ headline: "دليل الهوكس", datePublished: "2026-11-02", author: "Moath Alherani" });
// inLanguage is detected as "ar" automatically

videoJsonLd({ name: "…", thumbnailUrl: "https://…", uploadDate: "2026-11-02", duration: 95 }); // "PT1M35S"
faqJsonLd([{ question: "شو هو الهوك؟", answer: "أول جملة بالفيديو." }]);
```

Empty fields are dropped. `jsonLdString` and `jsonLdScript` escape `<`, `>`, `&` and line separators, so user content can never close the script tag.

## Text helpers

| Function | Does |
| --- | --- |
| `toLatinDigits("٢٠٢٦")` | `"2026"` (also Persian digits) |
| `toArabicDigits("2026")` | `"٢٠٢٦"` |
| `stripTashkeel(text)` | removes diacritics and ـ |
| `normalizeArabic(text)` | for search: unifies أ إ آ → ا, ة → ه, ى → ي |
| `detectDirection(text)` | `"rtl"` or `"ltr"` from the first strong letter |
| `arabicRatio(text)` | share of Arabic letters, 0 to 1 |
| `metaDescription(text, 155)` | trims without cutting a word, adds … |
| `readingTime(text)` | minutes; 180 wpm for Arabic, 230 for English |

## License

MIT © [Eng. Moath Alherani](https://moathalherani.com)
