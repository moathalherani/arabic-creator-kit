import { enter, prog, ease, shake, ring, card, wrapLines, text } from "../engine.js";

/** "label | value" lines -> [{ label, value, decimals, pre, suf }] */
function parseBars(s) {
  return String(s ?? "")
    .split("\n")
    .map((line) => {
      const [label = "", raw = ""] = line.split("|").map((c) => c.trim());
      const clean = raw.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
      const m = clean.match(/-?[\d,]*\.?\d+/);
      if (!label || !m) return null;
      return {
        label,
        value: Math.max(0, Number(m[0].replace(/,/g, "")) || 0),
        decimals: (m[0].split(".")[1] || "").length,
        pre: clean.slice(0, m.index).trim(),
        suf: clean.slice(m.index + m[0].length).trim(),
      };
    })
    .filter(Boolean)
    .slice(0, 6);
}

function fmt(v, decimals) {
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Bar with rounded top corners and a flat base. */
function barPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

const START = 0.5; // first bar
const STEP = 0.45; // gap between bars
const GROW = 0.65; // how long a bar grows

export default {
  id: "chart",
  name: "رسم بياني",
  description: "أعمدة بتطلع وحدة ورا الثانية والأرقام بتعدّ، وأطول عمود بلونك. للأرقام اللي بتحكي عنها بالفيديو.",
  duration: 4.6,
  fields: [
    { key: "title", label: "العنوان", type: "text", default: "المشاهدات بعد ما غيّرت الهوك" },
    { key: "bars", label: "الأعمدة: الاسم | الرقم (سطر لكل عمود، مثال تجريبي)", type: "textarea", default: "قبل | 1200\nبعد أسبوع | 4800\nبعد شهر | 15000" },
  ],
  cues: [
    { t: START, sfx: "Pop", note: "مع كل عمود، كل 0.45 ثانية" },
    { t: START + 2 * STEP + GROW, sfx: "Impact", note: "لما يكمل أطول عمود" },
  ],
  draw(ctx, t, props, env) {
    const { W, H, u, theme } = env;
    const bars = parseBars(props.bars);
    const n = Math.max(1, bars.length);
    const max = Math.max(1e-9, ...bars.map((b) => b.value));
    let top = 0;
    bars.forEach((b, i) => { if (b.value >= bars[top].value) top = i; });
    const hitAt = START + top * STEP + GROW;

    const vertical = H > W;
    const cw = Math.min(W * 0.86, u * 132);
    const ch = vertical ? Math.min(H * 0.52, cw * 1.25) : H * 0.64;
    const titleSize = u * (vertical ? 6.4 : 5.6);
    ctx.font = `800 ${titleSize}px ${env.font}`;
    const titleLines = props.title ? wrapLines(ctx, props.title, cw).slice(0, 2) : [];
    const titleH = titleLines.length * titleSize * 1.3;
    const gap = titleLines.length ? u * 4.5 : 0;
    const blockY = H / 2 - (titleH + gap + ch) / 2;
    const cx0 = (W - cw) / 2;
    const cy0 = blockY + titleH + gap;

    ctx.save();
    enter(ctx, env, t);
    shake(ctx, env, t, hitAt, 0.8);
    ctx.globalAlpha *= 1 - prog(t, this.duration - 0.35, 0.35);

    // title
    titleLines.forEach((line, i) => {
      const p = ease.out(prog(t, 0.12 + i * 0.1, 0.5));
      ctx.save();
      ctx.globalAlpha *= p;
      text(ctx, env, line, W / 2, blockY + titleSize * 1.3 * (i + 0.5) + (1 - p) * u * 3, { size: titleSize, weight: 800 });
      ctx.restore();
    });

    card(ctx, env, cx0, cy0, cw, ch, null);

    // plot area
    const pad = u * 5;
    const labelSpace = u * 8;
    const valueSpace = u * 16;
    const plotL = cx0 + pad;
    const plotR = cx0 + cw - pad;
    const baseY = cy0 + ch - pad - labelSpace;
    const plotTop = cy0 + pad + valueSpace;
    const plotH = baseY - plotTop;
    const slot = (plotR - plotL) / n;
    const bw = Math.min(slot * 0.56, u * 20);

    // faint guide lines + baseline
    ctx.save();
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = Math.max(1, u * 0.18);
    for (let k = 1; k <= 3; k++) {
      const y = baseY - (plotH * k) / 3;
      ctx.save();
      ctx.globalAlpha *= 0.07;
      ctx.beginPath();
      ctx.moveTo(plotL, y);
      ctx.lineTo(plotR, y);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha *= 0.28;
    ctx.lineWidth = Math.max(1, u * 0.3);
    ctx.beginPath();
    ctx.moveTo(plotL, baseY);
    ctx.lineTo(plotR, baseY);
    ctx.stroke();
    ctx.restore();

    if (!bars.length) {
      text(ctx, env, "اكتب الأعمدة: الاسم | الرقم", W / 2, cy0 + ch / 2, { size: u * 4, weight: 600, color: theme.muted });
      ctx.restore();
      return;
    }

    // value + label sizes that fit their slot
    let valueSize = u * (n > 4 ? 4 : 5);
    let labelSize = u * (n > 4 ? 3.2 : 3.8);
    ctx.font = `800 ${valueSize}px ${env.font}`;
    const widest = Math.max(...bars.map((b) => ctx.measureText(`${b.pre}${fmt(b.value, b.decimals)}${b.suf}`).width));
    if (widest > slot * 0.92) valueSize *= (slot * 0.92) / widest;
    ctx.font = `600 ${labelSize}px ${env.font}`;
    const widestL = Math.max(...bars.map((b) => ctx.measureText(b.label).width));
    if (widestL > slot * 0.94) labelSize *= (slot * 0.94) / widestL;

    // the ring hits the floor under the tallest bar, drawn first so the bar sits on it
    ring(ctx, env, plotR - slot * (top + 0.5), baseY, prog(t, hitAt, 0.8));

    bars.forEach((b, i) => {
      const at = START + i * STEP;
      const p = ease.out(prog(t, at, GROW));
      const appear = prog(t, at, 0.2);
      // right to left: the first item sits on the right
      const cx = plotR - slot * (i + 0.5);
      const hi = i === top;
      const fullH = Math.max(u * 1.2, (b.value / max) * plotH);
      const h = fullH * p;
      const y = baseY - h;

      ctx.save();
      ctx.globalAlpha *= appear;
      text(ctx, env, b.label, cx, baseY + labelSpace * 0.55, { size: labelSize, weight: hi ? 700 : 600, color: hi ? theme.ink : theme.muted });
      ctx.restore();

      if (h > 0.5) {
        ctx.save();
        barPath(ctx, cx - bw / 2, y, bw, h, u * 2);
        if (hi) ctx.fillStyle = env.accent;
        else {
          ctx.fillStyle = theme.ink;
          ctx.globalAlpha *= 0.16;
        }
        ctx.fill();
        ctx.restore();
      }

      // counting value above the bar
      if (appear > 0) {
        const pop = hi ? 1 + Math.sin(Math.PI * prog(t, hitAt, 0.3)) * 0.12 : 1;
        ctx.save();
        ctx.globalAlpha *= Math.min(1, prog(t, at, 0.25) * 1.5);
        ctx.translate(cx, y - u * 3.6);
        ctx.scale(pop, pop);
        const v = `${b.pre}${fmt(b.value * p, b.decimals)}${b.suf}`;
        ctx.font = `800 ${valueSize}px ${env.font}`;
        ctx.direction = "ltr";
        ctx.textAlign = "center";
        ctx.fillStyle = hi ? env.accent : theme.ink;
        ctx.fillText(v, 0, 0);
        ctx.restore();
      }

      // small upward arrow on the tallest bar
      if (hi) {
        const ap = prog(t, hitAt - 0.05, 0.4);
        if (ap > 0) {
          const s = ease.back(ap);
          const r = u * 3.2;
          const ay = y - u * 3.6 - valueSize * 0.6 - u * 1.4 - r;
          ctx.save();
          ctx.globalAlpha *= Math.min(1, ap * 2);
          ctx.translate(cx, ay + (1 - s) * u * 2);
          ctx.scale(s, s);
          ctx.fillStyle = env.accent;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = env.onAccent;
          ctx.lineWidth = u * 0.55;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(0, r * 0.5);
          ctx.lineTo(0, -r * 0.48);
          ctx.moveTo(-r * 0.4, -r * 0.08);
          ctx.lineTo(0, -r * 0.5);
          ctx.lineTo(r * 0.4, -r * 0.08);
          ctx.stroke();
          ctx.restore();
        }
      }
    });

    ctx.restore();
  },
};
