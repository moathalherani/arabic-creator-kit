// Landing pages for search: one Arabic page per tool, aimed at what people type into Google.
// Static content (examples, tables, FAQ) is generated here from the real packages,
// so the page already says something useful before any JavaScript runs.
import { amountToWords } from "../packages/arabic-tafqeet/src/index.js";
import { islamicOccasions, formatDate, formatHijri } from "../packages/arabic-dates/src/index.js";
import { PLATFORMS } from "../packages/arabic-social/src/index.js";
import { getHooks, CATEGORY_LABELS, scoreHook } from "../packages/arabic-hooks/src/index.js";
import { slugify } from "../packages/arabic-seo/src/index.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const table = (head, rows) =>
  `<table class="data"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;

export function pages(sections, now = new Date()) {
  const y = now.getUTCFullYear();
  const upcoming = [...islamicOccasions(y), ...islamicOccasions(y + 1)].filter((o) => o.date >= now).slice(0, 8);
  const ramadan = upcoming.find((o) => o.key === "ramadan");

  return [
    {
      slug: "tafqeet",
      title: "تفقيط: كتابة المبلغ بالحروف للفواتير والشيكات",
      description: "اكتب أي مبلغ بالحروف العربية مجانًا: درهم، ريال، دينار، جنيه ودولار، مع «فقط … لا غير» وقواعد المذكر والمؤنث والجمع.",
      h1: "كتابة المبلغ بالحروف (تفقيط)",
      lead: "اكتب المبلغ بالأرقام، وبيطلعلك مكتوب بالحروف مثل ما بينكتب على الفاتورة أو الشيك أو العقد. بيدعم 11 عملة، وبيعرف قواعد العدد والمعدود.",
      tool: sections.tafqeet,
      body: `<h2>أمثلة جاهزة</h2>${table(
        ["المبلغ", "بالحروف"],
        [
          ["1,500 درهم", amountToWords(1500)],
          ["25.50 درهم", amountToWords(25.5)],
          ["1,250.75 درهم", amountToWords("1250.75", { only: true })],
          ["100 ريال", amountToWords(100, { currency: "SAR" })],
          ["0.75 ريال", amountToWords(0.75, { currency: "SAR" })],
          ["103.003 دينار أردني", amountToWords(103.003, { currency: "JOD" })],
          ["2,500,000 درهم", amountToWords(2500000)],
        ],
      )}`,
      faq: [
        { question: "كيف بتنكتب 1500 درهم بالحروف؟", answer: `${amountToWords(1500, { only: true })}.` },
        { question: "مائة ولا مئة؟", answer: "الاثنين صح. «مائة» هي الكتابة الشائعة على الشيكات، و«مئة» هي الكتابة الحديثة. الأداة بتكتب «مائة» افتراضيًا، والمكتبة فيها خيار للكتابة الحديثة." },
        { question: "ليش بنكتب «ثلاثة دراهم» بس «ثلاث هللات»؟", answer: "الأعداد من 3 لـ 10 بتخالف جنس المعدود: الدرهم مذكر فبنقول ثلاثة، والهللة مؤنثة فبنقول ثلاث." },
        { question: "شو العملات المدعومة؟", answer: "درهم إماراتي، ريال سعودي وقطري وعماني، دينار كويتي وبحريني وأردني، جنيه مصري، دولار، يورو، وليرة لبنانية." },
        { question: "بقدر أستخدمها ببرنامج الفواتير تبعي؟", answer: "آه. المكتبة arabic-tafqeet مجانية ومفتوحة المصدر، وبتشتغل بأي تطبيق JavaScript أو Node بدون أي إضافات." },
      ],
    },
    {
      slug: "hijri",
      title: "تحويل التاريخ من ميلادي إلى هجري وبالعكس، ومواعيد رمضان والعيد",
      description: "حوّل أي تاريخ من ميلادي لهجري ومن هجري لميلادي حسب تقويم أم القرى، وشوف المواعيد المتوقعة لرمضان وعيد الفطر وعيد الأضحى.",
      h1: "تحويل التاريخ من ميلادي إلى هجري",
      lead: `اختار تاريخ وبيتحوّل فورًا حسب تقويم أم القرى. ${ramadan ? `بداية رمضان القادم المتوقعة: ${formatDate(ramadan.date)}.` : ""}`,
      tool: sections.hijriConverter + sections.dates,
      body: `<h2>المواعيد القادمة</h2>${table(
        ["المناسبة", "التاريخ الميلادي المتوقع", "الهجري"],
        upcoming.map((o) => [o.ar, formatDate(o.date, { weekday: true }), o.hijri]),
      )}<p class="note">حُسبت يوم ${esc(formatDate(now))} الموافق ${esc(formatHijri(now))}. الإعلان الرسمي بيعتمد على رؤية الهلال، وممكن يختلف يوم بين الدول.</p>`,
      faq: [
        ...(ramadan ? [{ question: `متى رمضان ${ramadan.date.getUTCFullYear()}؟`, answer: `حسب تقويم أم القرى، بداية رمضان المتوقعة ${formatDate(ramadan.date, { weekday: true })}. التاريخ الرسمي بيتأكد برؤية الهلال.` }] : []),
        { question: "شو هو تقويم أم القرى؟", answer: "هو التقويم الهجري الرسمي بالسعودية، ومحسوب فلكيًا. كثير من التطبيقات والحكومات بتعتمد عليه." },
        { question: "ليش ممكن يختلف التاريخ الهجري يوم؟", answer: "لأنه بعض الدول بتعتمد رؤية الهلال بالعين، فبداية الشهر ممكن تتأخر أو تتقدم يوم عن الحساب الفلكي." },
        { question: "شو أسماء الأشهر الميلادية بالشام والخليج؟", answer: "بالشام: كانون الثاني، شباط، آذار… وبالخليج ومصر: يناير، فبراير، مارس… وبالجزائر وتونس: جانفي، فيفري…" },
      ],
    },
    {
      slug: "hashtags",
      title: "هاشتاقات عربية وعداد حروف انستقرام وX وتيك توك",
      description: "حوّل أي عبارة لهاشتاق عربي صحيح، وافحص طول الكابشن وعدد الهاشتاقات لكل منصة قبل ما تنشر، مع عداد X اللي بيحسب الروابط والإيموجي صح.",
      h1: "هاشتاقات عربية وفحص الكابشن قبل النشر",
      lead: "الهاشتاق العربي بيخرب إذا فيه مسافة أو تشكيل أو أرقام هندية. اكتب العبارة وبتطلعلك صحيحة، وافحص الكابشن كامل حسب المنصة.",
      tool: sections.social,
      body: `<h2>حدود كل منصة</h2>${table(
        ["المنصة", "طول النص", "ملاحظات"],
        Object.values(PLATFORMS).map((p) => [
          p.name,
          p.caption.toLocaleString("en-US"),
          [p.hashtags && `${p.hashtags} هاشتاقات`, p.title && `العنوان ${p.title}`, p.bio && `البايو ${p.bio}`, p.weighted && "الروابط 23 والإيموجي 2"].filter(Boolean).join("، "),
        ]),
      )}<p class="note">الأرقام من توثيق المنصات وأدوات الجدولة سنة 2026، والمنصات بتغيّرها أحيانًا.</p>`,
      faq: [
        { question: "كم هاشتاق بيسمح انستقرام؟", answer: `حاليًا ${PLATFORMS.instagram.hashtags} هاشتاقات بالمنشور الواحد، والكابشن لحد ${PLATFORMS.instagram.caption.toLocaleString("en-US")} حرف.` },
        { question: "كيف بيحسب X الحروف العربية؟", answer: "كل حرف عربي بينحسب حرف واحد، الرابط بينحسب 23 مهما كان طوله، والإيموجي بينحسب 2. الحد للحسابات العادية 280." },
        { question: "ليش الأسطر الفاضية بتختفي من كابشن انستقرام؟", answer: "انستقرام بيدمج الأسطر الفاضية. الحل إنك تحط رمز فاضي غير مرئي بالسطر، والمكتبة arabic-social بتعملها بدالة keepLineBreaks." },
        { question: "شو الرموز المخفية بالنص؟", answer: "رموز ما بتنشاف بتيجي من النسخ واللصق أو من أدوات الذكاء الاصطناعي، وبتخرب الهاشتاقات والبحث. الفحص بينبهك إذا موجودة." },
      ],
    },
    {
      slug: "captions",
      title: "كابشن ريلز عربي بالكلمات من ملف SRT، مجانًا",
      description: "حوّل ملف الترجمة SRT لكابشن قصير للريلز والتيك توك، 3 كلمات بكل مرة وكلمة ملوّنة، والعربي مع الإنجليزي بترتيب صح، ونزّله SRT أو ASS لـ ffmpeg.",
      h1: "كابشن الريلز العربي بالكلمات",
      lead: "الترجمة الطويلة صعب تنقرأ على الموبايل. هون بتتحوّل لكابشن قصير، كل مرة كلمتين لأربع كلمات، وكلمة وحدة ملوّنة بتشد العين.",
      tool: sections.captions,
      body: `<h2>كيف تحرقه على الفيديو</h2><ol class="steps"><li>طلّع ملف SRT من أي برنامج تفريغ: CapCut أو Premiere أو Whisper أو YouTube Studio.</li><li>الصقه فوق ونزّل ملف ASS.</li><li>نزّل الخط اللي بدك ياه على جهازك.</li><li>شغّل الأمر: <code dir="ltr">ffmpeg -i video.mp4 -vf ass=captions.ass -c:a copy out.mp4</code></li></ol>`,
      faq: [
        { question: "ليش الكلمات الإنجليزية بتنقلب بالكابشن العربي؟", answer: "لأنه اتجاه العربي من اليمين والإنجليزي من الشمال. الأداة بتحط علامات اتجاه غير مرئية حوالين الكلمات الإنجليزية عشان يضل الترتيب صح." },
        { question: "كيف بتختار الكلمة الملوّنة؟", answer: "الأرقام أول، بعدها أسماء المنتجات بالإنجليزي، بعدها أطول كلمة مهمة بالجملة." },
        { question: "بتشيل «يعني» و«اممم»؟", answer: "آه، بتشيل الكلمات الحشو الشائعة تلقائيًا، وفيك توقفها من سطر الأوامر." },
      ],
    },
    {
      slug: "hook",
      title: "تقييم الهوك: علامة بداية فيديوك من 100 مع نصائح",
      description: "اكتب أول جملة بالريل أو التيك توك وبتاخد علامة من 100 مع نصائح بالعربي لتحسينها، و50 هوك جاهز بالعربي والإنجليزي.",
      h1: "قيّم الهوك تبعك من 100",
      lead: "الهوك هو أول جملة بالفيديو، وعنده تقريبًا 3 ثواني يوقّف فيها المشاهد. اكتبه وبتشوف علامته وشو ناقصه.",
      tool: sections.scorer,
      body: `<h2>هوكس جاهزة حسب النوع</h2>${table(
        ["النوع", "الهوك", "العلامة"],
        ["shock", "curiosity", "promise", "challenge", "story"].flatMap((c) =>
          getHooks({ category: c }).slice(0, 3).map((h) => [CATEGORY_LABELS[c].ar, h.ar, String(scoreHook(h.ar).score)]),
        ),
      )}<p class="note">العلامة من أداة تشيك: الطول، البداية الضعيفة، الكلام مع المشاهد، الرقم، والتوتر. مش توقع مشاهدات.</p>`,
      faq: [
        { question: "شو هو الهوك بالفيديو؟", answer: "أول جملة بتنقال بالفيديو، وظيفتها توقّف المشاهد عن السحب بأول 3 ثواني." },
        { question: "كيف بتنحسب العلامة؟", answer: "بتبلّش من 40: الجملة القصيرة بتزيد، البداية بسلام أو تعريف بتنقص، والكلام مع المشاهد والرقم الحقيقي والسؤال أو التوتر بزيدوها." },
        { question: "شو أنواع الهوك؟", answer: "صدمة بتكسر فكرة، فضول بيفتح سؤال، وعد بنتيجة، تحدّي للمشاهد، وقصة بتبلّش من نص الحدث." },
      ],
    },
    {
      slug: "slug",
      title: "رابط عربي لمقالك (Slug) وأدوات SEO للمواقع العربية",
      description: "حوّل عنوان المقال لرابط عربي مرتب أو بحروف إنجليزية، بدون تشكيل وبأرقام إنجليزية، مع أدوات hreflang وJSON-LD للمواقع ثنائية اللغة.",
      h1: "رابط عربي مرتب لعنوانك",
      lead: "جوجل بيقرأ الروابط العربية عادي، بس التشكيل والرموز والأرقام الهندية بتخرّبها. اكتب العنوان وبتطلعلك نسختين.",
      tool: sections.seo,
      body: `<h2>أمثلة</h2>${table(
        ["العنوان", "الرابط"],
        ["دليل تطبيقات BYD الكامل ٢٠٢٦!", "مَرْحَباً بالعالم", "كيف تكتب هوك قوي؟"].map((t) => [t, slugify(t)]),
      )}`,
      faq: [
        { question: "الرابط العربي أحسن ولا الإنجليزي للـ SEO؟", answer: "للصفحات العربية الرابط العربي واضح للقارئ وجوجل بيفهمه. استخدم الإنجليزي إذا المنصة ما بتقبل العربي." },
        { question: "شو هو hreflang؟", answer: "علامة بتحكي لجوجل إنه الصفحة إلها نسخة بلغة ثانية، عشان يعرض لكل زائر لغته. المكتبة arabic-seo بتولّدها وبتتأكد إنها صحيحة." },
      ],
    },
  ];
}
