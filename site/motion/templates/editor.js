import { enter, prog, ease, roundRect, shake, layoutWords, text } from "../engine.js";

// Timing: the playhead runs HEAD0 -> HEAD1 across the timeline and hits the SFX block at HIT.
const DUR = 4.2;
const HEAD0 = 0.6;
const HEAD1 = 3.6;
const BLOCK = 0.5; // where the SFX block starts on the timeline (0..1)
const BLOCK_W = 0.16;
const HIT = HEAD0 + (HEAD1 - HEAD0) * BLOCK;
const RULER_SECONDS = 6;

const hash = (i) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};
/** Deterministic "speech" amplitude 0..1 for bar i. */
const voice = (i) => {
  const syllable = Math.pow(Math.abs(Math.sin(i * 0.23)), 0.6);
  const phrase = 0.55 + 0.45 * Math.sin(i * 0.045 + 1.2);
  const pause = Math.sin(i * 0.083 + 0.4) > 0.97 ? 0.12 : 1;
  return Math.min(1, (0.14 + 0.86 * syllable * phrase) * pause * (0.72 + 0.28 * hash(i)));
};

function drawCover(ctx, img, x, y, w, h, zoom = 1) {
  const s = Math.max(w / img.width, h / img.height) * zoom;
  ctx.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
}

export default {
  id: "editor",
  name: "جوا المونتاج",
  description: "المثال جوا برنامج مونتاج: صورة بالمعاينة وتحتها Timeline، والخط الأحمر بيضرب الصوت مع الحركة قدام الناس.",
  duration: DUR,
  fields: [
    { key: "image", label: "صورة أو سكرين شوت", type: "image" },
    { key: "title", label: "اسم النافذة", type: "text", default: "المونتاج" },
    { key: "sfx", label: "اسم الصوت على الـ Timeline", type: "text", default: "BOOM" },
    { key: "caption", label: "تحت النافذة", type: "text", default: "الصوت بيضرب مع الحركة بالضبط" },
  ],
  cues: [
    { t: 0, sfx: "Whoosh" },
    { t: HIT, sfx: "Impact", note: "لما يوصل الخط الأحمر للصوت" },
  ],
  draw(ctx, t, props, env) {
    const { W, H, u } = env;
    const out = 1 - prog(t, DUR - 0.35, 0.35);
    const wide = W > H;

    // ---- layout (all in u) ----
    const bar = u * 6;
    const pad = u * 1.3;
    const ruler = u * 3.4;
    const trackH = u * 5.4;
    const gap = u * 1.1;
    const gutter = u * 9;
    const tlH = ruler + u * 0.8 + 3 * trackH + 2 * gap + u * 1.6;
    const capSpace = u * 15;
    const maxW = W * 0.88;
    const availPh = H * 0.86 - capSpace - bar - tlH - pad * 2;
    const ph = Math.max(u * 20, Math.min((maxW - pad * 2) * (wide ? 0.5625 : 0.85), availPh));
    const w = Math.min(maxW, ph * (wide ? 2.35 : 2) + pad * 2);
    const pw = w - pad * 2;
    const h = bar + ph + pad + tlH + pad;
    const x = (W - w) / 2;
    const y = (H - h - capSpace) / 2;
    const px = x + pad;
    const py = y + bar;

    const headP = prog(t, HEAD0, HEAD1 - HEAD0);
    const hitP = prog(t, HIT, 0.5);
    const hitting = hitP > 0 && hitP < 1;

    ctx.save();
    enter(ctx, env, t, 0.55);
    ctx.globalAlpha *= out;

    // ---- window ----
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.32)";
    ctx.shadowBlur = u * 6;
    ctx.shadowOffsetY = u * 2;
    roundRect(ctx, x, y, w, h, u * 2.6);
    ctx.fillStyle = "#141619";
    ctx.fill();
    ctx.restore();
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, u * 2.6);
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = Math.max(1, u * 0.12);
    ctx.stroke();

    ["#FF5F57", "#FEBC2E", "#28C840"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + u * (4 + i * 3.2), y + bar / 2, u * 1, 0, Math.PI * 2);
      ctx.fill();
    });
    text(ctx, env, props.title ?? "", x + w / 2, y + bar / 2, { size: u * 2.8, weight: 600, color: "#C9CDD2" });
    // timecode that follows the playhead
    const secs = headP * RULER_SECONDS;
    const ss = Math.floor(secs);
    const ff = Math.floor((secs - ss) * 30);
    const tc = `00:00:${String(ss).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;
    text(ctx, env, tc, x + w - u * 3, y + bar / 2, { size: u * 2.3, weight: 600, color: "#8B939B", align: "right" });

    // ---- preview ----
    ctx.save();
    roundRect(ctx, px, py, pw, ph, u * 1.4);
    ctx.clip();
    ctx.fillStyle = "#0B0C0E";
    ctx.fillRect(px, py, pw, ph);
    const img = props.image;
    ctx.save();
    shake(ctx, env, t, HIT, 1.3);
    if (img && img.width) {
      const punch = hitting ? Math.sin(Math.PI * hitP) * 0.025 : 0;
      const zoom = 1.04 + ease.inOut(prog(t, 0.3, 3.6)) * 0.08 + punch;
      drawCover(ctx, img, px, py, pw, ph, zoom);
    } else {
      ctx.fillStyle = "#1C1F23";
      ctx.fillRect(px - u * 2, py - u * 2, pw + u * 4, ph + u * 4);
      text(ctx, env, "حط صورة أو سكرين شوت من الخانة", px + pw / 2, py + ph / 2, { size: u * 3.4, weight: 600, color: "#7E868F" });
    }
    ctx.restore();
    if (hitting) {
      ctx.fillStyle = `rgba(255,255,255,${Math.pow(1 - hitP, 2) * 0.18})`;
      ctx.fillRect(px, py, pw, ph);
    }
    ctx.restore();

    // ---- timeline ----
    const ty = py + ph + pad;
    roundRect(ctx, px, ty, pw, tlH, u * 1.4);
    ctx.fillStyle = "#0F1113";
    ctx.fill();
    const tx0 = px + gutter;
    const tx1 = px + pw - u * 1.4;
    const tw = tx1 - tx0;

    // ruler
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = Math.max(1, u * 0.12);
    const ticks = RULER_SECONDS * 5;
    for (let i = 0; i <= ticks; i++) {
      const tx = tx0 + (tw * i) / ticks;
      const major = i % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(tx, ty + ruler);
      ctx.lineTo(tx, ty + ruler - (major ? u * 1.3 : u * 0.6));
      ctx.stroke();
      if (major && i < ticks) {
        text(ctx, env, `00:0${i / 5}`, tx + u * 0.6, ty + ruler * 0.42, { size: u * 1.6, weight: 600, color: "#6E767F", align: "left" });
      }
    }
    ctx.restore();

    const rowY = (k) => ty + ruler + u * 0.8 + k * (trackH + gap);
    const labels = ["V1", "A1", "SFX"];
    labels.forEach((lb, k) => {
      const ry = rowY(k);
      roundRect(ctx, tx0, ry, tw, trackH, u * 0.8);
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.fill();
      ctx.fillStyle = k === 2 ? env.accent : "#5B636C";
      ctx.beginPath();
      ctx.arc(px + u * 2.2, ry + trackH / 2, u * 0.55, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, env, lb, px + u * 3.6, ry + trackH / 2, { size: u * 1.9, weight: 700, color: "#8B939B", align: "left" });
    });

    // video clip with thumbnails of the image
    {
      const g = ease.out(prog(t, 0.35, 0.6));
      const ry = rowY(0);
      const cw = tw * 0.98 * g;
      if (cw > 1) {
        ctx.save();
        roundRect(ctx, tx0, ry, cw, trackH, u * 0.8);
        ctx.clip();
        ctx.fillStyle = "#2A2E34";
        ctx.fillRect(tx0, ry, cw, trackH);
        const cell = trackH * 1.7;
        for (let cx = tx0, n = 0; cx < tx0 + cw; cx += cell, n++) {
          if (img && img.width) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(cx, ry, cell - u * 0.15, trackH);
            ctx.clip();
            drawCover(ctx, img, cx, ry, cell - u * 0.15, trackH, 1 + (n % 3) * 0.12);
            ctx.restore();
          } else {
            ctx.fillStyle = n % 2 ? "#30353C" : "#2A2E34";
            ctx.fillRect(cx, ry, cell - u * 0.15, trackH);
          }
        }
        ctx.restore();
        roundRect(ctx, tx0, ry, cw, trackH, u * 0.8);
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = Math.max(1, u * 0.16);
        ctx.stroke();
      }
    }

    // voice clip with a waveform
    {
      const g = ease.out(prog(t, 0.47, 0.6));
      const ry = rowY(1);
      const cx0 = tx0 + tw * 0.01;
      const cw = tw * 0.9 * g;
      if (cw > 1) {
        roundRect(ctx, cx0, ry, cw, trackH, u * 0.8);
        ctx.fillStyle = "#1F2328";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = Math.max(1, u * 0.12);
        ctx.stroke();
        const step = u * 0.55;
        const bw = Math.max(1, u * 0.28);
        const mid = ry + trackH / 2;
        ctx.fillStyle = "#A9B0B8";
        for (let i = 0, bx = cx0 + u * 0.6; bx < cx0 + cw - u * 0.6; i++, bx += step) {
          const a = voice(i) * trackH * 0.38;
          ctx.fillRect(bx, mid - a, bw, a * 2);
        }
      }
    }

    // SFX block
    const bx = tx0 + tw * BLOCK;
    const bw = tw * BLOCK_W;
    const by = rowY(2);
    {
      const appear = ease.back(prog(t, 0.75, 0.45));
      if (appear > 0) {
        const pop = hitting ? 1 + Math.sin(Math.PI * Math.min(1, hitP * 2)) * 0.12 : 1;
        const s = Math.max(0, appear) * pop;
        ctx.save();
        ctx.translate(bx + bw / 2, by + trackH / 2);
        ctx.scale(s, s);
        ctx.translate(-(bx + bw / 2), -(by + trackH / 2));
        roundRect(ctx, bx, by, bw, trackH, u * 0.8);
        ctx.fillStyle = env.accent;
        ctx.fill();
        // a short transient inside the block
        ctx.save();
        roundRect(ctx, bx, by, bw, trackH, u * 0.8);
        ctx.clip();
        ctx.fillStyle = env.onAccent;
        ctx.globalAlpha *= 0.16;
        const step = u * 0.5;
        for (let i = 0, xx = bx + u * 0.4; xx < bx + bw; i++, xx += step) {
          const a = Math.exp(-i * 0.09) * (0.6 + 0.4 * hash(i + 400)) * trackH * 0.42;
          ctx.fillRect(xx, by + trackH / 2 - a, Math.max(1, u * 0.24), a * 2);
        }
        ctx.restore();
        if (hitting) {
          roundRect(ctx, bx, by, bw, trackH, u * 0.8);
          ctx.fillStyle = `rgba(255,255,255,${(1 - hitP) * 0.4})`;
          ctx.fill();
        }
        const label = String(props.sfx ?? "");
        let fs = trackH * 0.44;
        ctx.font = `800 ${fs}px ${env.font}`;
        const lw = ctx.measureText(label).width;
        if (lw > bw - u * 1.6) fs *= (bw - u * 1.6) / lw;
        text(ctx, env, label, bx + bw / 2, by + trackH / 2, { size: fs, weight: 800, color: env.onAccent });
        ctx.restore();
        // crisp outline that expands on the hit
        if (hitting) {
          const e = ease.out(hitP) * u * 2.4;
          ctx.save();
          roundRect(ctx, bx - e, by - e, bw + e * 2, trackH + e * 2, u * 0.8 + e);
          ctx.strokeStyle = env.accent;
          ctx.globalAlpha *= 1 - hitP;
          ctx.lineWidth = Math.max(1, u * 0.35);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // playhead
    {
      const vis = prog(t, HEAD0 - 0.2, 0.2);
      if (vis > 0) {
        const hx = tx0 + tw * headP;
        const top = ty + u * 0.6;
        const bottom = rowY(2) + trackH + u * 0.6;
        ctx.save();
        ctx.globalAlpha *= vis;
        ctx.fillStyle = env.danger;
        ctx.fillRect(hx - Math.max(1, u * 0.14), top + u * 1.2, Math.max(2, u * 0.28), bottom - top - u * 1.2);
        roundRect(ctx, hx - u * 0.9, top, u * 1.8, u * 2.2, u * 0.5);
        ctx.fill();
        ctx.restore();
      }
    }

    // ---- caption, word by word ----
    const size = u * (wide ? 5.4 : 6);
    const words = layoutWords(ctx, env, props.caption ?? "", size, W * 0.88);
    const dy = y + h + u * 8.5 - H / 2;
    for (const wd of words) {
      const p = ease.out(prog(t, 0.8 + wd.i * 0.09, 0.4));
      if (p <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= p;
      const last = wd.i === words.length - 1 && words.length > 1;
      text(ctx, env, wd.word, wd.x, wd.y + dy + (1 - p) * u * 2, { size, weight: 800, color: last ? env.accent : env.theme.ink });
      ctx.restore();
    }

    ctx.restore();
  },
};
