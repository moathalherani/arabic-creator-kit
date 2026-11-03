// Motion Studio engine: draws a template frame by frame on a <canvas>.
// A template is a plain object (see templates/*.js):
//   { id, name, description, duration, fields: [...], cues: [...], draw(ctx, t, props, env) }
// `t` is seconds since the start. `env` gives the size, theme and helpers below.

export const FORMATS = {
  vertical: { w: 1080, h: 1920, label: "عمودي 9:16 (ريلز، تيك توك)" },
  square: { w: 1080, h: 1080, label: "مربع 1:1" },
  landscape: { w: 1920, h: 1080, label: "عرضي 16:9 (يوتيوب)" },
};

export const BACKGROUNDS = {
  "grid-light": { label: "Grid أبيض ثلاثي الأبعاد", bg: "#F6F7F5", line: "rgba(28,31,29,0.10)", ink: "#1C1F1D", muted: "#5F6A63", card: "#FFFFFF" },
  "grid-dark": { label: "Grid غامق", bg: "#0F1211", line: "rgba(255,255,255,0.08)", ink: "#F2F4F2", muted: "#A3ADA6", card: "#181C1A" },
  green: { label: "شاشة خضرا (للـ Chroma key)", bg: "#00B140", line: null, ink: "#FFFFFF", muted: "#E8FFE8", card: "#111312" },
  plain: { label: "أبيض بدون Grid", bg: "#FFFFFF", line: null, ink: "#1C1F1D", muted: "#5F6A63", card: "#F4F5F3" },
};

/** Arabic fonts (Google Fonts) and the weights to load for each. */
export const AR_FONTS = {
  Kufam: "500;700;800",
  Changa: "500;700;800",
  "Noto Kufi Arabic": "500;700;800",
  Cairo: "500;700;800",
  Tajawal: "500;700;800",
  Alexandria: "500;700;800",
  "Reem Kufi": "500;700",
  "Readex Pro": "500;700",
  "IBM Plex Sans Arabic": "500;700",
  "El Messiri": "500;700",
  Almarai: "700;800",
};

/** English fonts. "" means: use the Arabic font for English too. */
export const EN_FONTS = {
  "": "",
  Montserrat: "500;700;800",
  Poppins: "500;700;800",
  Inter: "500;700;800",
  "Space Grotesk": "500;700",
  Sora: "500;700;800",
  Manrope: "500;700;800",
  Archivo: "500;700;800",
  "Bebas Neue": "400",
};

/** Ready color sets: accent, text, background, cards, problem. */
export const PALETTES = [
  { name: "أخضر سينمائي", accent: "#5F8A55", ink: "#1C1F1D", bg: "#F6F7F5", card: "#FFFFFF", danger: "#C8453A" },
  { name: "زيتي", accent: "#7D8B4E", ink: "#22241C", bg: "#F5F5EF", card: "#FFFFFF", danger: "#B5482F" },
  { name: "عسلي", accent: "#C98A2E", ink: "#231D14", bg: "#FAF6EF", card: "#FFFFFF", danger: "#B53A2E" },
  { name: "غرافيتي", accent: "#2B2E31", ink: "#16181A", bg: "#FFFFFF", card: "#F2F3F4", danger: "#C0392B" },
  { name: "ليموني على أسود", accent: "#C6F432", ink: "#F4F6F2", bg: "#0E0F0E", card: "#191B19", danger: "#FF5A4E" },
  { name: "أزرق ليلي", accent: "#4C8DFF", ink: "#EEF2F8", bg: "#0C111B", card: "#151C2A", danger: "#FF6B5E" },
];

function hexToRgb(hex) {
  const m = String(hex).match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a) {
  const c = hexToRgb(hex);
  return c ? `rgba(${c[0]},${c[1]},${c[2]},${a})` : hex;
}

/* ---------- easing ---------- */
export const ease = {
  out: (x) => 1 - Math.pow(1 - clamp01(x), 3),
  inOut: (x) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
  back: (x) => { x = clamp01(x); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
};
export function clamp01(x) { return Math.max(0, Math.min(1, x)); }
/** progress of t inside [start, start+dur], 0..1 */
export function prog(t, start, dur) { return clamp01((t - start) / dur); }

/* ---------- drawing helpers ---------- */
export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** 3D "studio floor" grid that drifts like a camera. */
export function drawGrid(ctx, env, t) {
  const { W, H, theme } = env;
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);
  if (!theme.line) return;
  const horizon = H * 0.42;
  const cx = W / 2 + Math.sin(t * 0.6) * W * 0.04;
  const speed = (t * 0.35) % 1;
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = Math.max(1, W / 540);
  // floor: lines converging to the horizon
  for (let i = -14; i <= 14; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * W * 0.012, horizon);
    ctx.lineTo(cx + i * W * 0.22, H);
    ctx.stroke();
  }
  for (let k = 0; k < 14; k++) {
    const z = (k + speed) / 14;
    const y = horizon + Math.pow(z, 2.2) * (H - horizon);
    ctx.globalAlpha = 0.25 + z * 0.75;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // back wall: a flat grid fading up
  ctx.globalAlpha = 1;
  const step = W / 9;
  for (let x = ((cx % step) + step) % step; x < W; x += step) {
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, theme.line);
    ctx.strokeStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, horizon);
    ctx.stroke();
  }
  ctx.strokeStyle = theme.line;
  for (let y = horizon; y > 0; y -= step) {
    ctx.globalAlpha = (y / horizon) * 0.9;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Glow ring that "hits" the floor on big moments (keep them rare). */
export function ring(ctx, env, x, y, p) {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.strokeStyle = env.accent;
  ctx.globalAlpha = (1 - p) * 0.7;
  ctx.lineWidth = env.u * (1 - p) * 1.4;
  ctx.beginPath();
  ctx.ellipse(x, y, env.u * 14 * ease.out(p), env.u * 4.5 * ease.out(p), 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Scene entry: a quick 3D turn (rotateY look) and settle. */
export function enter(ctx, env, t, dur = 0.45) {
  const p = ease.out(prog(t, 0, dur));
  const angle = (1 - p) * 0.9; // radians-ish
  ctx.translate(env.W / 2, env.H / 2);
  ctx.transform(Math.cos(angle * 0.6), Math.sin(angle) * 0.08, 0, 1, 0, 0);
  ctx.scale(0.9 + 0.1 * p, 0.9 + 0.1 * p);
  ctx.translate(-env.W / 2, -env.H / 2);
  ctx.globalAlpha = p;
}

/** Small camera shake for Deep Drop / Impact moments. */
export function shake(ctx, env, t, at, strength = 1) {
  const p = prog(t, at, 0.28);
  if (p <= 0 || p >= 1) return;
  const a = (1 - p) * env.u * 0.9 * strength;
  ctx.translate(Math.sin(t * 90) * a, Math.cos(t * 70) * a);
}

/**
 * Lay out words right-to-left on one or more centred lines, for per-word animation.
 * Returns [{ word, x, y, w, i }] with x as the word's centre.
 */
export function layoutWords(ctx, env, text, size, maxWidth, lineHeight = 1.25) {
  ctx.font = `800 ${size}px ${env.font}`;
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  const space = ctx.measureText(" ").width;
  const lines = [[]];
  let lineW = 0;
  for (const word of words) {
    const w = ctx.measureText(word).width;
    if (lines.at(-1).length && lineW + space + w > maxWidth) {
      lines.push([]);
      lineW = 0;
    }
    lines.at(-1).push({ word, w });
    lineW += (lines.at(-1).length > 1 ? space : 0) + w;
  }
  const out = [];
  const totalH = lines.length * size * lineHeight;
  let i = 0;
  lines.forEach((line, li) => {
    const width = line.reduce((s, x) => s + x.w, 0) + space * (line.length - 1);
    const rtl = env.rtl(text);
    let cursor = rtl ? env.W / 2 + width / 2 : env.W / 2 - width / 2;
    const y = env.H / 2 - totalH / 2 + size * lineHeight * (li + 0.5);
    for (const it of line) {
      const cx = rtl ? cursor - it.w / 2 : cursor + it.w / 2;
      out.push({ word: it.word, x: cx, y, w: it.w, i: i++ });
      cursor += (rtl ? -1 : 1) * (it.w + space);
    }
  });
  return out;
}

export function makeEnv(canvas, { format, background, accent, fontAr, fontEn, font, danger, ink, bg, card }, size) {
  const f = size ?? FORMATS[format] ?? FORMATS.vertical;
  const preset = BACKGROUNDS[background] ?? BACKGROUNDS["grid-light"];
  const theme = { ...preset };
  if (ink) {
    theme.ink = ink;
    theme.muted = rgba(ink, 0.62);
    if (preset.line) theme.line = rgba(ink, 0.1);
  }
  if (bg && background !== "green") theme.bg = bg;
  if (card) theme.card = card;
  const ar = fontAr || font || "Kufam";
  const stack = fontEn ? `"${fontEn}", "${ar}", sans-serif` : `"${ar}", sans-serif`;
  const rgb = hexToRgb(accent) ?? [95, 138, 85];
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  return {
    onAccent: lum > 0.6 ? "#111311" : "#FFFFFF", // text/icon color that reads on the accent
    W: f.w,
    H: f.h,
    u: Math.min(f.w, f.h) / 100, // 1% of the short side
    theme,
    accent,
    danger: danger || "#C8453A",
    font: stack,
    transparent: false,
    rtl: (s) => /[\u0600-\u06FF]/.test(String(s)),
  };
}

/** Draw one frame of a template. */
export function renderFrame(canvas, template, props, settings, t) {
  const env = makeEnv(canvas, settings);
  if (canvas.width !== env.W) canvas.width = env.W;
  if (canvas.height !== env.H) canvas.height = env.H;
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  drawGrid(ctx, env, t);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  template.draw(ctx, t, props, env);
  ctx.restore();
}

/* ---------- your video + motion ---------- */
export const LAYOUTS = {
  none: { label: "بدون فيديو" },
  bottom: { label: "فيديوك تحت والموشن فوق" },
  frame: { label: "فيديوك بإطار أبيض" },
  circle: { label: "فيديوك بدائرة" },
  full: { label: "فيديوك كامل والموشن فوقه" },
};

/** Where the video and the motion go for a layout. */
export function layoutRects(layout, W, H) {
  const vertical = H >= W;
  const r = (x, y, w, h) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
  if (layout === "full") return { video: r(0, 0, W, H), motion: r(0, 0, W, H) };
  if (layout === "bottom") {
    return vertical
      ? { video: r(0, H * 0.5, W, H * 0.5), motion: r(0, 0, W, H * 0.5) }
      : { video: r(0, 0, W * 0.5, H), motion: r(W * 0.5, 0, W * 0.5, H) };
  }
  if (layout === "frame") {
    if (vertical) {
      const fw = W * 0.78;
      const fh = fw * 0.8;
      const fy = H - fh - H * 0.07;
      return { video: r((W - fw) / 2, fy, fw, fh), motion: r(0, 0, W, fy - H * 0.01), rounded: true };
    }
    const fh = H * 0.72;
    const fw = fh * 0.8;
    return { video: r(W * 0.06, (H - fh) / 2, fw, fh), motion: r(W * 0.06 + fw, 0, W - fw - W * 0.06, H), rounded: true };
  }
  if (layout === "circle") {
    if (vertical) {
      const d = W * 0.52;
      const cy = H - d / 2 - H * 0.07;
      return { video: r((W - d) / 2, cy - d / 2, d, d), motion: r(0, 0, W, cy - d / 2 - H * 0.01), circle: true };
    }
    const d = H * 0.6;
    return { video: r(W * 0.08, (H - d) / 2, d, d), motion: r(W * 0.08 + d, 0, W - d - W * 0.08, H), circle: true };
  }
  return { video: null, motion: r(0, 0, W, H) };
}

/** Draw a video frame to fill rect (like object-fit: cover). */
function drawCover(ctx, video, rect) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;
  const s = Math.max(rect.w / vw, rect.h / vh);
  const sw = rect.w / s;
  const sh = rect.h / s;
  ctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, rect.x, rect.y, rect.w, rect.h);
}

/** Keyword caption chunk (from arabic-captions keywordCaptions) popping in over the video. */
function drawCaption(ctx, env, cap, tSec, rect) {
  if (!cap) return;
  const p = prog(tSec, cap.start / 1000, 0.12);
  const size = Math.round(env.u * (env.H > env.W ? 6.2 : 5));
  const s = 0.9 + 0.1 * ease.back(p);
  const words = cap.words ?? cap.text.split(/\s+/);
  ctx.save();
  ctx.font = `800 ${size}px ${env.font}`;
  const space = ctx.measureText(" ").width;
  const widths = words.map((w) => ctx.measureText(w).width);
  const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
  const rtl = env.rtl(cap.text);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h * 0.8;
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.globalAlpha = Math.min(1, p * 2);
  ctx.lineJoin = "round";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  let cursor = rtl ? total / 2 : -total / 2;
  words.forEach((w, i) => {
    const x = rtl ? cursor - widths[i] / 2 : cursor + widths[i] / 2;
    ctx.direction = env.rtl(w) ? "rtl" : "ltr";
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.strokeText(w, x, 0);
    ctx.fillStyle = i === cap.keyword ? env.accent : "#FFFFFF";
    ctx.fillText(w, x, 0);
    cursor += (rtl ? -1 : 1) * (widths[i] + space);
  });
  ctx.restore();
}

/**
 * One frame: background, the person's video in its layout (optional), every active scene
 * drawn in the motion area (templates resize to fit), then the keyword caption.
 * layers: [{ template, props, t }] with t = seconds into that scene.
 */
export function composeFrame(canvas, off, layers, settings, video, layout, tAll, caption) {
  const env = makeEnv(canvas, settings);
  if (canvas.width !== env.W) canvas.width = env.W;
  if (canvas.height !== env.H) canvas.height = env.H;
  const ctx = canvas.getContext("2d");
  const withVideo = video && layout !== "none" && video.videoWidth;
  const rects = layoutRects(withVideo ? layout : "none", env.W, env.H);
  const active = layers.filter((l) => l.t >= 0 && l.t <= l.template.duration);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  if (withVideo && layout === "full") {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, env.W, env.H);
    drawCover(ctx, video, rects.video);
    const k = Math.max(0, ...active.map((l) => Math.min(prog(l.t, 0, 0.3), 1 - prog(l.t, l.template.duration - 0.3, 0.3))));
    if (k > 0) {
      ctx.fillStyle = `rgba(0,0,0,${0.35 * k})`;
      ctx.fillRect(0, 0, env.W, env.H);
    }
  } else {
    drawGrid(ctx, env, tAll);
    const v = rects.video;
    if (withVideo && v) {
      ctx.save();
      if (rects.circle) {
        ctx.beginPath();
        ctx.arc(v.x + v.w / 2, v.y + v.h / 2, v.w / 2, 0, Math.PI * 2);
        ctx.clip();
      } else if (rects.rounded) {
        roundRect(ctx, v.x, v.y, v.w, v.h, env.u * 4);
        ctx.clip();
      }
      drawCover(ctx, video, v);
      ctx.restore();
      if (layout === "bottom") {
        const vertical = env.H >= env.W;
        const g = vertical ? ctx.createLinearGradient(0, v.y, 0, v.y + v.h * 0.14) : ctx.createLinearGradient(v.x + v.w, 0, v.x + v.w * 0.86, 0);
        g.addColorStop(0, env.theme.bg);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        if (vertical) ctx.fillRect(v.x, v.y, v.w, v.h * 0.14);
        else ctx.fillRect(v.x + v.w * 0.86, v.y, v.w * 0.14, v.h);
      } else {
        ctx.save();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = env.u * 1.2;
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = env.u * 3;
        if (rects.circle) {
          ctx.beginPath();
          ctx.arc(v.x + v.w / 2, v.y + v.h / 2, v.w / 2, 0, Math.PI * 2);
        } else roundRect(ctx, v.x, v.y, v.w, v.h, env.u * 4);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  const m = rects.motion;
  for (const layer of active) {
    if (!withVideo) {
      // no video: the scene owns the whole canvas
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      layer.template.draw(ctx, layer.t, layer.props, env);
      ctx.restore();
      continue;
    }
    if (off.width !== m.w) off.width = m.w;
    if (off.height !== m.h) off.height = m.h;
    const octx = off.getContext("2d");
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.clearRect(0, 0, m.w, m.h);
    octx.save();
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    const menv = makeEnv(off, settings, { w: m.w, h: m.h });
    if (layout === "full" && hexToRgb(settings.ink)) {
      const c = hexToRgb(settings.ink);
      if ((0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 < 0.5) menv.theme = { ...menv.theme, ink: "#FFFFFF", muted: "rgba(255,255,255,0.78)" };
    }
    layer.template.draw(octx, layer.t, layer.props, menv);
    octx.restore();
    ctx.drawImage(off, m.x, m.y);
  }
  if (caption) drawCaption(ctx, env, caption, tAll, withVideo && rects.video ? rects.video : { x: 0, y: env.H * 0.5, w: env.W, h: env.H * 0.5 });
  ctx.restore();
}

/** Wrap text to lines that fit maxWidth (uses the current ctx.font). */
export function wrapLines(ctx, text, maxWidth) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && ctx.measureText(next).width > maxWidth) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Fill text, right-to-left when it has Arabic. */
export function text(ctx, env, s, x, y, { size = 60, weight = 700, color, align = "center" } = {}) {
  ctx.font = `${weight} ${size}px ${env.font}`;
  ctx.direction = env.rtl(s) ? "rtl" : "ltr";
  ctx.textAlign = align;
  ctx.fillStyle = color ?? env.theme.ink;
  ctx.fillText(s, x, y);
}

/** A card with a soft shadow and a colored edge. */
export function card(ctx, env, x, y, w, h, edge) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = env.u * 4;
  ctx.shadowOffsetY = env.u * 1.2;
  roundRect(ctx, x, y, w, h, env.u * 3.2);
  ctx.fillStyle = env.theme.card;
  ctx.fill();
  ctx.restore();
  if (edge) {
    ctx.save();
    roundRect(ctx, x, y, w, h, env.u * 3.2);
    ctx.strokeStyle = edge;
    ctx.lineWidth = env.u * 0.6;
    ctx.stroke();
    ctx.restore();
  }
}
