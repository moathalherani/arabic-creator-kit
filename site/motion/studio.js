// Motion Studio page: scenes on a timeline, your video, keyword captions, export.
import { FORMATS, BACKGROUNDS, AR_FONTS, EN_FONTS, PALETTES, LAYOUTS, composeFrame } from "./engine.js";
import templates from "./templates/index.js";
import { parseSubtitles, keywordCaptions } from "../lib/arabic-captions/index.js";

const $ = (id) => document.getElementById(id);
const canvas = $("m-canvas");
const off = document.createElement("canvas");
const STYLE_KEY = "motion-studio-style-v1";

const defaults = () => {
  const { name, ...colors } = PALETTES[0];
  return { format: "vertical", background: "grid-light", fontAr: "Kufam", fontEn: "", ...colors };
};
function loadStyle() {
  try {
    return { ...defaults(), ...JSON.parse(localStorage.getItem(STYLE_KEY) || "{}") };
  } catch {
    return defaults();
  }
}
function saveStyle() {
  try {
    localStorage.setItem(STYLE_KEY, JSON.stringify(state.settings));
  } catch {}
}

const newScene = (template, start = 0) => ({ template, props: {}, start });
const state = {
  settings: loadStyle(),
  scenes: [newScene(templates[0], 0.5)],
  sel: 0,
  layout: "none",
  captions: null,
  start: performance.now(),
  recording: false,
};
const scene = () => state.scenes[state.sel];

/* ---------- fonts: load only the ones people pick ---------- */
const loadedFonts = new Set();
function ensureFont(family, weights) {
  if (!family || loadedFonts.has(family)) return;
  loadedFonts.add(family);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${weights}&display=swap`;
  document.head.append(link);
}
async function loadFonts() {
  const { fontAr, fontEn } = state.settings;
  ensureFont(fontAr, AR_FONTS[fontAr] ?? "700");
  ensureFont(fontEn, EN_FONTS[fontEn] ?? "700");
  try {
    await Promise.all([
      document.fonts.load(`800 60px "${fontAr}"`, "عربي"),
      document.fonts.load(`700 60px "${fontAr}"`, "عربي"),
      fontEn ? document.fonts.load(`800 60px "${fontEn}"`, "Hook 30") : null,
      fontEn ? document.fonts.load(`700 60px "${fontEn}"`, "Hook 30") : null,
    ]);
  } catch {}
}

/* ---------- your video ---------- */
const video = document.createElement("video");
video.playsInline = true;
video.loop = true;
video.preload = "auto";
let audio = null;
const hasVideo = () => state.layout !== "none" && !!video.src && video.readyState >= 2;

/* ---------- timing ---------- */
// Without a video the scenes play one after the other; with a video each scene has its own start.
function sceneStarts() {
  if (hasVideo()) return state.scenes.map((s) => s.start);
  let t = 0.2;
  return state.scenes.map((s) => {
    const st = t;
    t += s.template.duration;
    return st;
  });
}
function totalLength() {
  if (hasVideo()) return video.duration || 0;
  return 0.2 + state.scenes.reduce((a, s) => a + s.template.duration, 0) + 0.4;
}
function layersAt(t) {
  const starts = sceneStarts();
  return state.scenes.map((s, i) => ({ template: s.template, props: s.props, t: t - starts[i] }));
}
function captionAt(t) {
  if (!state.captions) return null;
  const ms = t * 1000;
  return state.captions.find((c) => ms >= c.start && ms < c.end) ?? null;
}

/* ---------- controls: look ---------- */
const opt = (value, label) => Object.assign(document.createElement("option"), { value, textContent: label });
for (const [k, f] of Object.entries(FORMATS)) $("m-format").append(opt(k, f.label));
for (const [k, b] of Object.entries(BACKGROUNDS)) $("m-bg").append(opt(k, b.label));
for (const f of Object.keys(AR_FONTS)) $("m-font-ar").append(opt(f, f));
for (const f of Object.keys(EN_FONTS)) $("m-font-en").append(opt(f, f || "نفس الخط العربي"));
for (const [k, l] of Object.entries(LAYOUTS)) $("m-layout").append(opt(k, l.label));

const COLOR_INPUTS = { "m-accent": "accent", "m-ink": "ink", "m-bgcolor": "bg", "m-card": "card", "m-danger": "danger" };
function syncLook() {
  const st = state.settings;
  $("m-format").value = st.format;
  $("m-bg").value = st.background;
  $("m-font-ar").value = st.fontAr;
  $("m-font-en").value = st.fontEn;
  for (const [id, key] of Object.entries(COLOR_INPUTS)) $(id).value = st[key];
  $("m-bgcolor").disabled = st.background === "green";
  markPalette();
}
for (const [id, key] of [["m-format", "format"], ["m-font-ar", "fontAr"], ["m-font-en", "fontEn"], ...Object.entries(COLOR_INPUTS)]) {
  $(id).addEventListener("input", async () => {
    state.settings[key] = $(id).value;
    if (key === "fontAr" || key === "fontEn") await loadFonts();
    saveStyle();
    markPalette();
  });
}
$("m-bg").addEventListener("input", () => {
  const b = BACKGROUNDS[$("m-bg").value];
  state.settings.background = $("m-bg").value;
  if (b && $("m-bg").value !== "green") Object.assign(state.settings, { bg: b.bg, ink: b.ink, card: b.card });
  saveStyle();
  syncLook();
});
function buildPalettes() {
  const box = $("m-palettes");
  box.replaceChildren();
  for (const pal of PALETTES) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pal";
    b.title = pal.name;
    b.innerHTML = "<i></i><i></i><i></i><span></span>";
    const dots = b.querySelectorAll("i");
    dots[0].style.background = pal.bg;
    dots[1].style.background = pal.accent;
    dots[2].style.background = pal.ink;
    b.querySelector("span").textContent = pal.name;
    b.addEventListener("click", () => {
      const { name, ...colors } = pal;
      Object.assign(state.settings, colors);
      const dark = parseInt(pal.bg.slice(1, 3), 16) < 80;
      if (state.settings.background !== "plain") state.settings.background = dark ? "grid-dark" : "grid-light";
      saveStyle();
      syncLook();
    });
    box.append(b);
  }
}
function markPalette() {
  const st = state.settings;
  [...$("m-palettes").children].forEach((b, i) => {
    const p = PALETTES[i];
    b.classList.toggle("on", p.accent === st.accent && p.ink === st.ink && p.bg === st.bg);
  });
}
$("m-reset-style").addEventListener("click", () => {
  state.settings = defaults();
  saveStyle();
  syncLook();
  loadFonts();
});

/* ---------- scenes ---------- */
function buildScenes() {
  const box = $("m-scenes");
  box.replaceChildren();
  const starts = sceneStarts();
  state.scenes.forEach((s, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "scene" + (i === state.sel ? " on" : "");
    b.innerHTML = "<b></b><span dir='ltr'></span>";
    b.querySelector("b").textContent = `${i + 1}. ${s.template.name}`;
    b.querySelector("span").textContent = `${starts[i].toFixed(1)}s`;
    b.addEventListener("click", () => {
      state.sel = i;
      if (hasVideo()) seek(state.scenes[i].start);
      refresh();
    });
    box.append(b);
  });
  $("m-del-scene").disabled = state.scenes.length < 2;
  buildTimeline();
}
$("m-add-scene").addEventListener("click", () => {
  const last = state.scenes.at(-1);
  const at = hasVideo() ? Math.min(video.currentTime, Math.max(0, video.duration - 1)) : 0;
  const start = hasVideo() ? Math.max(at, 0) : last.start + last.template.duration;
  const pick = templates.find((t) => t.id === "number") ?? templates[0];
  state.scenes.push(newScene(state.scenes.length === 1 ? pick : templates[0], Number(start.toFixed(1))));
  state.sel = state.scenes.length - 1;
  refresh();
});
$("m-del-scene").addEventListener("click", () => {
  if (state.scenes.length < 2) return;
  state.scenes.splice(state.sel, 1);
  state.sel = Math.max(0, state.sel - 1);
  refresh();
});

function buildTimeline() {
  const bar = $("m-timeline");
  bar.replaceChildren();
  const total = totalLength() || 1;
  const starts = sceneStarts();
  state.scenes.forEach((s, i) => {
    const blk = document.createElement("button");
    blk.type = "button";
    blk.className = "blk" + (i === state.sel ? " on" : "");
    blk.style.insetInlineStart = `${(starts[i] / total) * 100}%`;
    blk.style.width = `${Math.max(2, (s.template.duration / total) * 100)}%`;
    blk.textContent = String(i + 1);
    blk.title = s.template.name;
    blk.addEventListener("click", (e) => {
      e.stopPropagation();
      state.sel = i;
      if (hasVideo()) seek(starts[i]);
      refresh();
    });
    bar.append(blk);
  });
  if (state.captions) {
    const cap = document.createElement("div");
    cap.className = "caps";
    bar.append(cap);
  }
  const head = document.createElement("div");
  head.className = "head";
  head.id = "m-head";
  bar.append(head);
}
$("m-timeline").addEventListener("click", (e) => {
  if (!hasVideo()) return;
  const r = $("m-timeline").getBoundingClientRect();
  const x = getComputedStyle($("m-timeline")).direction === "rtl" ? r.right - e.clientX : e.clientX - r.left;
  seek((x / r.width) * video.duration);
});

/* ---------- template + fields for the selected scene ---------- */
function buildGallery() {
  const g = $("m-templates");
  g.replaceChildren();
  for (const tpl of templates) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tpl" + (tpl === scene().template ? " on" : "");
    b.innerHTML = "<b></b><span></span>";
    b.querySelector("b").textContent = tpl.name;
    b.querySelector("span").textContent = tpl.description;
    b.addEventListener("click", () => {
      scene().template = tpl;
      scene().props = {};
      refresh();
      if (!hasVideo()) restart();
    });
    g.append(b);
  }
}
function buildFields() {
  const s = scene();
  const box = $("m-fields");
  box.replaceChildren();
  for (const f of s.template.fields) {
    const id = `f-${f.key}`;
    const label = Object.assign(document.createElement("label"), { className: "field-label", htmlFor: id, textContent: f.label });
    let input;
    if (f.type === "textarea") {
      input = Object.assign(document.createElement("textarea"), { id, rows: 4, value: s.props[f.key] ?? f.default ?? "" });
    } else if (f.type === "image") {
      input = Object.assign(document.createElement("input"), { id, type: "file", accept: "image/*" });
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => (s.props[f.key] = img);
        img.src = URL.createObjectURL(file);
      });
    } else {
      input = Object.assign(document.createElement("input"), { id, type: "text", value: s.props[f.key] ?? f.default ?? "" });
      if (f.type === "number") input.inputMode = "decimal";
    }
    if (f.type !== "image") {
      if (s.props[f.key] === undefined) s.props[f.key] = input.value;
      input.addEventListener("input", () => (s.props[f.key] = input.value));
    }
    box.append(label, input);
  }
  $("m-start-row").hidden = !hasVideo();
  $("m-start").value = s.start;
  const starts = sceneStarts();
  $("m-cues").replaceChildren(
    ...s.template.cues.map((c) => {
      const li = document.createElement("li");
      li.innerHTML = "<b dir='ltr'></b> <span dir='ltr'></span> <em></em>";
      li.querySelector("b").textContent = `${(starts[state.sel] + c.t).toFixed(2)}s`;
      li.querySelector("span").textContent = c.sfx;
      li.querySelector("em").textContent = c.note ?? "";
      return li;
    }),
  );
}
$("m-start").addEventListener("input", () => {
  scene().start = Math.max(0, Number($("m-start").value) || 0);
  buildScenes();
});

function refresh() {
  buildScenes();
  buildGallery();
  buildFields();
}

/* ---------- video + captions inputs ---------- */
$("m-layout").addEventListener("input", () => {
  state.layout = $("m-layout").value;
  if (state.layout !== "none" && !video.src) $("m-video-info").textContent = "اختار فيديو من الخانة فوق.";
  refresh();
  restart();
});
$("m-video").addEventListener("change", () => {
  const file = $("m-video").files?.[0];
  if (!file) return;
  if (!audio) {
    try {
      const actx = new AudioContext();
      const src = actx.createMediaElementSource(video);
      const dest = actx.createMediaStreamDestination();
      src.connect(dest);
      audio = { ctx: actx, dest };
    } catch {
      audio = null;
    }
  }
  video.src = URL.createObjectURL(file);
  video.onloadeddata = () => {
    if (state.layout === "none") state.layout = "bottom";
    $("m-layout").value = state.layout;
    // give the scenes starts spread over the video
    const step = video.duration / (state.scenes.length + 1);
    state.scenes.forEach((s, i) => (s.start = Number((i === 0 ? 0.5 : step * (i + 0.5)).toFixed(1))));
    $("m-video-info").textContent = `${file.name} · ${video.duration.toFixed(1)}s`;
    refresh();
    restart();
  };
});
$("m-srt").addEventListener("change", async () => {
  const file = $("m-srt").files?.[0];
  if (!file) return;
  try {
    const cues = parseSubtitles(await file.text());
    state.captions = keywordCaptions(cues, { maxWords: 3 });
    $("m-srt-info").textContent = `${state.captions.length} كابشن ✓`;
    $("m-srt-clear").hidden = false;
  } catch (e) {
    state.captions = null;
    $("m-srt-info").textContent = "الملف مش SRT أو VTT صالح.";
  }
  buildTimeline();
});
$("m-srt-clear").addEventListener("click", () => {
  state.captions = null;
  $("m-srt").value = "";
  $("m-srt-info").textContent = "";
  $("m-srt-clear").hidden = true;
  buildTimeline();
});

/* ---------- playback ---------- */
function seek(t) {
  video.currentTime = Math.max(0, Math.min(t, video.duration || 0));
}
function restart() {
  state.start = performance.now();
  if (hasVideo()) {
    seek(0);
    video.play().catch(() => {});
  } else if (video.src) video.pause();
}
$("m-replay").addEventListener("click", restart);
$("m-play-scene").addEventListener("click", () => {
  const st = sceneStarts()[state.sel];
  if (hasVideo()) {
    seek(st);
    video.play().catch(() => {});
  } else state.start = performance.now() - st * 1000;
});

function tick(now) {
  let t;
  const total = totalLength();
  if (hasVideo()) t = video.currentTime;
  else {
    t = (now - state.start) / 1000;
    if (!state.recording && t > total) {
      state.start = now;
      t = 0;
    }
  }
  composeFrame(canvas, off, layersAt(t), state.settings, hasVideo() ? video : null, state.layout, t, captionAt(t));
  $("m-time").textContent = `${t.toFixed(1)} / ${total.toFixed(1)}s`;
  const head = $("m-head");
  if (head) head.style.insetInlineStart = `${(Math.min(t, total) / (total || 1)) * 100}%`;
  requestAnimationFrame(tick);
}

/* ---------- export ---------- */
function pickMime(withAudio) {
  const types = [
    ...(withAudio ? ["video/mp4;codecs=avc1.640028,mp4a.40.2", "video/mp4;codecs=avc1,mp4a.40.2"] : []),
    "video/mp4;codecs=avc1.640028",
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp9",
    "video/webm",
  ];
  return types.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
}
function download(chunks, mime, name) {
  const ext = mime.startsWith("video/mp4") ? "mp4" : "webm";
  const blob = new Blob(chunks, { type: mime.split(";")[0] });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${name}.${ext}` });
  document.body.append(a);
  a.click();
  a.remove();
  return ext;
}
async function record(withVideo) {
  const mime = pickMime(withVideo);
  if (!mime || !canvas.captureStream) {
    $("m-status").textContent = "متصفحك ما بيدعم التسجيل. جرّب Chrome أو Edge على الكمبيوتر.";
    return;
  }
  const stream = canvas.captureStream(30);
  if (withVideo && audio) {
    await audio.ctx.resume();
    for (const tr of audio.dest.stream.getAudioTracks()) stream.addTrack(tr);
  }
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 14_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((r) => (rec.onstop = r));
  state.recording = true;
  const total = totalLength();
  let timer;
  if (withVideo) {
    video.loop = false;
    video.muted = false;
    seek(0);
    await new Promise((r) => (video.onseeked = r));
    rec.start();
    await video.play();
    timer = setInterval(() => ($("m-status").textContent = `بسجّل… ${Math.round((video.currentTime / video.duration) * 100)}%`), 200);
    await new Promise((r) => (video.onended = r));
    video.onended = null;
    video.loop = true;
  } else {
    state.start = performance.now();
    rec.start();
    timer = setInterval(() => ($("m-status").textContent = `بسجّل… ${Math.min(100, Math.round(((performance.now() - state.start) / 1000 / total) * 100))}%`), 200);
    await new Promise((r) => setTimeout(r, total * 1000 + 100));
  }
  await new Promise((r) => setTimeout(r, 120));
  rec.stop();
  await done;
  clearInterval(timer);
  state.recording = false;
  const ext = download(chunks, mime, withVideo ? "motion-video" : "motion");
  $("m-status").textContent = ext === "mp4" ? "نزل الفيديو ✓" : "نزل الفيديو ✓ (WebM: CapCut وPremiere بيفتحوه)";
  restart();
}
$("m-export").addEventListener("click", async () => {
  $("m-export").disabled = true;
  try {
    await record(hasVideo());
  } finally {
    $("m-export").disabled = false;
  }
});

/* ---------- share a design as a link ---------- */
// The link holds the scenes (template + text) and the look. Images and videos stay on the device.
function encodeDesign() {
  const data = {
    v: 1,
    s: state.settings,
    sc: state.scenes.map((sc) => ({
      id: sc.template.id,
      st: sc.start,
      p: Object.fromEntries(Object.entries(sc.props).filter(([, v]) => typeof v === "string")),
    })),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeDesign(code) {
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  if (!data || data.v !== 1 || !Array.isArray(data.sc)) throw new Error("bad design");
  const scenes = data.sc
    .map((x) => {
      const tpl = templates.find((t) => t.id === x.id);
      if (!tpl) return null;
      const props = {};
      for (const f of tpl.fields) if (f.type !== "image" && typeof x.p?.[f.key] === "string") props[f.key] = x.p[f.key].slice(0, 2000);
      return { template: tpl, props, start: Math.max(0, Number(x.st) || 0) };
    })
    .filter(Boolean)
    .slice(0, 30);
  if (!scenes.length) throw new Error("no scenes");
  const s = { ...defaults() };
  for (const k of Object.keys(s)) if (typeof data.s?.[k] === "string") s[k] = data.s[k];
  return { scenes, settings: s };
}
$("m-share").addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}#d=${encodeDesign()}`;
  try {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ title: "تصميمي باستوديو الموشن", url });
    } else {
      await navigator.clipboard.writeText(url);
      $("m-status").textContent = "انتسخ رابط التصميم ✓ أي حدا بيفتحه بيشوف نفس المشاهد والألوان (بدون صورك وفيديوك).";
    }
  } catch {
    $("m-status").textContent = url;
  }
});
function loadFromLink() {
  const m = location.hash.match(/[#&]d=([A-Za-z0-9_-]+)/);
  if (!m) return false;
  try {
    const d = decodeDesign(m[1]);
    state.scenes = d.scenes;
    state.sel = 0;
    state.settings = d.settings;
    $("m-status").textContent = "فتحت تصميم حدا شاركه معك. غيّر عليه براحتك ونزّله.";
    return true;
  } catch {
    $("m-status").textContent = "الرابط ناقص أو قديم، فتحتلك التصميم الافتراضي.";
    return false;
  }
}

/* ---------- start ---------- */
loadFromLink();
buildPalettes();
syncLook();
$("m-layout").value = state.layout;
refresh();
await loadFonts();
requestAnimationFrame(tick);
