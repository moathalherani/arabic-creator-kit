// Share buttons for X, WhatsApp, Threads and the phone's own share sheet.
// renderShare(container, { text, url }) fills the container; call it again to update.
const enc = encodeURIComponent;

export function renderShare(box, { text, url, label = "شاركه" }) {
  const full = `${text}\n${url}`;
  const links = [
    ["X", `https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}`],
    ["WhatsApp", `https://wa.me/?text=${enc(full)}`],
    ["Threads", `https://www.threads.net/intent/post?text=${enc(full)}`],
  ];
  box.replaceChildren();
  const title = Object.assign(document.createElement("span"), { className: "share-label", textContent: label });
  box.append(title);
  if (navigator.share) {
    const b = Object.assign(document.createElement("button"), { type: "button", className: "chip", textContent: "مشاركة" });
    b.addEventListener("click", () => navigator.share({ text, url }).catch(() => {}));
    box.append(b);
  }
  for (const [name, href] of links) {
    box.append(Object.assign(document.createElement("a"), { className: "chip", href, target: "_blank", rel: "noopener", textContent: name }));
  }
  const copy = Object.assign(document.createElement("button"), { type: "button", className: "chip", textContent: "انسخ" });
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(full);
      copy.textContent = "انتسخ ✓";
      setTimeout(() => (copy.textContent = "انسخ"), 1500);
    } catch {}
  });
  box.append(copy);
}
