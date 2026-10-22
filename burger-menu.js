const SVG = "http://www.w3.org/2000/svg";
const WIDTH = 1536;
const HEIGHT = 1024;
const INGREDIENTS = [
  ["trophies-entry", "#ffd15b"],
  ["somalia", "#a5ed7b"],
  ["classic", "#ff6859"],
  ["gros", "#ffdb74"],
  ["menu-shop", "#ffae63"],
  ["options-entry", "#ffdc93"],
];

function element(tag, attrs = {}) {
  const node = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attrs))
    node.setAttribute(key, value);
  return node;
}

async function loadImage(src) {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}

export async function setupBurgerMenu() {
  const svg = document.querySelector("svg.burger-menu");
  const defs = element("defs");
  const layers = await Promise.all(
    INGREDIENTS.map(async ([id, color]) => {
      const group = svg.querySelector(`#${id}, [data-menu-mode="${id}"]`);
      const url = new URL(`./assets/mask-${id}.png`, import.meta.url).href;
      const image = await loadImage(url);
      const canvas = document.createElement("canvas");
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, WIDTH, HEIGHT).data;
      const alpha = new Uint8Array(WIDTH * HEIGHT);
      for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3];

      const mask = element("mask", {
        id: `alpha-${id}`,
        maskUnits: "userSpaceOnUse",
        x: 0,
        y: 0,
        width: WIDTH,
        height: HEIGHT,
        "mask-type": "alpha",
      });
      mask.append(
        element("image", { href: url, width: WIDTH, height: HEIGHT }),
      );
      // A luminous rim is computed from the raster silhouette, never the old SVG path.
      const rim = context.createImageData(WIDTH, HEIGHT);
      const rgb = color.match(/\w\w/g).map((hex) => parseInt(hex, 16));
      for (let y = 3; y < HEIGHT - 3; y++) {
        for (let x = 3; x < WIDTH - 3; x++) {
          const p = y * WIDTH + x;
          const inside = Math.min(
            alpha[p - 3],
            alpha[p + 3],
            alpha[p - WIDTH * 3],
            alpha[p + WIDTH * 3],
          );
          const edge = Math.max(0, alpha[p] - inside);
          const offset = p * 4;
          rim.data[offset] = rgb[0];
          rim.data[offset + 1] = rgb[1];
          rim.data[offset + 2] = rgb[2];
          rim.data[offset + 3] = Math.round(edge * 0.88 + alpha[p] * 0.1);
        }
      }
      context.putImageData(rim, 0, 0);
      const light = element("g", {
        class: "ingredient-light",
        mask: `url(#alpha-${id})`,
        "aria-hidden": "true",
      });
      light.append(
        element("image", {
          href: canvas.toDataURL(),
          width: WIDTH,
          height: HEIGHT,
        }),
      );
      const gradient = element("linearGradient", {
        id: `shine-${id}`,
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "40%",
      });
      for (const [offset, opacity] of [
        [0, 0],
        [0.38, 0],
        [0.5, 0.35],
        [0.62, 0],
        [1, 0],
      ]) {
        gradient.append(
          element("stop", {
            offset,
            "stop-color": color,
            "stop-opacity": opacity,
          }),
        );
      }
      defs.append(mask, gradient);
      light.append(
        element("rect", {
          class: "ingredient-reflection",
          x: -WIDTH / 2,
          y: 0,
          width: WIDTH * 2,
          height: HEIGHT,
          fill: `url(#shine-${id})`,
        }),
      );
      group.insertBefore(light, group.querySelector("text"));
      group.dataset.ingredient = id;
      return { group, alpha };
    }),
  );
  svg.prepend(defs);

  let hovered = null;
  function pick(event) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
    const x = Math.floor(point.x),
      y = Math.floor(point.y);
    if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return null;
    return (
      layers.find((layer) => layer.alpha[y * WIDTH + x] >= 128)?.group || null
    );
  }
  function hover(group) {
    if (group === hovered) return;
    hovered?.classList.remove("is-hovered");
    hovered = group;
    hovered?.classList.add("is-hovered");
    svg.style.cursor = group ? "pointer" : "";
  }
  svg.addEventListener("pointermove", (event) => hover(pick(event)));
  svg.addEventListener("pointerleave", () => hover(null));
  svg.addEventListener("pointercancel", () => hover(null));
  svg.addEventListener(
    "click",
    (event) => {
      // Keyboard handlers dispatch synthetic clicks on the semantic SVG buttons.
      if (!event.isTrusted || event.detail === 0) return;
      const group = pick(event);
      event.preventDefault();
      event.stopImmediatePropagation();
      group?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      if (event.pointerType === "touch") hover(null);
    },
    true,
  );
  svg.classList.add("has-alpha-masks");
  svg.dataset.masksReady = "true";
}
