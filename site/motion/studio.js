// Motion Studio page: pick a template, type your words, preview and download the clip.
import { FORMATS, BACKGROUNDS, AR_FONTS, EN_FONTS, PALETTES, LAYOUTS, renderFrame, composeFrame } from "./engine.js";
import templates from "./templates/index.js";

const $ = (id) => document.getElementById(id);
const canvas = $("m-canvas");
const state = {
  template: templates[0],
  props: {},
  settings: { format: "vertical", background: "grid-light", fontAr: "Kufam", fontEn: "", ...PALETTES[0] },
  start: performance.now(),
  playing: true,
  recording: false,
  layout: "none",
  motionStart: 0.5,
};
const off = document.createElement("canvas");

/* ---------- your video ---------- */
const video = document.createElement("video");
video.playsInline = true;
video.loop = true;
video.preload = "auto";
let audio = null; // { ctx, dest } once a video is loaded (the sound goes to the recording, not the speakers)
const hasVideo = () => state.layout !== "none" && video.src && video.readyState >= 2;

for (const [k, l] of Object.entries(LAYOUTS)) $("m-layout").append(Object.assign(document.createElement("option"), { value: k, textContent: l.label }));
$("m-layout").value = state.layout;
$("m-layout").addEventListener("input", () => {
  state.layout = $("m-layout").value;
  if (state.layout !== "none" && !video.src) $("m-video-info").textContent = "اختار فيديو من الخانة فوق.";
  restart();
});
$("m-start").value = state.motionStart;
$("m-start").addEventListener("input", () => {
  state.motionStart = Math.max(0, Number($("m-start").value) || 0);
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
    if (state.layout === "none") {
      state.layout = "bottom";
      $("m-layout").value = "bottom";
    }
    $("m-video-info").textContent = `${file.name} · ${video.duration.toFixed(1)}s`;
    restart();
  };
});
delete state.settings.name;

/* ---------- fonts: load only the ones people pick ---------- */
const loaded = new Set();
function ensureFont(family, weights) {
  if (!family || loaded.has(family)) return;
  loaded.add(family);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${weights}&display=swap`;
  document.head.append(link);
}
async function loadFonts() {
  const { fontAr, fontEn } = state.settings;
  ensureFont(fontAr, AR_FONTS[fontAr]);
  ensureFont(fontEn, EN_FONTS[fontEn]);
  try {
    await Promise.all([
      document.fonts.load(`800 60px "${fontAr}"`, "عربي"),
      document.fonts.load(`700 60px "${fontAr}"`, "عربي"),
      fontEn ? document.fonts.load(`800 60px "${fontEn}"`, "Hook 30") : null,
      fontEn ? document.fonts.load(`700 60px "${fontEn}"`, "Hook 30") : null,
    ]);
  } catch {}
}

/* ---------- controls ---------- */
function option(value, label) {
  return Object.assign(document.createElement("option"), { value, textContent: label });
}
for (const [k, f] of Object.entries(FORMATS)) $("m-format").append(option(k, f.label));
for (const [k, b] of Object.entries(BACKGROUNDS)) $("m-bg").append(option(k, b.label));
for (const f of Object.keys(AR_FONTS)) $("m-font-ar").append(option(f, f));
for (const f of Object.keys(EN_FONTS)) $("m-font-en").append(option(f, f || "نفس الخط العربي"));

const COLOR_INPUTS = { "m-accent": "accent", "m-ink": "ink", "m-bgcolor": "bg", "m-card": "card", "m-danger": "danger" };
function syncControls() {
  const st = state.settings;
  $("m-format").value = st.format;
  $("m-bg").value = st.background;
  $("m-font-ar").value = st.fontAr;
  $("m-font-en").value = st.fontEn;
  for (const [id, key] of Object.entries(COLOR_INPUTS)) $(id).value = st[key];
  $("m-bgcolor").disabled = st.background === "green";
}
syncControls();

for (const [id, key] of [["m-format", "format"], ["m-font-ar", "fontAr"], ["m-font-en", "fontEn"], ...Object.entries(COLOR_INPUTS)]) {
  $(id).addEventListener("input", async () => {
    state.settings[key] = $(id).value;
    if (key === "fontAr" || key === "fontEn") await loadFonts();
    markPalette();
    restart();
  });
}
// switching the background style brings its own colors; the accent stays
$("m-bg").addEventListener("input", () => {
  const b = BACKGROUNDS[$("m-bg").value];
  state.settings.background = $("m-bg").value;
  if (b && $("m-bg").value !== "green") Object.assign(state.settings, { bg: b.bg, ink: b.ink, card: b.card });
  syncControls();
  markPalette();
  restart();
});

function buildPalettes() {
  const box = $("m-palettes");
  box.replaceChildren();
  for (const pal of PALETTES) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pal";
    b.title = pal.name;
    b.innerHTML = `<i></i><i></i><i></i><span></span>`;
    const dots = b.querySelectorAll("i");
    dots[0].style.background = pal.bg;
    dots[1].style.background = pal.accent;
    dots[2].style.background = pal.ink;
    b.querySelector("span").textContent = pal.name;
    b.addEventListener("click", () => {
      const { name, ...colors } = pal;
      Object.assign(state.settings, colors);
      if (state.settings.background === "green") state.settings.background = "grid-light";
      const dark = parseInt(pal.bg.slice(1, 3), 16) < 80;
      if (state.settings.background === "grid-light" && dark) state.settings.background = "grid-dark";
      if (state.settings.background === "grid-dark" && !dark) state.settings.background = "grid-light";
      syncControls();
      markPalette();
      restart();
    });
    box.append(b);
  }
  markPalette();
}
function markPalette() {
  const st = state.settings;
  [...$("m-palettes").children].forEach((b, i) => {
    const p = PALETTES[i];
    b.classList.toggle("on", p.accent === st.accent && p.ink === st.ink && p.bg === st.bg);
  });
}

function buildGallery() {
  const g = $("m-templates");
  g.replaceChildren();
  for (const tpl of templates) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tpl" + (tpl === state.template ? " on" : "");
    b.innerHTML = `<b></b><span></span>`;
    b.querySelector("b").textContent = tpl.name;
    b.querySelector("span").textContent = tpl.description;
    b.addEventListener("click", () => select(tpl));
    g.append(b);
  }
}

function buildFields() {
  const box = $("m-fields");
  box.replaceChildren();
  for (const f of state.template.fields) {
    const id = `f-${f.key}`;
    const label = Object.assign(document.createElement("label"), { className: "field-label", htmlFor: id, textContent: f.label });
    let input;
    if (f.type === "textarea") {
      input = Object.assign(document.createElement("textarea"), { id, rows: 4, value: state.props[f.key] ?? f.default ?? "" });
    } else if (f.type === "image") {
      input = Object.assign(document.createElement("input"), { id, type: "file", accept: "image/*" });
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => { state.props[f.key] = img; restart(); };
        img.src = URL.createObjectURL(file);
      });
    } else {
      input = Object.assign(document.createElement("input"), { id, type: "text", value: state.props[f.key] ?? f.default ?? "" });
      if (f.type === "number") input.inputMode = "decimal";
    }
    if (f.type !== "image") {
      input.addEventListener("input", () => { state.props[f.key] = input.value; restart(); });
      state.props[f.key] = input.value;
    }
    box.append(label, input);
  }
  const cues = $("m-cues");
  cues.replaceChildren(
    ...state.template.cues.map((c) => {
      const li = document.createElement("li");
      li.innerHTML = `<b dir="ltr"></b> <span dir="ltr"></span> <em></em>`;
      li.querySelector("b").textContent = `${c.t.toFixed(2)}s`;
      li.querySelector("span").textContent = c.sfx;
      li.querySelector("em").textContent = c.note ?? "";
      return li;
    }),
  );
}

function select(tpl) {
  state.template = tpl;
  state.props = {};
  buildGallery();
  buildFields();
  restart();
}

/* ---------- playback ---------- */
function restart() {
  state.start = performance.now();
  state.playing = true;
  if (hasVideo()) {
    video.currentTime = 0;
    video.play().catch(() => {});
  } else if (video.src) video.pause();
}
function tick(now) {
  if (hasVideo()) {
    const t = video.currentTime;
    composeFrame(canvas, off, state.template, state.props, state.settings, t - state.motionStart, video, state.layout, t);
    $("m-time").textContent = `${t.toFixed(1)} / ${video.duration.toFixed(1)}s`;
    requestAnimationFrame(tick);
    return;
  }
  const dur = state.template.duration;
  let t = (now - state.start) / 1000;
  if (!state.recording && t > dur + 0.6) {
    state.start = now;
    t = 0;
  }
  if (state.playing || state.recording) renderFrame(canvas, state.template, state.props, state.settings, Math.min(t, dur));
  $("m-time").textContent = `${Math.min(t, dur).toFixed(1)} / ${dur.toFixed(1)}s`;
  requestAnimationFrame(tick);
}
$("m-replay").addEventListener("click", restart);

/* ---------- export ---------- */
function pickMime() {
  const types = ["video/mp4;codecs=avc1.640028", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  return types.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
}
$("m-export").addEventListener("click", async () => {
  const mime = pickMime();
  if (!mime || !canvas.captureStream) {
    $("m-status").textContent = "متصفحك ما بيدعم التسجيل. جرّب Chrome أو Edge على الكمبيوتر.";
    return;
  }
  const btn = $("m-export");
  btn.disabled = true;
  if (hasVideo()) {
    await exportWithVideo(mime);
    btn.disabled = false;
    return;
  }
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((r) => (rec.onstop = r));
  state.recording = true;
  restart();
  rec.start();
  const dur = state.template.duration * 1000;
  const t0 = performance.now();
  const timer = setInterval(() => {
    const p = Math.min(1, (performance.now() - t0) / dur);
    $("m-status").textContent = `بسجّل… ${Math.round(p * 100)}%`;
  }, 100);
  await new Promise((r) => setTimeout(r, dur + 150));
  rec.stop();
  await done;
  clearInterval(timer);
  state.recording = false;
  const ext = mime.startsWith("video/mp4") ? "mp4" : "webm";
  const blob = new Blob(chunks, { type: mime.split(";")[0] });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `motion-${state.template.id}.${ext}` });
  document.body.append(a);
  a.click();
  a.remove();
  $("m-status").textContent = ext === "mp4" ? "نزل الملف ✓" : "نزل الملف ✓ (WebM: CapCut وPremiere بيفتحوه، أو حوّله لـ MP4)";
  btn.disabled = false;
});

function download(chunks, mime, name) {
  const ext = mime.startsWith("video/mp4") ? "mp4" : "webm";
  const blob = new Blob(chunks, { type: mime.split(";")[0] });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${name}.${ext}` });
  document.body.append(a);
  a.click();
  a.remove();
  return ext;
}

/** Record the whole video with the motion on top and the video's own sound. */
async function exportWithVideo(mime) {
  // AAC sound opens everywhere (Premiere, CapCut, phones); use it when the browser can
  const aac = ["video/mp4;codecs=avc1.640028,mp4a.40.2", "video/mp4;codecs=avc1,mp4a.40.2"].find((t) => MediaRecorder.isTypeSupported(t));
  if (aac) mime = aac;
  const stream = canvas.captureStream(30);
  if (audio) {
    await audio.ctx.resume();
    for (const tr of audio.dest.stream.getAudioTracks()) stream.addTrack(tr);
  }
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 14_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((r) => (rec.onstop = r));
  state.recording = true;
  video.loop = false;
  video.muted = false;
  video.currentTime = 0;
  await new Promise((r) => (video.onseeked = r));
  rec.start();
  await video.play();
  const timer = setInterval(() => {
    $("m-status").textContent = `بسجّل فيديوك مع الموشن… ${Math.round((video.currentTime / video.duration) * 100)}%`;
  }, 200);
  await new Promise((r) => (video.onended = r));
  await new Promise((r) => setTimeout(r, 120));
  rec.stop();
  await done;
  clearInterval(timer);
  video.onended = null;
  video.loop = true;
  state.recording = false;
  const ext = download(chunks, mime, `motion-${state.template.id}-video`);
  $("m-status").textContent = ext === "mp4" ? "نزل الفيديو ✓" : "نزل الفيديو ✓ (WebM: CapCut وPremiere بيفتحوه)";
  restart();
}

/* ---------- start ---------- */
buildGallery();
buildFields();
buildPalettes();
await loadFonts();
requestAnimationFrame(tick);
