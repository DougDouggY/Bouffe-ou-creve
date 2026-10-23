const hats = [
  ["croissant", "Couronne croissant", "🥐", 220, 1.35, 0.95],
  ["pizza", "Part de pizza", "🍕", 250, 1.3, 1.05],
  ["pancakes", "Pile de pancakes", "🥞", 280, 1.35, 0.95],
  ["strawberry", "Bonnet fraise", "🍓", 200, 1.2, 1.15],
  ["mushroom", "Chapeau champignon", "🍄", 240, 1.4, 1.1],
  ["sushi", "Maki impérial", "🍣", 300, 1.3, 0.95],
  ["egg", "Œuf au plat", "🍳", 180, 1.4, 0.8],
  ["icecream", "Cornet givré", "🍦", 350, 1.05, 1.5],
  ["popcorn", "Seau de popcorn", "🍿", 280, 1.2, 1.2],
  ["waffle", "Gaufre dorée", "🧇", 240, 1.3, 1.0],
  ["teacup", "Tasse de thé", "☕", 320, 1.4, 1.0],
  ["cream", "Chantilly cerise", "🍒", 260, 1.2, 1.2],
  ["pastry", "Haut-de-forme pâtissier", "🎩", 500, 1.3, 1.35],
  ["lemon", "Citron pressé", "🍋", 210, 1.25, 1.0],
  ["teapot", "Théière royale", "🫖", 450, 1.55, 1.15],
];
const outfits = [
  ["bistro", "Tablier du bistrot", "🍽️", "#b65b4e", 220],
  ["chocolate", "Veste chocolatier", "🍫", "#643b2c", 280],
  ["sushi", "Maître sushi", "🍣", "#294664", 350],
  ["gardener", "Salopette tomate", "🍅", "#c74c3d", 200],
  ["icecream", "Vendeur de glaces", "🍨", "#a0cdb8", 250],
  ["royal", "Robe du grand banquet", "👑", "#d9ae50", 650],
  ["sailor", "Marinière du buffet", "⚓", "#456779", 230],
  ["wizard", "Mage de la prune", "🪄", "#795392", 450],
  ["beekeeper", "Apiculteur gourmand", "🍯", "#e9dbb2", 350],
  ["avocado", "Poncho avocat", "🥑", "#84a25b", 260],
  ["pastry", "Doudoune feuilletée", "🥐", "#dca960", 320],
  ["maitre", "Maître d’or", "🥂", "#343338", 550],
  ["chili", "Piment de compétition", "🌶️", "#bc4239", 300],
  ["strawberry", "Pâtissier fraise", "🍓", "#e1a2a7", 280],
  ["tropical", "Chemise des tropiques", "🍍", "#48a7a5", 300],
];
export const EXTRA_COSMETICS = [
  ...hats.map(([id, name, icon, price]) => ({
    id: "hat_" + id,
    name,
    icon,
    price,
    slot: "hat",
    isNew: true,
  })),
  ...outfits.map(([id, name, icon, color, price]) => ({
    id: "outfit_" + id,
    name,
    icon,
    color,
    price,
    slot: "outfit",
    isNew: true,
  })),
];
export const EXTRA_HAT_BOUNDS = Object.fromEntries(
  hats.map(([id, , , , width, height]) => [
    "hat_" + id,
    { width, height },
  ]),
);
const ids = new Set(EXTRA_COSMETICS.map((item) => item.id));
const images = new Map();
export function extraCosmeticImage(id) {
  if (!ids.has(id)) return null;
  if (!images.has(id)) {
    const image = new Image();
    image.addEventListener("load", () =>
      document.dispatchEvent(new Event("extra-cosmetics-loaded")),
    );
    image.src = new URL(`./assets/cosmetics/${id}.webp`, import.meta.url).href;
    images.set(id, image);
  }
  return images.get(id);
}
export function drawExtraCosmetic(context, id, x, y, width, height) {
  const image = extraCosmeticImage(id);
  if (!image) return null;
  if (!image.complete || !image.naturalWidth) return false;
  context.drawImage(image, x, y, width, height);
  return true;
}
