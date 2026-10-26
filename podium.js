import { cosmeticMotion } from "./cosmetic-effects.js?v=quiet-46";
import { teamSurface } from "./teams.js?v=rivalries-33";
let scene = null;
export function podiumActive() {
  return !!scene;
}
export function clearPodium() {
  if (scene) {
    cancelAnimationFrame(scene.raf);
    scene.webgl?.dispose();
    clearTimeout(scene.timer);
    document.removeEventListener("extra-cosmetics-loaded", scene.redraw);
    document.removeEventListener("gourmand-presentation-loaded", scene.redraw);
    scene = null;
  }
  const root = document.querySelector("#match-podium");
  root?.replaceChildren();
  if (root) root.hidden = true;
  document.body.classList.remove("ceremony-open");
}
export function poseAt(actor, time) {
  const phase = time * 0.001,
    id = actor.person.id,
    age = (time - actor.celebrateAt) / 1000;
  const pose = {
    time,
    breath: Math.sin(phase * 2.5 + id),
    headBob: Math.sin(phase * 2.5 + id) * 0.012,
    headTurn: Math.sin(phase * 0.6 + id) * 0.025,
    look: Math.sin(phase * 0.9 + id) * 0.025,
    blink: 0,
    armL: Math.sin(phase * 1.5 + id) * 0.04,
    armR: Math.sin(phase * 1.5 + id + 0.7) * 0.04,
    legL: 0,
    legR: 0,
    jump: 0,
    mouth: 0,
    expression: 0,
    belly: 0,
    twist: 0,
    headPitch: 0,
    burp: 0,
  };
  const selected = actor.person.cosmetics?.podium;
  pose.animation =
    selected && selected !== "podium_none"
      ? selected
      : {
          champion: "podium_champion",
          predator: "podium_belly",
          first: "podium_despair",
        }[actor.kind];
  if (!actor.enabled || age < 0 || age > 3.8) return pose;
  const weight = Math.min(1, age / 0.25, (3.8 - age) / 0.4),
    beat = Math.sin(age * 10);
  if (pose.animation === "podium_champion") {
    pose.armL = (2.3 + beat * 0.25) * weight;
    pose.armR = (-2.5 + beat * 0.3) * weight;
    pose.headTurn = beat * 0.07 * weight;
    pose.expression = 3;
    pose.legL = beat * 0.14 * weight;
    pose.legR = -pose.legL;
    pose.twist = Math.sin(age * 5) * 0.09 * weight;
  }
  if (pose.animation === "podium_belly") {
    pose.armL = (2.1 + beat * 0.2) * weight;
    pose.armR = (-2.1 + beat * 0.2) * weight;
    pose.belly = (0.15 + beat * 0.13) * weight;
    pose.twist = beat * 0.12 * weight;
    pose.headTurn = -beat * 0.12 * weight;
    pose.legL = beat * 0.14 * weight;
    pose.legR = -pose.legL;
    pose.expression = 4;
    pose.mouth = 0.6;
  }
  if (pose.animation === "podium_burp") {
    const inhale = Math.sin(Math.min(1, age / 0.9) * Math.PI * 0.5);
    pose.belly =
      (age < 0.9 ? 0.2 * inhale : 0.05 * Math.sin(age * 12)) * weight;
    pose.armL = (-0.8 - inhale * 0.25) * weight;
    pose.armR = (0.8 + inhale * 0.25) * weight;
    pose.headPitch = (age < 0.9 ? -0.16 : 0.12) * weight;
    pose.expression = age < 0.2 ? 0 : age < 0.9 ? 1 : age < 2.15 ? 2 : 3;
    pose.burp = age >= 0.9 && age < 2.2 ? (age - 0.9) / 1.3 : 0;
    pose.mouth = age >= 0.9 && age < 2.15 ? 1 : 0;
  }
  if (pose.animation === "podium_jump") {
    pose.armL = 2.4 * weight;
    pose.armR = -2.4 * weight;
    pose.legL = Math.sin(age * 7) * 0.45 * weight;
    pose.legR = -pose.legL;
    pose.jump = Math.max(0, Math.sin(age * 6)) * 32 * weight;
    pose.expression = age < 2.6 ? 4 : 3;
    pose.mouth = 0.9;
  }
  if (pose.animation === "podium_despair") {
    pose.armL = -1.4 * weight;
    pose.armR = 0.9 * weight;
    pose.headBob = 0.18 * weight;
    pose.headTurn = (0.16 + Math.sin(age * 25) * 0.06) * weight;
    pose.coverFace = age > 0.8 && age < 2.5;
    pose.expression = age < 1.5 ? 6 : 8 - 1;
    pose.sad = true;
    pose.legL = -0.12 * weight;
    pose.legR = 0.1 * weight;
    pose.twist = Math.sin(age * 24) * 0.025 * weight;
  }
  return pose;
}
export function showPodium(results, people, renderAvatar) {
  clearPodium();
  const root = document.querySelector("#match-podium");
  if (!root || !results) return;
  root.hidden = false;
  root.dataset.renderer = "canvas";
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
  skip.hidden = cosmeticMotion()!=="full";
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
    card.dataset.members = ids.length;
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
        actor.celebrateAt = scene?.visualTime ?? performance.now();
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
  let skippedByUser = false;
  const finish = () => {
    root.dataset.intro = "done";
    skip.hidden = true;
  };
  skip.onclick = () => {
    skippedByUser = true;
    finish();
    for (const actor of actors) actor.celebrateAt = scene?.visualTime ?? performance.now();
  };
  const draw = (time) => {
    if (!scene) return;
    if (time - scene.lastFrame >= 33) {
      const delta=scene.lastFrame===-Infinity?0:Math.min(80,Math.max(0,time-scene.lastFrame));
      scene.lastFrame = time;
      scene.visualTime+=delta;
      const visualTime=scene.visualTime;
      if(root.dataset.intro==='playing'&&visualTime>=scene.finishAt)finish();
      if (!scene.webgl)
        for (const actor of actors) {
          const pose = poseAt(actor, visualTime);
          if (pose.burp > 0.015 && actor.burpCycle !== actor.celebrateAt) {
            actor.burpCycle = actor.celebrateAt;
            document.dispatchEvent(new Event("podium-burp"));
          }
        }
      if (scene.webgl?.disposed) scene.webgl = null;
      if (scene.webgl)
        scene.webgl.frame(visualTime, poseAt, cosmeticMotion() === "full");
      else
        for (const actor of actors)
          renderAvatar(
            actor.canvas,
            actor.person,
            cosmeticMotion() === "full" ? poseAt(actor, visualTime) : null,
          );
    }
    if (cosmeticMotion() === "full") scene.raf = requestAnimationFrame(draw);
  };
  scene = {
    actors,
    lastFrame: -Infinity,
    visualTime:start,
    finishAt:start+3800,
    raf: 0,
    redraw: () => {
      for (const actor of actors)
        renderAvatar(
          actor.canvas,
          actor.person,
          cosmeticMotion() === "full" ? poseAt(actor, scene?.visualTime ?? performance.now()) : null,
        );
    },
    timer: 0,
  };
  document.addEventListener("extra-cosmetics-loaded", scene.redraw);
  document.addEventListener("gourmand-presentation-loaded", scene.redraw);
  scene.redraw();
  scene.raf = requestAnimationFrame(draw);
  const owner = scene;
  import("./podium-3d.js?v=quiet-46")
    .then(({ createCeremony3D }) => {
      if (scene !== owner) return null;
      return createCeremony3D(
        root,
        actors,
        renderAvatar,
        () => scene === owner,
      );
    })
    .then((webgl) => {
      if (!webgl) return;
      if (scene !== owner) {
        webgl.dispose();
        return;
      }
      owner.webgl = webgl;
      webgl.frame(performance.now(), poseAt, false);
      // The first shader compilation must finish before timing the visible intro.
      if (!skippedByUser && cosmeticMotion() === "full") {
        root.dataset.intro = "playing";
        skip.hidden = false;
        const readyAt = performance.now();
        webgl.restart(readyAt);
        for (const actor of actors)
          actor.celebrateAt =
            readyAt +
            (actor.kind === "champion"
              ? 2600
              : actor.kind === "predator"
                ? 2900
                : 3200);
        clearTimeout(owner.timer);
        owner.visualTime=readyAt;owner.lastFrame=performance.now();owner.finishAt=readyAt+3800;
      }
    })
    .catch(() => {
      root.dataset.renderer = "canvas";
    });
}
