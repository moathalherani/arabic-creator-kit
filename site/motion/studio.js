// Motion Studio page: scenes on a timeline, your video, keyword captions, export.
import { FORMATS, BACKGROUNDS, AR_FONTS, EN_FONTS, PALETTES, LAYOUTS, CAPTION_STYLES, composeFrame, drawSafeZones, makeEnv } from "./engine.js";
import templates from "./templates/index.js";
import { parseSubtitles, keywordCaptions } from "../lib/arabic-captions/index.js";
import { buildPrompt, parseDesign, chatLinks } from "./ai.js";

const $ = (id) => document.getElementById(id);
const canvas = $("m-canvas");
const off = document.createElement("canvas");
const STYLE_KEY = "motion-studio-style-v1";

const defaults = () => {
  const { name, ...colors } = PALETTES[0];
  // fx flags are strings ("1" or "") so they save and share like the rest of the look
  return { format: "vertical", background: "grid-light", fontAr: "Kufam", fontEn: "", ...colors, capStyle: "keyword", punch: "1", progress: "1", safe: "" };
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
const SCENES_KEY = "motion-studio-scenes-v1";
let saveTimer;
/** Scenes and their text stay on this device (images and videos don't). */
function saveScenes() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(SCENES_KEY, JSON.stringify(state.scenes.map((sc) => ({ id: sc.template.id, st: sc.start, p: textProps(sc.props) }))));
    } catch {}
  }, 300);
}
const textProps = (props) => Object.fromEntries(Object.entries(props).filter(([, v]) => typeof v === "string"));
function loadScenes() {
  try {
    const list = JSON.parse(localStorage.getItem(SCENES_KEY) || "null");
    if (!Array.isArray(list)) return null;
    const scenes = list
      .map((x) => {
        const tpl = templates.find((t) => t.id === x.id);
        return tpl ? { template: tpl, props: { ...(x.p ?? {}) }, start: Math.max(0, Number(x.st) || 0) } : null;
      })
      .filter(Boolean);
    return scenes.length ? scenes : null;
  } catch {
    return null;
  }
}

const newScene = (template, start = 0) => ({ template, props: {}, start });
const state = {
  settings: loadStyle(),
  scenes: loadScenes() ?? [newScene(templates[0], 0.5)],
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
let videoReady = false; // stays true while seeking, so the timing doesn't flip to "no video"
let videoUrl = "";
const hasVideo = () => state.layout !== "none" && videoReady && Number.isFinite(video.duration);

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
  const i = state.captions.findIndex((c) => ms >= c.start && ms < c.end);
  return i < 0 ? null : { ...state.captions[i], i };
}

/* ---------- controls: look ---------- */
const opt = (value, label) => Object.assign(document.createElement("option"), { value, textContent: label });
for (const [k, f] of Object.entries(FORMATS)) $("m-format").append(opt(k, f.label));
for (const [k, b] of Object.entries(BACKGROUNDS)) $("m-bg").append(opt(k, b.label));
for (const f of Object.keys(AR_FONTS)) $("m-font-ar").append(opt(f, f));
for (const f of Object.keys(EN_FONTS)) $("m-font-en").append(opt(f, f || "نفس الخط العربي"));
for (const [k, l] of Object.entries(LAYOUTS)) $("m-layout").append(opt(k, l.label));
for (const [k, c] of Object.entries(CAPTION_STYLES)) $("m-capstyle").append(opt(k, c.label));

const FX_CHECKS = { "m-punch": "punch", "m-progress": "progress", "m-safe": "safe" };
for (const [id, key] of Object.entries(FX_CHECKS)) {
  $(id).addEventListener("change", () => {
    state.settings[key] = $(id).checked ? "1" : "";
    saveStyle();
  });
}
$("m-capstyle").addEventListener("input", () => {
  state.settings.capStyle = $("m-capstyle").value;
  saveStyle();
});

const COLOR_INPUTS = { "m-accent": "accent", "m-ink": "ink", "m-bgcolor": "bg", "m-card": "card", "m-danger": "danger" };
function syncLook() {
  const st = state.settings;
  document.querySelector(".studio").classList.toggle("wide", st.format === "landscape");
  $("m-format").value = st.format;
  $("m-bg").value = st.background;
  $("m-font-ar").value = st.fontAr;
  $("m-font-en").value = st.fontEn;
  for (const [id, key] of Object.entries(COLOR_INPUTS)) $(id).value = st[key];
  $("m-bgcolor").disabled = st.background === "green";
  for (const [id, key] of Object.entries(FX_CHECKS)) $(id).checked = st[key] === "1";
  $("m-capstyle").value = CAPTION_STYLES[st.capStyle] ? st.capStyle : "keyword";
  markPalette();
}
for (const [id, key] of [["m-format", "format"], ["m-font-ar", "fontAr"], ["m-font-en", "fontEn"], ...Object.entries(COLOR_INPUTS)]) {
  $(id).addEventListener("input", async () => {
    state.settings[key] = $(id).value;
    if (key === "fontAr" || key === "fontEn") await loadFonts();
    if (key === "format") document.querySelector(".studio").classList.toggle("wide", state.settings.format === "landscape");
    saveStyle();
    markPalette();
  });
}
$("m-bg").addEventListener("input", () => {
  const b = BACKGROUNDS[$("m-bg").value];
  state.settings.background = $("m-bg").value;
  if (b && $("m-bg").value !== "green") {
    Object.assign(state.settings, { bg: b.bg, ink: b.ink, card: b.card });
    // keep the accent readable on the new background
    const lum = luminance(state.settings.accent);
    const dark = luminance(b.bg) < 0.4;
    if (!dark && lum > 0.62) state.settings.accent = PALETTES[0].accent;
    if (dark && lum < 0.2) state.settings.accent = PALETTES[4].accent;
  }
  saveStyle();
  syncLook();
});
function luminance(hex) {
  const m = String(hex).match(/^#?([0-9a-f]{6})$/i);
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}
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
      const dark = luminance(pal.bg) < 0.4;
      if (state.settings.background !== "green") {
        if (state.settings.background === "plain" && !dark) state.settings.background = "plain";
        else state.settings.background = dark ? "grid-dark" : "grid-light";
      }
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
  const hadFocus = box.contains(document.activeElement);
  box.replaceChildren();
  const starts = sceneStarts();
  state.scenes.forEach((s, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "scene" + (i === state.sel ? " on" : "");
    b.setAttribute("aria-pressed", String(i === state.sel));
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
  if (hadFocus) box.querySelector(".on")?.focus();
  $("m-del-scene").disabled = state.scenes.length < 2;
  buildTimeline();
  saveScenes();
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
  if (!hasVideo() || state.recording) return;
  const r = $("m-timeline").getBoundingClientRect();
  const x = getComputedStyle($("m-timeline")).direction === "rtl" ? r.right - e.clientX : e.clientX - r.left;
  seek((x / r.width) * video.duration);
});

/* ---------- template + fields for the selected scene ---------- */
function buildGallery() {
  const g = $("m-templates");
  const hadFocus = g.contains(document.activeElement);
  g.replaceChildren();
  for (const tpl of templates) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tpl" + (tpl === scene().template ? " on" : "");
    b.setAttribute("aria-pressed", String(tpl === scene().template));
    b.innerHTML = "<b></b><span></span>";
    b.querySelector("b").textContent = tpl.name;
    b.querySelector("span").textContent = tpl.description;
    b.addEventListener("click", () => {
      const old = scene().props;
      scene().template = tpl;
      scene().props = Object.fromEntries(tpl.fields.filter((f) => old[f.key] !== undefined).map((f) => [f.key, old[f.key]]));
      refresh();
      if (!hasVideo()) restart();
    });
    g.append(b);
  }
  if (hadFocus) g.querySelector(".on")?.focus();
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
      input.addEventListener("input", () => {
        s.props[f.key] = input.value;
        saveScenes();
      });
    }
    box.append(label, input);
  }
  $("m-start-row").hidden = !hasVideo();
  $("m-start").value = s.start;
  buildCues();
}
function buildCues() {
  const s = scene();
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
  buildCues();
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
      src.connect(actx.destination); // so you hear yourself in the preview too
      audio = { ctx: actx, dest };
    } catch {
      audio = null;
    }
  }
  const first = !videoReady;
  videoReady = false;
  if (videoUrl) URL.revokeObjectURL(videoUrl);
  videoUrl = URL.createObjectURL(file);
  video.src = videoUrl;
  $("m-video-info").textContent = "عم بفتح الفيديو…";
  video.onerror = () => {
    videoReady = false;
    $("m-video-info").textContent = "ما قدرت أفتح هالفيديو. جرّب MP4 أو MOV.";
    refresh();
  };
  video.onloadeddata = async () => {
    // videos recorded in the browser can report an endless duration until you seek to the end
    if (!Number.isFinite(video.duration)) {
      video.currentTime = 1e9;
      await Promise.race([new Promise((r) => (video.ondurationchange = () => Number.isFinite(video.duration) && r())), new Promise((r) => setTimeout(r, 4000))]);
      if (!Number.isFinite(video.duration)) {
        $("m-video-info").textContent = "ما قدرت أعرف طول هالفيديو. صدّره MP4 وجرّب مرة تانية.";
        return;
      }
      video.ondurationchange = null;
      video.currentTime = 0;
    }
    videoReady = true;
    if (state.layout === "none") state.layout = "bottom";
    $("m-layout").value = state.layout;
    const d = video.duration;
    if (first || state.scenes.some((s) => s.start >= d)) {
      // one after the other, each for its own length, so scenes don't sit on top of each other
      const need = state.scenes.reduce((a, s) => a + s.template.duration, 0);
      const gap = Math.max(0, (d - 0.5 - need) / Math.max(1, state.scenes.length));
      let t = 0.5;
      for (const s of state.scenes) {
        s.start = Number(Math.min(t, Math.max(0, d - 1)).toFixed(1));
        t += s.template.duration + gap;
      }
    }
    $("m-video-info").textContent = `${file.name} · ${d.toFixed(1)}s`;
    refresh();
    restart();
  };
});
$("m-srt").addEventListener("change", async () => {
  const file = $("m-srt").files?.[0];
  if (!file) return;
  try {
    const cues = parseSubtitles(await file.text());
    if (!cues.length) throw new Error("no cues");
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
  if (state.recording) return;
  audio?.ctx.resume().catch(() => {});
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
  const st = state.settings;
  const fx = { punch: st.punch === "1", captionStyle: st.capStyle, progress: st.progress === "1" && total > 0 ? Math.min(1, t / total) : null };
  composeFrame(canvas, off, layersAt(t), st, hasVideo() ? video : null, state.layout, t, captionAt(t), fx);
  if (st.safe === "1" && !state.recording) drawSafeZones(canvas.getContext("2d"), makeEnv(canvas, st));
  $("m-time").textContent = `${t.toFixed(1)} / ${total.toFixed(1)}s`;
  const head = $("m-head");
  if (head) head.style.insetInlineStart = `${(Math.min(t, total) / (total || 1)) * 100}%`;
  requestAnimationFrame(tick);
}

/* ---------- export ---------- */
function pickMime(withAudio) {
  const types = [
    ...(withAudio ? ["video/mp4;codecs=avc1.640028,mp4a.40.2", "video/mp4;codecs=avc1,mp4a.40.2", "video/mp4;codecs=avc1.640028,opus", "video/webm;codecs=vp9,opus"] : []),
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
/** While recording, nothing that changes the frame can be touched. */
function lock(on) {
  document.querySelector(".studio-controls").inert = on;
  for (const id of ["m-replay", "m-share", "m-play-scene"]) $(id).disabled = on;
  document.addEventListener("visibilitychange", warnHidden);
  if (!on) document.removeEventListener("visibilitychange", warnHidden);
}
function warnHidden() {
  if (document.hidden && state.recording) $("m-status").textContent = "خليك على هالصفحة لحد ما يخلص التسجيل، وإلا بيوقف الفيديو.";
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
  lock(true);
  const total = totalLength();
  let timer;
  if (withVideo) {
    video.loop = false;
    video.muted = false;
    seek(0);
    await new Promise((r) => (video.onseeked = r));
    rec.start(1000);
    await video.play();
    timer = setInterval(() => ($("m-status").textContent = `بسجّل… ${Math.round((video.currentTime / video.duration) * 100)}%`), 200);
    await new Promise((r) => (video.onended = r));
    video.onended = null;
    video.loop = true;
  } else {
    state.start = performance.now();
    rec.start(1000);
    timer = setInterval(() => ($("m-status").textContent = `بسجّل… ${Math.min(100, Math.round(((performance.now() - state.start) / 1000 / total) * 100))}%`), 200);
    await new Promise((r) => setTimeout(r, total * 1000 + 100));
  }
  await new Promise((r) => setTimeout(r, 120));
  rec.stop();
  await done;
  clearInterval(timer);
  state.recording = false;
  lock(false);
  const ext = download(chunks, mime, withVideo ? "motion-video" : "motion");
  $("m-status").textContent = ext === "mp4" ? "نزل الفيديو ✓" : "نزل الفيديو ✓ (WebM: CapCut بيفتحه. للنشر المباشر جرّب Chrome على الكمبيوتر)";
  restart();
}
$("m-export").addEventListener("click", async () => {
  $("m-export").disabled = true;
  try {
    await record(hasVideo());
  } catch {
    $("m-status").textContent = "صار خطأ بالتسجيل. جرّب مرة تانية بـ Chrome على الكمبيوتر.";
  } finally {
    state.recording = false;
    lock(false);
    $("m-export").disabled = false;
  }
});

/* ---------- design it with ChatGPT or Claude ---------- */
function aiPrompt() {
  return buildPrompt(templates, $("m-ai-idea").value, { hasVideo: hasVideo() });
}
function updateAiLinks() {
  const links = chatLinks(aiPrompt());
  $("m-ai-chatgpt").href = links.chatgpt;
  $("m-ai-claude").href = links.claude;
}
$("m-ai-idea").addEventListener("input", updateAiLinks);
for (const id of ["m-ai-chatgpt", "m-ai-claude"]) {
  $(id).addEventListener("click", () => {
    updateAiLinks();
    // a backup in case the chat opens empty
    navigator.clipboard?.writeText(aiPrompt()).catch(() => {});
    $("m-ai-status").textContent = "فتحتلك المحادثة. إذا طلعت فاضية الصق الطلب (انسخته لك). لما يرد، انسخ رده وارجع الصقه تحت.";
  });
}
$("m-ai-copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(aiPrompt());
    $("m-ai-status").textContent = "انتسخ الطلب ✓ الصقه بأي ذكاء اصطناعي، وارجع الصق رده تحت.";
  } catch {
    $("m-ai-status").textContent = "ما قدرت أنسخ. جرّب الأزرار فوق.";
  }
});
function applyAi() {
  const reply = $("m-ai-reply").value.trim();
  if (!reply) return;
  try {
    const scenes = parseDesign(reply, templates);
    const d = hasVideo() ? video.duration : Infinity;
    let t = 0.5;
    state.scenes = scenes.map((sc) => {
      const start = sc.start ?? t;
      t = Math.max(t, start) + sc.template.duration + 0.2;
      return { template: sc.template, props: sc.props, start: Number(Math.min(start, Math.max(0, d - 1)).toFixed(1)) };
    });
    state.sel = 0;
    refresh();
    restart();
    $("m-ai-status").textContent = `بنيت ${state.scenes.length} مشاهد ✓ عدّل الكلام براحتك ونزّل الفيديو.`;
    $("m-scenes").scrollIntoView({ behavior: "smooth", block: "center" });
  } catch {
    $("m-ai-status").textContent = "ما لقيت تصميم بالرد. تأكد إنك نسخت رده كله (الجزء اللي بين { و }).";
  }
}
$("m-ai-reply").addEventListener("input", () => {
  clearTimeout(applyAi.t);
  applyAi.t = setTimeout(applyAi, 400);
});
updateAiLinks();

/* ---------- share a design as a link ---------- */
// The link holds the scenes (template + text) and the look. Images and videos stay on the device.
function encodeDesign() {
  const data = {
    v: 1,
    s: state.settings,
    sc: state.scenes.map((sc) => ({
      id: sc.template.id,
      st: sc.start,
      p: textProps(sc.props),
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
    history.replaceState(null, "", location.pathname + location.search);
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
