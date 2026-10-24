import { cosmeticMotion } from "./cosmetic-effects.js?v=ceremony-38";
import { teamSurface } from "./teams.js?v=rivalries-33";
let scene = null;
export function podiumActive() {
  return !!scene;
}
export function clearPodium() {
  if (scene) {
    cancelAnimationFrame(scene.raf);
    clearTimeout(scene.timer);
    document.removeEventListener("extra-cosmetics-loaded", scene.redraw);
    scene = null;
  }
  const root = document.querySelector("#match-podium");
  root?.replaceChildren();
  if (root) root.hidden = true;
  document.body.classList.remove("ceremony-open");
}
function poseAt(actor, time) {
  const phase = time * 0.001,
    id = actor.person.id,
    age = (time - actor.celebrateAt) / 1000;
  const blink = (phase + id * 0.71) % 4;
  const pose = {
    time,
    breath: Math.sin(phase * 2.5 + id),
    headBob: Math.sin(phase * 2.5 + id) * 0.012,
    headTurn: Math.sin(phase * 0.6 + id) * 0.025,
    look: Math.sin(phase * 0.9 + id) * 0.025,
    blink: blink > 3.84 ? Math.sin(((blink - 3.84) / 0.16) * Math.PI) : 0,
    armL: Math.sin(phase * 1.5 + id) * 0.04,
    armR: Math.sin(phase * 1.5 + id + 0.7) * 0.04,
    legL: 0,
    legR: 0,
    jump: 0,
    mouth: 0,
  };
  if (!actor.enabled || age < 0 || age > 2.7) return pose;
  const t = Math.min(1, Math.max(0, age / 2.7)),
    weight =
      Math.sin((Math.min(1, t * 6) * Math.PI) / 2) * Math.min(1, (1 - t) * 5),
    beat = Math.sin(age * 7);
  const animation = actor.person.cosmetics?.podium;
  const kind =
    animation && animation !== "podium_none"
      ? animation
      : {
          champion: "podium_champion",
          predator: "podium_belly",
          first: "podium_despair",
        }[actor.kind];
  if (kind === "podium_champion") {
    pose.armL = weight * (1.8 + beat * 0.3);
    pose.armR = -weight * (2.1 - beat * 0.25);
    pose.headTurn = beat * 0.09 * weight;
    pose.mouth = 0.65 * weight;
    pose.legL = beat * 0.18 * weight;
    pose.legR = -beat * 0.18 * weight;
  }
  if (kind === "podium_belly") {
    pose.armL = (-0.65 + beat * 0.28) * weight;
    pose.armR = (0.65 + beat * 0.28) * weight;
    pose.headTurn = beat * 0.1 * weight;
    pose.legL = beat * 0.13 * weight;
    pose.legR = -beat * 0.13 * weight;
    pose.mouth = 0.25 * weight;
  }
  if (kind === "podium_burp") {
    pose.armL = -0.9 * weight;
    pose.armR = 0.5 * weight;
    pose.headTurn = -0.12 * weight;
    pose.mouth = Math.max(0, Math.sin(age * 3)) * weight;
  }
  if (kind === "podium_jump") {
    pose.armL = 2.4 * weight;
    pose.armR = -2.4 * weight;
    pose.legL = Math.sin(age * 8) * 0.5 * weight;
    pose.legR = -Math.sin(age * 8) * 0.5 * weight;
    pose.jump = Math.max(0, Math.sin(age * 7)) * 25 * weight;
    pose.mouth = 0.8 * weight;
  }
  if (kind === "podium_despair") {
    pose.armL = -1.45 * weight;
    pose.armR = 0.8 * weight;
    pose.headBob = 0.09 * weight;
    pose.headTurn = (0.18 + Math.sin(age * 24) * 0.04) * weight;
    pose.coverFace = weight > 0.3;
    pose.sad = true;
    pose.legL = -0.12 * weight;
    pose.legR = 0.1 * weight;
  }
  return pose;
}
export function showPodium(results, people, renderAvatar) {
  clearPodium();
  const root = document.querySelector("#match-podium");
  if (!root || !results) return;
  root.hidden = false;
  root.dataset.motion = cosmeticMotion();
  root.dataset.intro = cosmeticMotion() === "full" ? "playing" : "done";
  document.body.classList.add("ceremony-open");
  const header = document.createElement("div");
  header.className = "ceremony-marquee";
  header.textContent = "LES GOURMANDS · LES HONNEURS DE LA MAISON";
  const skip = document.createElement("button");
  skip.type = "button";
  skip.className = "ceremony-skip";
  skip.textContent = "Passer l’introduction";
  root.append(header, skip);
  const rig = document.createElement("div");
  rig.className = "ceremony-lights";
  rig.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 3; i++) {
    const light = document.createElement("i");
    light.style.setProperty("--beam", i);
    rig.append(light);
  }
  root.append(rig);
  const stage = document.createElement("div");
  stage.className = "ceremony-stage";
  root.append(stage);
  const byId = new Map(people.map((p) => [p.id, p])),
    actors = [],
    used = new Set(),
    start = performance.now();
  const definitions = [
    [
      "champion",
      "LE ROI DU BUFFET",
      results.champions,
      results.teamSize > 1 && results.champions.length
        ? `Équipe ${results.teamId + 1}`
        : "",
    ],
    [
      "predator",
      "L’ESTOMAC SANS FOND",
      results.predators.length ? [results.predators[0]] : [],
      results.predatorKills
        ? `${results.predatorKills} gourmand${results.predatorKills > 1 ? "s" : ""} dévoré${results.predatorKills > 1 ? "s" : ""}${
            results.predators.length > 1
              ? " · Ex æquo : " +
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
      "Premier gourmand éliminé" +
        (results.firstTies?.length > 1
          ? " · Éliminations simultanées, ordre du serveur"
          : ""),
    ],
  ];
  for (const [index, [kind, title, ids, note]] of definitions.entries()) {
    const card = document.createElement("article");
    card.className = "podium-course podium-course--" + kind;
    card.dataset.members=ids.length;
    card.style.setProperty(
      "--reveal",
      index === 0 ? ".7s" : index === 1 ? "1.05s" : "1.4s",
    );
    const platform = document.createElement("div");
    platform.className = "podium-stage";
    for (const id of ids) {
      const person = byId.get(id);
      if (!person) continue;
      const figure = document.createElement("figure"),
        button = document.createElement("button"),
        canvas = document.createElement("canvas"),
        name = document.createElement("figcaption");
      button.type = "button";
      button.className = "ceremony-person";
      button.setAttribute(
        "aria-label",
        "Rejouer l’animation de " + person.name,
      );
      canvas.width = 280;
      canvas.height = 350;
      canvas.setAttribute("aria-hidden", "true");
      name.textContent = person.name;
      if (results.teamSize > 1) {
        name.style.backgroundColor = teamSurface(person.teamId);
        name.style.color = "#fff8e8";
      }
      const actor = {
        person,
        canvas,
        kind,
        enabled: !used.has(id),
        celebrateAt:
          start +
          (kind === "champion" ? 900 : kind === "predator" ? 1200 : 1500),
      };
      used.add(id);
      actors.push(actor);
      canvas.dataset.actor = id;
      canvas.dataset.animation = actor.enabled ? "celebration" : "idle";
      button.onclick = () => {
        for (const other of actors)
          if (other.person.id === id) {
            other.enabled = false;
            other.canvas.dataset.animation = "idle";
          }
        actor.enabled = true;
        actor.canvas.dataset.animation = "celebration";
        actor.celebrateAt = performance.now();
        figure.classList.remove("replay");
        void figure.offsetWidth;
        figure.classList.add("replay");
      };
      button.append(canvas);
      figure.append(button, name);
      if (kind === "first") {
        const buns = document.createElement("span");
        buns.className = "ceremony-buns";
        buns.setAttribute("aria-hidden", "true");
        buns.append(document.createElement("i"), document.createElement("i"));
        figure.append(buns);
      }
      platform.append(figure);
    }
    if (!ids.length) {
      const empty = document.createElement("p");
      empty.className = "ceremony-empty";
      empty.textContent =
        kind === "champion"
          ? "Égalité : le buffet reste sans roi."
          : kind === "first"
            ? "Personne n’a été éliminé."
            : "Un festin sans dévoration.";
      platform.append(empty);
    }
    const plinth = document.createElement("div");
    plinth.className = "ceremony-plinth";
    const heading = document.createElement("h3");
    heading.textContent = title;
    const caption = document.createElement("p");
    caption.textContent = note;
    plinth.append(heading, caption);
    card.append(platform, plinth);
    stage.append(card);
  }
  const confetti = document.createElement("div");
  confetti.className = "ceremony-confetti";
  confetti.setAttribute("aria-hidden", "true");
  if (results.champions.length)
    for (let i = 0; i < 12; i++) {
      const piece = document.createElement("i");
      piece.style.setProperty("--n", i);
      confetti.append(piece);
    }
  root.append(confetti);
  const finish = () => {
    root.dataset.intro = "done";
    skip.hidden = true;
  };
  skip.onclick = () => {
    finish();
    for (const actor of actors) actor.celebrateAt = performance.now();
  };
  const draw = (time) => {
    if (!scene) return;
    if (time - scene.lastFrame >= 33) {
      scene.lastFrame = time;
      for (const actor of actors)
        renderAvatar(
          actor.canvas,
          actor.person,
          cosmeticMotion() === "full" ? poseAt(actor, time) : null,
        );
    }
    if (cosmeticMotion() === "full") scene.raf = requestAnimationFrame(draw);
  };
  scene = {
    actors,
    lastFrame: -Infinity,
    raf: 0,
    redraw: () => {
      for (const actor of actors)
        renderAvatar(
          actor.canvas,
          actor.person,
          cosmeticMotion() === "full" ? poseAt(actor, performance.now()) : null,
        );
    },
    timer: setTimeout(finish, 2900),
  };
  document.addEventListener("extra-cosmetics-loaded", scene.redraw);
  scene.redraw();
  scene.raf = requestAnimationFrame(draw);
}
