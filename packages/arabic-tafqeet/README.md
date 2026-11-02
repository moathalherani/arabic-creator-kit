# arabic-tafqeet

Numbers and money amounts in Arabic words (تفقيط), written the way they appear on invoices, cheques, quotations and contracts. Handles gender agreement, dual, plural and the 11–99 form, and rounds money without floating point errors. Zero dependencies.

كتابة الأرقام والمبالغ بالحروف العربية للفواتير والشيكات والعقود، بالقواعد الصحيحة للمذكر والمؤنث والمثنى والجمع.

```bash
npm install arabic-tafqeet
npx arabic-tafqeet 1500 --only
# فقط ألف وخمسمائة درهم لا غير
```

## Usage

```js
import { amountToWords, toWords, countNoun } from "arabic-tafqeet";

amountToWords(1500);                         // "ألف وخمسمائة درهم"
amountToWords(25.5);                         // "خمسة وعشرون درهمًا وخمسون فلسًا"
amountToWords("1,250.75", { only: true });   // "فقط ألف ومائتان وخمسون درهمًا وخمسة وسبعون فلسًا لا غير"
amountToWords(0.75, { currency: "SAR" });    // "خمس وسبعون هللة"
amountToWords(103.003, { currency: "JOD" }); // "مائة وثلاثة دنانير وثلاثة فلوس"

toWords(250000);                       // "مائتان وخمسون ألفًا"
toWords(21, { gender: "f" });          // "إحدى وعشرون"
toWords(200, { hundred: "مئة" });      // "مئتان" (modern spelling)

countNoun(3, { one: "سيارة", two: "سيارتان", plural: "سيارات", acc: "سيارة", gender: "f" });
// "ثلاث سيارات"
```

## Currencies

| Code | Unit | Sub-unit |
| --- | --- | --- |
| `AED` (default) | درهم | فلس (1/100) |
| `SAR` | ريال | هللة (1/100) |
| `QAR` | ريال | درهم (1/100) |
| `OMR` | ريال | بيسة (1/1000) |
| `KWD`, `BHD`, `JOD` | دينار | فلس (1/1000) |
| `EGP` | جنيه | قرش (1/100) |
| `USD` | دولار | سنت |
| `EUR` | يورو | سنت |
| `LBP` | ليرة | none |

Missing your currency? Add it to `CURRENCIES` in a pull request.

## Grammar notes

- 1 and 2 follow the noun: «درهم واحد», «درهمان».
- 3–10 take the opposite gender and a plural noun: «ثلاثة دراهم», «ثلاث هللات».
- 11–99 take a singular accusative noun: «أحد عشر درهمًا», «خمس وسبعون هللة».
- 100+ ending in 00 take a singular noun: «مائة درهم», «ألف وخمسمائة درهم».
- Spelling: «مائة» by default (common on cheques), or `{ hundred: "مئة" }`.

Have a document that needs a different convention? Open an issue with an example.

## License

MIT © [Eng. Moath Alherani](https://moathalherani.com)
