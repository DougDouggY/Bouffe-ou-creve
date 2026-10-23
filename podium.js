import { cosmeticMotion } from "./cosmetic-effects.js?v=podium-35";
import { teamSurface } from "./teams.js?v=rivalries-33";
let redraw;
export function clearPodium() {
  document.querySelector("#match-podium")?.replaceChildren();
  document.querySelector("#match-podium")?.setAttribute("hidden", "");
  if (redraw) document.removeEventListener("extra-cosmetics-loaded", redraw);
  redraw = null;
}
export function showPodium(results, people, renderAvatar) {
  clearPodium();
  const root = document.querySelector("#match-podium");
  if (!root || !results) return;
  root.hidden = false;
  const animated = new Set(),
    portraits = [];
  const byId = new Map(people.map((p) => [p.id, p]));
  for (const [kind, title, ids, note] of [
    [
      "champion",
      "LE CHAMPION",
      results.champions,
      results.teamSize > 1 && results.champions.length
        ? `Équipe ${results.teamId + 1}`
        : "",
    ],
    [
      "predator",
      "LE PLUS GROS PRÉDATEUR",
      results.predators.length ? [results.predators[0]] : [],
      results.predatorKills
        ? `${results.predatorKills} gourmand${results.predatorKills > 1 ? "s" : ""} dévoré${results.predatorKills > 1 ? "s" : ""}${
            results.predators.length > 1
              ? " · ex æquo avec " +
                results.predators
                  .slice(1)
                  .map((id) => byId.get(id)?.name || "Gourmand")
                  .join(", ")
              : ""
          }`
        : "Aucun gourmand dévoré",
    ],
    [
      "first",
      "LE BURGER DU JOUR",
      results.first === null ? [] : [results.first],
      "Premier gourmand éliminé",
    ],
  ]) {
    const card = document.createElement("article");
    card.className = "podium-course podium-course--" + kind;
    const heading = document.createElement("h3");
    heading.textContent = title;
    card.append(heading);
    const stage = document.createElement("div");
    stage.className = "podium-stage";
    if (kind === "first") {
      const bun = document.createElement("span");
      bun.className = "podium-bun";
      bun.textContent = "🍔";
      bun.setAttribute("aria-hidden", "true");
      stage.append(bun);
    }
    for (const id of ids) {
      const person = byId.get(id);
      if (!person) continue;
      const portrait = document.createElement("figure"),
        canvas = document.createElement("canvas"),
        name = document.createElement("figcaption");
      canvas.width = 240;
      canvas.height = 300;
      canvas.setAttribute("aria-label", "Tenue de " + person.name);
      name.textContent = person.name;
      if (results.teamSize > 1) {
        name.style.backgroundColor = teamSurface(person.teamId);
        name.style.color = "#fff8e8";
      }
      const animation = person.cosmetics?.podium;
      if (
        animation &&
        animation !== "podium_none" &&
        !animated.has(id) &&
        cosmeticMotion() === "full"
      )
        canvas.className = "podium-animation " + animation;
      animated.add(id);
      portrait.append(canvas, name);
      stage.append(portrait);
      renderAvatar(canvas, person);
      portraits.push([canvas, person]);
    }
    if (!ids.length) {
      const empty = document.createElement("p");
      empty.textContent =
        kind === "champion"
          ? "Aucun vainqueur · égalité"
          : kind === "first"
            ? "Personne n’a été éliminé"
            : "Le buffet était tranquille";
      stage.append(empty);
    }
    const caption = document.createElement("p");
    caption.textContent = note;
    card.append(stage, caption);
    root.append(card);
  }
  redraw = () =>
    portraits.forEach(([canvas, person]) => renderAvatar(canvas, person));
  document.addEventListener("extra-cosmetics-loaded", redraw);
  root.dataset.motion = cosmeticMotion();
}
