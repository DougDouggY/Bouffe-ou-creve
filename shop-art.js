// One illustrated atlas, fetched only when the Dressing needs a thumbnail.
const ids = [
  ...["ketchup", "mayo", "gold", "flame", "toxic"].map((id) => "aura_" + id),
  ...["belly", "burp", "jump", "champion", "despair"].map(
    (id) => "podium_" + id,
  ),
  ...Array.from({ length: 11 }, (_, i) => "title_" + i),
];
let atlas, slides;
export function drawShopArt(canvas, item) {
  const ctx = canvas.getContext("2d");
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (item.slot === "slide" && slides?.complete && slides.naturalWidth) {
      const index = item.art,
        w = slides.naturalWidth / 3,
        rows = [0, 488, 970].map((y) => (y * slides.naturalHeight) / 1024),
        row = Math.floor(index / 3),
        h = rows[row + 1] - rows[row],
        scale = Math.min(canvas.width / w, canvas.height / h);
      ctx.drawImage(
        slides,
        (index % 3) * w,
        rows[row],
        w,
        h,
        (canvas.width - w * scale) / 2,
        (canvas.height - h * scale) / 2,
        w * scale,
        h * scale,
      );
      canvas.dataset.illustrated = "true";
      return;
    }
    const index = ids.indexOf(item.id);
    if (index >= 0 && atlas?.complete && atlas.naturalWidth) {
      const w = atlas.naturalWidth / 3;
      // The generated sheet has measured row gutters, not uniform row heights.
      const rows = [0, 262, 515, 771, 1032, 1291, 1558, 1860].map(
        (y) => (y * atlas.naturalHeight) / 1916,
      );
      const y = rows[Math.floor(index / 3)],
        h = rows[Math.floor(index / 3) + 1] - y;
      const scale = Math.min(canvas.width / w, canvas.height / h);
      ctx.drawImage(
        atlas,
        (index % 3) * w,
        y,
        w,
        h,
        (canvas.width - w * scale) / 2,
        (canvas.height - h * scale) / 2,
        w * scale,
        h * scale,
      );
      canvas.dataset.illustrated = "true";
      return;
    }
    // An empty porcelain plate for unequipped slots; no emoji fallback.
    ctx.fillStyle = "#eee2c9";
    ctx.strokeStyle = "#b49a64";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(
      canvas.width / 2,
      canvas.height * 0.55,
      canvas.width * 0.31,
      canvas.height * 0.24,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#c7b68a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(
      canvas.width / 2,
      canvas.height * 0.55,
      canvas.width * 0.25,
      canvas.height * 0.18,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  };
  if (item.slot === "slide") {
    if (!slides) {
      slides = new Image();
      slides.src = new URL(
        "./assets/cosmetics/slide-art.webp",
        import.meta.url,
      ).href;
    }
    if (!slides.complete) slides.addEventListener("load", draw, { once: true });
  }
  if (ids.includes(item.id)) {
    if (!atlas) {
      atlas = new Image();
      atlas.src = new URL(
        "./assets/cosmetics/collection-art.webp",
        import.meta.url,
      ).href;
    }
    if (!atlas.complete) atlas.addEventListener("load", draw, { once: true });
  }
  draw();
}
