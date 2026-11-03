import { enter, prog, ease, roundRect, text } from "../engine.js";

/** Draw an image to fill a rect (object-fit: cover), with zoom and a vertical scroll 0..1. */
function cover(ctx, img, x, y, w, h, zoom, scroll) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const s = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * s;
  const dh = ih * s;
  const dx = x + (w - dw) / 2;
  const dy = dh > h ? y - (dh - h) * scroll : y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

export default {
  id: "phone",
  name: "شاشة تلفون",
  description: "سكرين شوت من تطبيق أو موقع جوا تلفون نظيف، بيطلع من تحت وبيلف شوي وبيثبت.",
  duration: 4.5,
  fields: [
    { key: "image", label: "سكرين شوت التلفون", type: "image" },
    { key: "caption", label: "تحت التلفون", type: "text", default: "شوف التطبيق من جوا" },
    { key: "badge", label: "ملصق صغير جنب التلفون (فاضي = بدون)", type: "text", default: "مجاني" },
  ],
  cues: [
    { t: 0.05, sfx: "Whoosh", note: "التلفون طالع من تحت" },
    { t: 1.25, sfx: "UI Click", note: "لما يطلع الملصق" },
  ],
  draw(ctx, t, props, env) {
    const { W, H, u, theme } = env;
    const vertical = H > W;
    const capSize = u * (vertical ? 6.2 : 5.2);
    const ph = vertical ? Math.min(H * 0.6, (W * 0.6) / 0.485) : H * 0.68;
    const pw = ph * 0.485;
    const capGap = u * (vertical ? 7 : 5);
    const block = ph + capGap + capSize;
    const px = (W - pw) / 2;
    const py = H / 2 - block / 2;
    const pcx = px + pw / 2;
    const pcy = py + ph / 2;

    ctx.save();
    enter(ctx, env, t, 0.5);
    ctx.globalAlpha *= 1 - prog(t, this.duration - 0.35, 0.35);

    // phone: slides up, turns in from a slight 3D angle, then settles and floats
    const rise = ease.out(prog(t, 0, 0.95));
    const turn = 1 - ease.out(prog(t, 0.05, 1.3));
    const a = turn * 0.55;
    const float = Math.sin(Math.max(0, t - 1.2) * 1.8) * u * 0.6 * prog(t, 1.2, 0.6);
    ctx.save();
    ctx.translate(pcx, pcy + (1 - rise) * H * 0.55 + float);
    ctx.rotate(turn * -0.07);
    ctx.transform(Math.cos(a), Math.sin(a) * 0.16, 0, 1, 0, 0);
    ctx.translate(-pcx, -pcy);

    const r = pw * 0.16;
    const bez = pw * 0.032;
    // side buttons
    ctx.fillStyle = "#2A2C30";
    const btn = (bx, by, bh) => {
      roundRect(ctx, bx, by, pw * 0.014, bh, pw * 0.007);
      ctx.fill();
    };
    btn(px - pw * 0.011, py + ph * 0.17, ph * 0.04);
    btn(px - pw * 0.011, py + ph * 0.24, ph * 0.07);
    btn(px - pw * 0.011, py + ph * 0.33, ph * 0.07);
    btn(px + pw - pw * 0.003, py + ph * 0.27, ph * 0.1);

    // body with a soft drop shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = u * 7;
    ctx.shadowOffsetY = u * 3;
    roundRect(ctx, px, py, pw, ph, r);
    ctx.fillStyle = "#0C0D0F";
    ctx.fill();
    ctx.restore();
    // thin metal edge
    const edge = ctx.createLinearGradient(px, py, px + pw, py + ph);
    edge.addColorStop(0, "#9A9EA5");
    edge.addColorStop(0.5, "#3B3E43");
    edge.addColorStop(1, "#8A8E95");
    roundRect(ctx, px, py, pw, ph, r);
    ctx.strokeStyle = edge;
    ctx.lineWidth = Math.max(1.5, pw * 0.009);
    ctx.stroke();

    // screen
    const sx = px + bez;
    const sy = py + bez;
    const sw = pw - bez * 2;
    const sh = ph - bez * 2;
    ctx.save();
    roundRect(ctx, sx, sy, sw, sh, r - bez);
    ctx.clip();
    const img = props.image;
    if (img && (img.naturalWidth || img.width)) {
      ctx.fillStyle = "#000";
      ctx.fillRect(sx, sy, sw, sh);
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const tall = (ih / iw) * sw > sh * 1.1;
      const zoom = tall ? 1 : 1 + ease.inOut(prog(t, 0.9, 3.2)) * 0.07;
      const scroll = tall ? ease.inOut(prog(t, 1.3, 2.7)) * 0.6 : 0;
      cover(ctx, img, sx, sy, sw, sh, zoom, scroll);
    } else {
      // placeholder: a quiet app skeleton in the theme colors
      ctx.fillStyle = theme.card;
      ctx.fillRect(sx, sy, sw, sh);
      const m = sw * 0.08;
      const bar = (bx, by, bw, bh, alpha, color = theme.ink) => {
        ctx.save();
        ctx.globalAlpha *= alpha;
        ctx.fillStyle = color;
        roundRect(ctx, bx, by, bw, bh, Math.min(bh / 2, sw * 0.04));
        ctx.fill();
        ctx.restore();
      };
      text(ctx, env, "9:41", sx + m * 1.4, sy + sw * 0.075, { size: sw * 0.045, weight: 700, color: theme.ink });
      bar(sx + sw - m - sw * 0.14, sy + sw * 0.055, sw * 0.14, sw * 0.04, 0.5);
      bar(sx + sw - m - sw * 0.42, sy + sh * 0.1, sw * 0.42, sw * 0.07, 0.85);
      bar(sx + m, sy + sh * 0.18, sw - m * 2, sh * 0.2, 0.07);
      for (let k = 0; k < 4; k++) {
        const ry = sy + sh * (0.43 + k * 0.085);
        bar(sx + sw - m - sw * 0.14, ry, sw * 0.14, sw * 0.14, 0.09);
        bar(sx + m, ry + sw * 0.015, sw * 0.5, sw * 0.04, 0.12);
        bar(sx + m + sw * 0.2, ry + sw * 0.08, sw * 0.3, sw * 0.03, 0.07);
      }
      bar(sx + m, sy + sh * 0.82, sw - m * 2, sw * 0.13, 1, env.accent);
      text(ctx, env, "حط سكرين شوت من الخانة", sx + sw / 2, sy + sh * 0.82 + sw * 0.065, { size: sw * 0.05, weight: 700, color: env.onAccent });
    }
    // a crisp glass reflection
    ctx.save();
    ctx.globalAlpha *= 0.07;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + sw * 0.62, sy);
    ctx.lineTo(sx, sy + sh * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // dynamic island
    const iw = pw * 0.3;
    const ih = pw * 0.088;
    roundRect(ctx, pcx - iw / 2, sy + pw * 0.035, iw, ih, ih / 2);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore(); // phone transform

    // floating badge
    const badge = String(props.badge ?? "").trim();
    const bp = prog(t, 1.2, 0.45);
    if (badge && bp > 0) {
      const s = ease.back(bp);
      const bs = u * (vertical ? 4.4 : 3.8);
      ctx.font = `800 ${bs}px ${env.font}`;
      const tw = ctx.measureText(badge).width;
      const dot = bs * 1.25;
      const bh = bs * 2.3;
      const bw = tw + dot + bs * 2.1;
      const bx = Math.min(px + pw - bw * 0.35, W - bw - u * 3);
      const by = py + ph * 0.2 + Math.sin(t * 2.2 + 1) * u * 0.7 + float;
      ctx.save();
      ctx.globalAlpha *= Math.min(1, bp * 2);
      ctx.translate(bx + bw / 2, by + bh / 2);
      ctx.scale(s, s);
      ctx.rotate((1 - s) * 0.2 - 0.04);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.shadowBlur = u * 3;
      ctx.shadowOffsetY = u;
      roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
      ctx.fillStyle = theme.card;
      ctx.fill();
      ctx.restore();
      // accent check dot on the start (right) side
      const dx = bw / 2 - bs * 0.9 - dot / 2;
      ctx.fillStyle = env.accent;
      ctx.beginPath();
      ctx.arc(dx, 0, dot / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = env.onAccent;
      ctx.lineWidth = bs * 0.13;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(dx - dot * 0.22, 0);
      ctx.lineTo(dx - dot * 0.05, dot * 0.17);
      ctx.lineTo(dx + dot * 0.24, -dot * 0.16);
      ctx.stroke();
      text(ctx, env, badge, dx - dot / 2 - bs * 0.4, bs * 0.05, { size: bs, weight: 800, color: theme.ink, align: "right" });
      ctx.restore();
    }

    // caption
    const cp = ease.out(prog(t, 0.85, 0.55));
    if (props.caption && cp > 0) {
      ctx.save();
      ctx.globalAlpha *= cp;
      text(ctx, env, props.caption, W / 2, py + ph + capGap + capSize / 2 + (1 - cp) * u * 3, { size: capSize, weight: 800 });
      ctx.restore();
    }
    ctx.restore();
  },
};
