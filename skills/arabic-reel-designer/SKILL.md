---
name: arabic-reel-designer
description: Designs an Arabic Reel or Short as motion-graphics scenes and returns a link that opens it ready in the free Motion Studio. Use for Arabic reels, hooks and video scripts.
---

# Arabic Reel Designer

You turn an idea or a script into 4 to 7 motion-graphics scenes, then give back one link. The link
opens the free [Motion Studio](https://moathalherani.github.io/arabic-creator-kit/motion/) with the
scenes, text and style ready. There the person can add their own video and SRT captions and download
an MP4. Nothing to install, no account.

## Steps

1. Understand the idea, the audience and the dialect. Default to the dialect the person writes in.
2. Write the scenes as JSON with the templates below:
   - The first scene is a strong `hook`: no greeting, no intro, a number or a question if possible.
   - The last scene is `follow`.
   - Short lines that read in two seconds. English words (AI, YouTube, Hook) stay in English letters.
     Digits are 0-9.
   - Never invent numbers or statistics. If there is no real number, pick a template that needs none.
   - In fields with several items, put one item per line (`\n`) and split parts with ` | `.
3. Save it to `design.json` and run `python3 scripts/make_link.py design.json`. It prints the link,
   plus warnings for anything it skipped.
4. Reply with:
   - the link, as a clickable markdown link,
   - a short list of the scenes,
   - one line: "Open it, add your video and SRT if you want, and press Download".

If you cannot run code, reply with the JSON in a code block instead. Tell the person to paste it in
the "Paste the reply here" box at the top of the studio page.

## Design format

```json
{
  "scenes": [
    {"template": "hook", "text": "3 ثواني بتقرر إذا الناس بتكمل الفيديو", "keyword": "3"},
    {"template": "versus", "problem": "بتبدأ بـ «مرحبا يا جماعة»", "solution": "ابدأ بالفكرة مباشرة"},
    {"template": "steps", "title": "الهوك بـ 3 خطوات", "steps": "شيل السلام\nابدأ برقم\nاسأل سؤال"},
    {"template": "follow"}
  ],
  "style": {"format": "vertical", "background": "grid-dark", "accent": "#C6F432", "fontAr": "Cairo"}
}
```

`style` is optional:
- `format`: `vertical`, `square` or `landscape`.
- `background`: `grid-light`, `grid-dark`, `green` or `plain`.
- `accent`, `ink`, `bg`, `card`, `danger`: hex colors.
- `fontAr` and `fontEn`: Google Fonts names, for example Cairo, Changa, Tajawal, Montserrat.
- `capStyle`: `keyword`, `box` or `karaoke`.

If the person has a video, add `"start": seconds` to each scene.

## Templates

<!-- templates:start -->
- **`audio`** (جوا برنامج الصوت): الصوت جوا برنامج صوت: Waveform بيترسم، عداد بيضرب، وأزرار EQ بتتحرك. للحظة اللي بدك تبيّن فيها الصوت.
  - `label`: اسم الصوت. Example: "Deep Drop"
  - `caption`: تحت النافذة. Example: "صوت نظيف وقوي"
- **`beforeafter`** (قبل وبعد): صورتين بكرت واحد، وخط بيمسح من اليمين لليسار وبيكشف "بعد" فوق "قبل". للتعديل، الترتيب، النتيجة.
  - `beforeLabel`: كلمة قبل. Example: "قبل"
  - `afterLabel`: كلمة بعد. Example: "بعد"
- **`chart`** (رسم بياني): أعمدة بتطلع وحدة ورا الثانية والأرقام بتعدّ، وأطول عمود بلونك. للأرقام اللي بتحكي عنها بالفيديو.
  - `title`: العنوان. Example: "المشاهدات بعد ما غيّرت الهوك"
  - `bars`: الأعمدة: الاسم | الرقم (سطر لكل عمود، مثال تجريبي). Example: "قبل | 1200\nبعد أسبوع | 4800\nبعد شهر | 15000"
- **`chat`** (سألت الذكاء الاصطناعي): سؤالك ورد الذكاء الاصطناعي بينكتب حرف حرف.
  - `name`: اسم المساعد. Example: "الذكاء الاصطناعي"
  - `question`: سؤالك. Example: "اكتبلي هوك لريل عن الإنتاجية"
  - `answer`: الرد. Example: "«بتصحى الساعة 5 وما بتخلص إشي؟ المشكلة مش بالوقت.»"
- **`compare`** (مقارنة): شغلتين جنب بعض (سيارتين، تلفونين، خطتين)، وكل سطر بيطلع لحاله والأحسن بلونك.
  - `a`: الأول. Example: "تلفون A"
  - `b`: الثاني. Example: "تلفون B"
  - `rows`: الأسطر: الاسم | الأول | الثاني (حط * جنب الأحسن). Example: "السعر | أرخص* | أغلى\nالبطارية | يوم كامل* | نص يوم\nالكاميرا | منيحة | أقوى*"
- **`editor`** (جوا المونتاج): المثال جوا برنامج مونتاج: صورة بالمعاينة وتحتها Timeline، والخط الأحمر بيضرب الصوت مع الحركة قدام الناس.
  - `title`: اسم النافذة. Example: "المونتاج"
  - `sfx`: اسم الصوت على الـ Timeline. Example: "BOOM"
  - `caption`: تحت النافذة. Example: "الصوت بيضرب مع الحركة بالضبط"
- **`follow`** (تابعني): كرت باسمك وحسابك وزر تابعني، لآخر الفيديو.
  - `name`: الاسم. Example: "المهندس معاذ الهريني"
  - `handle`: الحساب. Example: "@moath.alherani"
  - `cta`: الزر. Example: "تابعني"
- **`hook`** (هوك بالكلمات): أول جملة بالفيديو، كلمة كلمة، والكلمة الأقوى بلونك مع هزة خفيفة.
  - `text`: الهوك. Example: "الفرق بين مليون مشاهدة و100 مشاهدة… جملة وحدة"
  - `keyword`: الكلمة الملونة. Example: "جملة"
- **`notification`** (إشعارات): إشعارات تلفون بتنزل ورا بعض، للنتيجة أو المفاجأة.
  - `title`: العنوان فوق (اختياري). Example: "بعد أسبوع من الطريقة هاي"
  - `items`: الإشعارات (كل سطر: التطبيق | الرسالة). Example: "إنستغرام | الريل تبعك وصل 100 ألف مشاهدة\nالإيميل | براند بدو يتعاون معك\nتيك توك | 500 متابع جديد اليوم"
- **`number`** (رقم كبير): الرقم بيعدّ لحد ما يوصل، وبيضرب مع صوت Impact. للنتايج والإحصائيات.
  - `label`: فوق الرقم. Example: "جربت iPhone لمدة"
  - `number`: الرقم. Example: "30"
  - `suffix`: بعد الرقم. Example: "يوم"
- **`phone`** (شاشة تلفون): سكرين شوت من تطبيق أو موقع جوا تلفون نظيف، بيطلع من تحت وبيلف شوي وبيثبت.
  - `caption`: تحت التلفون. Example: "شوف التطبيق من جوا"
  - `badge`: ملصق صغير جنب التلفون (فاضي = بدون). Example: "مجاني"
- **`price`** (سعر): السعر بيضرب على الشاشة، ومعه السعر القديم مشطوب إذا في خصم.
  - `label`: فوق السعر. Example: "السعر بالإمارات"
  - `price`: السعر. Example: "149,900"
  - `currency`: العملة. Example: "AED"
  - `old`: السعر القديم (اختياري). Example: ""
- **`quote`** (اقتباس): جملة مهمة أو رأي حدا، بعلامات اقتباس كبيرة واسم صاحبها.
  - `quote`: الجملة. Example: "أحسن وقت تبلش فيه كان امبارح، وثاني أحسن وقت هو اليوم."
  - `author`: مين قالها (اختياري). Example: ""
- **`ranking`** (أفضل 3): ترتيب بيطلع من الأخير للأول، ورقم 1 بيضرب بالآخر.
  - `title`: العنوان. Example: "أفضل 3 أدوات مجانية لصناع المحتوى"
  - `items`: الترتيب (رقم 1 أول سطر). Example: "استوديو الموشن\nالكابشن الأوتوماتيك\nمكتبة البرومبتات"
- **`steps`** (خطوات): عنوان وخطوات بتطلع وحدة وحدة مع رقم لكل خطوة.
  - `title`: العنوان. Example: "3 خطوات لهوك قوي"
  - `steps`: الخطوات (كل خطوة بسطر). Example: "شيل السلام\nابدأ بالفكرة\nحط سؤال أو رقم"
- **`title`** (عنوان كبير): عنوان قسم جديد بالفيديو، مع رقم صغير وخط بيرسم تحته.
  - `kicker`: فوق العنوان (اختياري). Example: "الخطوة 1"
  - `title`: العنوان. Example: "الهوك"
  - `sub`: تحت العنوان (اختياري). Example: "أول 3 ثواني بتقرر كل إشي"
- **`versus`** (مشكلة وحل): كرت أحمر للغلط، بعده كرت أخضر للحل. الألوان بتوصل الفكرة من غير صوت.
  - `problem`: المشكلة. Example: "بتبدأ الفيديو بـ «مرحبا يا جماعة»"
  - `solution`: الحل. Example: "ابدأ بالفكرة مباشرة وحط سؤال"
- **`window`** (جوا برنامج): المثال الحقيقي (صورة أو سكرين شوت) جوا نافذة برنامج، كأنك بتعمل مونتاج قدام الناس.
  - `title`: اسم النافذة. Example: "المشروع"
  - `caption`: تحت النافذة. Example: "هيك بيطلع بالآخر"
<!-- templates:end -->
