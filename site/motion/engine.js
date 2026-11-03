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

export const FONTS = ["Kufam", "Changa", "Noto Kufi Arabic", "Cairo", "IBM Plex Sans Arabic"];

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
  ctx.font = `800 ${size}px "${env.font}"`;
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

export function makeEnv(canvas, { format, background, accent, font, danger }) {
  const f = FORMATS[format] ?? FORMATS.vertical;
  const theme = BACKGROUNDS[background] ?? BACKGROUNDS["grid-light"];
  return {
    W: f.w,
    H: f.h,
    u: Math.min(f.w, f.h) / 100, // 1% of the short side
    theme,
    accent,
    danger: danger ?? "#C8453A",
    font,
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
  ctx.font = `${weight} ${size}px "${env.font}"`;
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
