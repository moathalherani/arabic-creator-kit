# arabic-dates

Arabic dates for apps, websites and content calendars. Month names the way each region says them, Hijri dates on the Umm al-Qura calendar, the year's Ramadan and Eid planning dates, and "time ago" with correct Arabic dual and plural. Zero dependencies (uses the built-in `Intl` calendar).

تواريخ عربية للتطبيقات وجداول المحتوى: أسماء الأشهر حسب كل منطقة، التاريخ الهجري، مواعيد رمضان والعيد، و«منذ دقيقتين» بقواعد صحيحة.

```bash
npm install arabic-dates
```

## Usage

```js
import { formatDate, formatHijri, islamicOccasions, timeAgo } from "arabic-dates";

formatDate("2026-11-02", { months: "levant", weekday: true }); // "الاثنين 2 تشرين الثاني 2026"
formatDate("2026-11-02", { months: "both" });                  // "2 تشرين الثاني (نوفمبر) 2026"
formatDate("2026-08-15", { months: "maghreb" });               // "15 أوت 2026"

formatHijri("2026-11-02");                                     // "22 جمادى الأولى 1448 هـ"

islamicOccasions(2027).map((o) => `${o.ar}: ${o.date.toISOString().slice(0, 10)}`);
// ["الإسراء والمعراج: 2027-01-05", "بداية رمضان: 2027-02-08", "عيد الفطر: 2027-03-09", …]

timeAgo(postDate);                         // "منذ دقيقتين", "منذ 3 أيام", "أمس"
timeAgo(postDate, { style: "levant" });    // "قبل 3 أيام", "مبارح", "هلأ"
```

## Month names

| Style | Used in | January |
| --- | --- | --- |
| `standard` (default) | Egypt, Gulf, most media | يناير |
| `levant` | Jordan, Palestine, Syria, Lebanon, Iraq | كانون الثاني |
| `maghreb` | Algeria, Tunisia | جانفي |
| `both` | Levant + standard together | كانون الثاني (يناير) |

## Hijri dates, honestly

`toHijri`, `fromHijri` and `islamicOccasions` use the Umm al-Qura calendar from your runtime's `Intl` data. Official start dates for Ramadan and the Eids are announced after moon sighting and can differ by a day between countries, so use them for planning content, not for religious rulings.

Requires a runtime with full ICU (Node 18+, modern browsers, Deno, Bun).

## License

MIT © [Eng. Moath Alherani](https://moathalherani.com)
