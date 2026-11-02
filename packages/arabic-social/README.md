# arabic-social

Caption helpers for Arabic creators and the apps they use. Turn phrases into Arabic hashtags that actually work, check a caption against each platform's limits (including X's weighted count), see what shows before "…more", strip hidden characters from copy-paste, and keep blank lines in Instagram captions. Zero dependencies.

أدوات للكابشن: هاشتاقات عربية صحيحة، فحص طول النص لكل منصة، شو بيبيّن قبل «المزيد»، تنظيف الرموز المخفية، والحفاظ على الأسطر الفاضية بانستقرام.

```bash
npm install arabic-social
```

## Usage

```js
import { hashtag, hashtags, checkPost, cleanCaption, keepLineBreaks } from "arabic-social";

hashtag("سيارات كهربائية!");     // "#سيارات_كهربائية"
hashtag("صُنّاع المحتوى ٢٠٢٦"); // "#صناع_المحتوى_2026"

hashtags(["دبي", "#دبى", "سيارة كهربائية", "سياره كهربائيه", "BYD", "byd", "ريلز", "محتوى", "تقنية"]);
// ["#دبي", "#سيارة_كهربائية", "#BYD", "#ريلز", "#محتوى"]  (deduplicated, capped at Instagram's 5)

checkPost(caption, "instagram");
// { length: 812, limit: 2200, remaining: 1388, ok: true, hashtags: [...], preview: "first line people see", problems: [] }

checkPost(tweet, "x"); // uses X's weighted count: URLs = 23, emoji = 2, Arabic = 1

keepLineBreaks("السطر الأول\n\nالسطر الثاني"); // blank lines survive on Instagram
cleanCaption(textFromChatGPT);                 // removes zero-width and direction characters
```

## Limits

| Platform | Caption | Other |
| --- | --- | --- |
| Instagram | 2,200 | 5 hashtags, 20 mentions, bio 150 |
| TikTok | 2,200 | |
| YouTube / Shorts | 5,000 | title 100 |
| X | 280 (weighted) | |
| Threads | 500 | |
| LinkedIn | 3,000 | headline 220 |
| Facebook | 63,206 | |
| Snapchat Spotlight | 500 | |
| Pinterest | 800 | title 100 |

Checked in 2026 against platform documentation and scheduling tools. Platforms change these numbers; if one is out of date, open an issue or a pull request against `PLATFORMS`. The "…more" preview lengths are approximate because apps vary by screen size.

## License

MIT © [Eng. Moath Alherani](https://moathalherani.com)
