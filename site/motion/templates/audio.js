import { enter, prog, ease, roundRect, shake, layoutWords, text } from "../engine.js";

// The waveform draws in from right to left between R0 and R1; the peak sits at PEAK (0 = left, 1 = right).
const DUR = 3.6;
const R0 = 0.35;
const R1 = 1.35;
const PEAK = 0.38;
const PEAK_T = R0 + (R1 - R0) * (1 - PEAK);

const hash = (i) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};
/** Envelope of the sound at time s (0..1 along the clip): a riser, then a hard drop that decays. */
function envelope(s) {
  const at = 1 - PEAK;
  if (s < at) return 0.07 + 0.55 * Math.pow(s / at, 2.6);
  const d = s - at;
  return 0.05 + 0.95 * Math.exp(-d * 6.5) * (0.85 + 0.15 * Math.cos(d * 60));
}

export default {
  id: "audio",
  name: "جوا برنامج الصوت",
  description: "الصوت جوا برنامج صوت: Waveform بيترسم، عداد بيضرب، وأزرار EQ بتتحرك. للحظة اللي بدك تبيّن فيها الصوت.",
  duration: DUR,
  fields: [
    { key: "label", label: "اسم الصوت", type: "text", default: "Deep Drop" },
    { key: "caption", label: "تحت النافذة", type: "text", default: "صوت نظيف وقوي" },
  ],
  cues: [{ t: PEAK_T, sfx: "Deep Drop", note: "على قمة الموجة (حط نفس الصوت اللي كتبته)" }],
  draw(ctx, t, props, env) {
    const { W, H, u } = env;
    const out = 1 - prog(t, DUR - 0.35, 0.35);
    const wide = W > H;

    // ---- layout ----
    const labelSpace = u * 13;
    const capSpace = u * 13;
    const w = Math.min(W * 0.86, u * 120);
    const h = Math.min(u * (wide ? 58 : 78), H - labelSpace - capSpace - u * 6);
    const x = (W - w) / 2;
    const y = (H - (labelSpace + h + capSpace)) / 2 + labelSpace;
    const bar = u * 6;
    const pad = u * 2.4;
    const cx0 = x + pad;
    const cw = w - pad * 2;
    const top = y + bar + u * 0.4;
    const inner = y + h - pad - top;
    const waveH = inner * 0.6;
    const meterW = u * 10;
    const waveW = cw - meterW - u * 1.6;

    const reveal = prog(t, R0, R1 - R0); // fraction revealed from the right edge
    const peakP = prog(t, PEAK_T, 0.6);
    const peaking = peakP > 0 && peakP < 1;
    const pulse = peaking ? Math.sin(Math.PI * Math.min(1, peakP * 1.6)) : 0;

    // current level 0..1 (what the meter shows)
    let level = 0;
    if (t >= R0 && t < PEAK_T) level = envelope(reveal) * (0.85 + 0.15 * Math.abs(Math.sin(t * 23)));
    else if (t >= PEAK_T) level = 0.3 + 0.12 * Math.abs(Math.sin(t * 8.5)) + 0.68 * Math.exp(-(t - PEAK_T) * 3.2);
    level = Math.min(1, level);

    ctx.save();
    enter(ctx, env, t, 0.5);
    ctx.globalAlpha *= out;

    // ---- label above ----
    {
      const p = ease.out(prog(t, 0.15, 0.45));
      const s = 1 + pulse * 0.07;
      ctx.save();
      ctx.globalAlpha *= p;
      ctx.translate(W / 2, y - labelSpace * 0.48 + (1 - p) * u * 2);
      ctx.scale(s, s);
      text(ctx, env, props.label ?? "", 0, 0, { size: u * (wide ? 7.5 : 8.5), weight: 800, color: env.accent });
      ctx.restore();
    }

    ctx.save();
    shake(ctx, env, t, PEAK_T, 0.7);

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
    const name = String(props.label ?? "").trim();
    text(ctx, env, name ? `${name}.wav` : "audio.wav", x + w / 2, y + bar / 2, { size: u * 2.6, weight: 600, color: "#C9CDD2" });
    const secs = Math.max(0, t - R0);
    const tc = `00:${String(Math.floor(secs)).padStart(2, "0")}.${String(Math.floor((secs % 1) * 100)).padStart(2, "0")}`;
    text(ctx, env, tc, x + w - u * 3, y + bar / 2, { size: u * 2.3, weight: 600, color: "#8B939B", align: "right" });

    // ---- waveform panel ----
    const wx = cx0;
    const wy = top;
    roundRect(ctx, wx, wy, waveW, waveH, u * 1.4);
    ctx.fillStyle = "#0F1113";
    ctx.fill();
    ctx.save();
    roundRect(ctx, wx, wy, waveW, waveH, u * 1.4);
    ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = Math.max(1, u * 0.12);
    for (let i = 1; i < 10; i++) {
      const gx = wx + (waveW * i) / 10;
      ctx.beginPath();
      ctx.moveTo(gx, wy);
      ctx.lineTo(gx, wy + waveH);
      ctx.stroke();
    }
    const mid = wy + waveH / 2;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(wx, mid - Math.max(0.5, u * 0.06), waveW, Math.max(1, u * 0.12));
    const step = u * 0.75;
    const bw = Math.max(1.5, u * 0.42);
    const n = Math.floor((waveW - u * 2) / step);
    const edge = wx + waveW - u - waveW * reveal; // the write head moves right -> left
    for (let i = 0; i < n; i++) {
      const bx = wx + u + i * step;
      if (bx < edge) continue;
      const f = (bx - wx) / waveW; // 0 left .. 1 right
      const s = 1 - f; // time along the sound
      const a = envelope(s) * (0.72 + 0.28 * hash(i)) * waveH * 0.46;
      const near = s >= 1 - PEAK - 0.01 && s <= 1 - PEAK + 0.14;
      ctx.fillStyle = near ? env.accent : "#B9BFC6";
      // fresh bars grow in at the write head
      const grow = Math.min(1, (bx - edge) / (u * 4));
      roundRect(ctx, bx, mid - a * grow, bw, Math.max(bw, a * grow * 2), bw / 2);
      ctx.fill();
    }
    if (reveal > 0 && reveal < 1) {
      ctx.fillStyle = env.accent;
      ctx.fillRect(edge - Math.max(1, u * 0.14), wy, Math.max(2, u * 0.28), waveH);
    }
    ctx.restore();

    // ---- level meter (L / R) ----
    {
      const mx = wx + waveW + u * 1.6;
      roundRect(ctx, mx, wy, meterW, waveH, u * 1.4);
      ctx.fillStyle = "#0F1113";
      ctx.fill();
      const segs = 18;
      const mTop = wy + u * 4.2;
      const mBot = wy + waveH - u * 3.6;
      const segGap = u * 0.35;
      const segH = (mBot - mTop - segGap * (segs - 1)) / segs;
      const colW = (meterW - u * 3.4) / 2;
      [0, 1].forEach((c) => {
        const lv = Math.min(1, level * (c ? 0.94 + 0.06 * Math.sin(t * 13) : 1));
        const colX = mx + u * 1.2 + c * (colW + u * 1);
        for (let k = 0; k < segs; k++) {
          const sy = mBot - (k + 1) * segH - k * segGap;
          const lit = (k + 0.5) / segs <= lv;
          ctx.fillStyle = lit ? (k >= segs - 2 ? env.danger : env.accent) : "rgba(255,255,255,0.07)";
          roundRect(ctx, colX, sy, colW, segH, Math.min(segH / 2, u * 0.3));
          ctx.fill();
        }
        text(ctx, env, c ? "R" : "L", colX + colW / 2, wy + waveH - u * 1.8, { size: u * 1.8, weight: 700, color: "#6E767F" });
      });
      const db = level > 0.001 ? 20 * Math.log10(level) : -60;
      text(ctx, env, db <= -59 ? "-inf" : db.toFixed(1), mx + meterW / 2, wy + u * 2.2, { size: u * 1.9, weight: 700, color: "#C9CDD2" });
    }

    // ---- EQ knobs ----
    {
      const ky = wy + waveH + u * 1.6;
      const kh = y + h - pad - ky;
      roundRect(ctx, cx0, ky, cw, kh, u * 1.4);
      ctx.fillStyle = "#0F1113";
      ctx.fill();
      const names = ["LOW", "MID", "HIGH"];
      const targets = [0.74, 0.46, 0.62];
      const colW = cw / 3;
      const r = Math.min(kh * 0.22, colW * 0.24);
      const a0 = Math.PI * 0.75;
      const sweep = Math.PI * 1.5;
      names.forEach((nm, i) => {
        const kx = cx0 + colW * (i + 0.5);
        const kcy = ky + kh * 0.36;
        const wob = i === 0 ? pulse * 0.12 : pulse * 0.05 * (i === 2 ? -1 : 1);
        const v = Math.max(0, Math.min(1, targets[i] * ease.out(prog(t, 0.45 + i * 0.12, 0.9)) + wob));
        ctx.lineCap = "round";
        ctx.lineWidth = u * 0.7;
        ctx.strokeStyle = "rgba(255,255,255,0.09)";
        ctx.beginPath();
        ctx.arc(kx, kcy, r * 1.22, a0, a0 + sweep);
        ctx.stroke();
        if (v > 0.002) {
          ctx.strokeStyle = env.accent;
          ctx.beginPath();
          ctx.arc(kx, kcy, r * 1.22, a0, a0 + sweep * v);
          ctx.stroke();
        }
        const g = ctx.createLinearGradient(kx, kcy - r, kx, kcy + r);
        g.addColorStop(0, "#2E3238");
        g.addColorStop(1, "#1B1E22");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(kx, kcy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.10)";
        ctx.lineWidth = Math.max(1, u * 0.12);
        ctx.stroke();
        const ang = a0 + sweep * v;
        ctx.strokeStyle = "#F2F4F2";
        ctx.lineWidth = u * 0.45;
        ctx.beginPath();
        ctx.moveTo(kx + Math.cos(ang) * r * 0.35, kcy + Math.sin(ang) * r * 0.35);
        ctx.lineTo(kx + Math.cos(ang) * r * 0.8, kcy + Math.sin(ang) * r * 0.8);
        ctx.stroke();
        ctx.lineCap = "butt";
        const gain = v * 24 - 12;
        const lbY = kcy + r * 1.22 + u * 2.2;
        text(ctx, env, nm, kx, lbY, { size: u * 1.9, weight: 700, color: "#8B939B" });
        text(ctx, env, `${gain >= 0 ? "+" : ""}${gain.toFixed(1)} dB`, kx, lbY + u * 2.4, { size: u * 1.9, weight: 600, color: "#C9CDD2" });
      });
    }
    ctx.restore(); // shake

    // ---- caption, word by word ----
    const size = u * (wide ? 5.4 : 6);
    const words = layoutWords(ctx, env, props.caption ?? "", size, W * 0.88);
    const dy = y + h + capSpace * 0.55 - H / 2;
    for (const wd of words) {
      const p = ease.out(prog(t, 0.7 + wd.i * 0.1, 0.4));
      if (p <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= p;
      text(ctx, env, wd.word, wd.x, wd.y + dy + (1 - p) * u * 2, { size, weight: 800 });
      ctx.restore();
    }

    ctx.restore();
  },
};
