// Motion Studio page: pick a template, type your words, preview and download the clip.
import { FORMATS, BACKGROUNDS, FONTS, renderFrame } from "./engine.js";
import templates from "./templates/index.js";

const $ = (id) => document.getElementById(id);
const canvas = $("m-canvas");
const state = {
  template: templates[0],
  props: {},
  settings: { format: "vertical", background: "grid-light", accent: "#5F8A55", font: "Kufam" },
  start: performance.now(),
  playing: true,
  recording: false,
};

/* ---------- controls ---------- */
function option(value, label) {
  return Object.assign(document.createElement("option"), { value, textContent: label });
}
for (const [k, f] of Object.entries(FORMATS)) $("m-format").append(option(k, f.label));
for (const [k, b] of Object.entries(BACKGROUNDS)) $("m-bg").append(option(k, b.label));
for (const f of FONTS) $("m-font").append(option(f, f));
$("m-format").value = state.settings.format;
$("m-bg").value = state.settings.background;
$("m-font").value = state.settings.font;
$("m-accent").value = state.settings.accent;

for (const [id, key] of [["m-format", "format"], ["m-bg", "background"], ["m-font", "font"], ["m-accent", "accent"]]) {
  $(id).addEventListener("input", async () => {
    state.settings[key] = $(id).value;
    if (key === "font") await loadFont();
    restart();
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
}
async function loadFont() {
  try {
    await document.fonts.load(`800 60px "${state.settings.font}"`, "عربي");
    await document.fonts.load(`700 60px "${state.settings.font}"`, "عربي");
  } catch {}
}
function tick(now) {
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

/* ---------- start ---------- */
buildGallery();
buildFields();
await loadFont();
requestAnimationFrame(tick);
