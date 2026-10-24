const SVG = "http://www.w3.org/2000/svg";
const WIDTH = 1536;
const HEIGHT = 1024;
const INGREDIENTS = [
  ["gourmand-entry", "#ffd15b"],
  ["solo-entry", "#ffe79e"],
  ["multiplayer-entry", "#ffb563"],
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
  const illustration = await loadImage(
    new URL("./assets/burger-chicken-menu.webp?v=wardrobe-41", import.meta.url)
      .href,
  );
  const layers = await Promise.all(
    INGREDIENTS.map(async ([id, color]) => {
      const group = svg.querySelector(`#${id}, [data-menu-mode="${id}"]`);
      const url = new URL(`./assets/mask-home-${id}.png`, import.meta.url).href;
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
      // Move only this ingredient's original pixels inside its fixed silhouette.
      // The untouched illustration below fills the tiny exposed strip: no holes,
      // doubled outer contours or pixels borrowed from neighboring ingredients.
      context.clearRect(0, 0, WIDTH, HEIGHT);
      context.drawImage(illustration, 0, 0);
      context.globalCompositeOperation = "destination-in";
      context.drawImage(image, 0, 0);
      context.globalCompositeOperation = "source-over";
      const surface = element("g", {
        class: "ingredient-surface",
        mask: `url(#alpha-${id})`,
        "aria-hidden": "true",
      });
      const texture = element("image", {
        class: "ingredient-texture",
        href: canvas.toDataURL(),
        width: WIDTH,
        height: HEIGHT,
      });
      const bounds = group.querySelector("path").getBBox();
      texture.style.transformOrigin = `${bounds.x + bounds.width / 2}px ${bounds.y + bounds.height / 2}px`;
      surface.append(texture);
      group.insertBefore(surface, group.querySelector("text"));
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
      return { group, alpha, texture, image };
    }),
  );
  svg.prepend(defs);
  const secretBackdrop = await loadImage(
    new URL("./assets/secrets/burger-sober-backdrop.webp", import.meta.url)
      .href,
  );
  // Keep the approved ingredient pixels intact while changing only their surroundings.
  const secretIllustration = document.createElement("canvas");
  secretIllustration.width = WIDTH;
  secretIllustration.height = HEIGHT;
  const scene = secretIllustration.getContext("2d");
  scene.drawImage(secretBackdrop, 0, 0, WIDTH, HEIGHT);
  const ingredientMask = document.createElement("canvas");
  ingredientMask.width = WIDTH;
  ingredientMask.height = HEIGHT;
  const maskContext = ingredientMask.getContext("2d");
  for (const layer of layers) maskContext.drawImage(layer.image, 0, 0);
  const approvedFood = document.createElement("canvas");
  approvedFood.width = WIDTH;
  approvedFood.height = HEIGHT;
  const foodContext = approvedFood.getContext("2d");
  foodContext.drawImage(illustration, 0, 0, WIDTH, HEIGHT);
  foodContext.globalCompositeOperation = "destination-in";
  foodContext.drawImage(ingredientMask, 0, 0);
  scene.drawImage(approvedFood, 0, 0);
  const secretBackground = secretIllustration.toDataURL();
  function applyTheme() {
    const secret = document.body.classList.contains("shadow-realm");
    document.querySelector("#title-screen").style.backgroundImage =
      `url("${secret ? secretBackground : illustration.src}")`;
    for (const layer of layers) {
      const canvas = document.createElement("canvas");
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        secret ? secretIllustration : illustration,
        0,
        0,
        WIDTH,
        HEIGHT,
      );
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(layer.image, 0, 0);
      layer.texture.setAttribute("href", canvas.toDataURL());
    }
  }
  document.addEventListener("shadowchange", applyTheme);
  applyTheme();

  // All four entrances live on the recipe itself, including on a cropped phone menu.
  svg.dataset.multiEntry = "characters";
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
    // Selection follows the four independent ingredient alpha masks.
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
  svg.addEventListener("pointerdown", (event) => hover(pick(event)));
  svg.addEventListener("pointerleave", () => hover(null));
  svg.addEventListener("pointercancel", () => hover(null));
  const forwarded = new WeakSet();
  let selecting = false;
  svg.addEventListener(
    "click",
    (event) => {
      if (forwarded.has(event)) return;
      const group =
        event.isTrusted && event.detail > 0
          ? pick(event)
          : event.target.closest(".ingredient-button");
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!group || selecting) return;
      selecting = true;
      group.classList.add("is-selecting");
      const reducedMotion = matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const activate = () => {
        group.classList.remove("is-selecting");
        hover(null);
        selecting = false;
        const click = new MouseEvent("click", { bubbles: true });
        forwarded.add(click);
        group.dispatchEvent(click);
      };
      // A short press/rebound remains visible before changing screens.
      if (reducedMotion) activate();
      else setTimeout(activate, 220);
    },
    true,
  );
  svg.classList.add("has-alpha-masks");
  svg.dataset.masksReady = "true";
}
