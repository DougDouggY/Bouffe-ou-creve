import {
  SECRET_TROPHIES,
  secretProfile,
  secretTrophyEvent,
} from "./secret-trophies.js?v=secret-42";
export function simulateSecretTrophy(id) {
  const trophy = SECRET_TROPHIES.find((t) => t.id === id);
  if (!trophy) throw Error("Trophée inconnu");
  const mode = trophy.mode,
    key = id.slice(`shadow-${mode}-`.length);
  const profile = { shadow: secretProfile() },
    actor = { id: 0, mass: 60 },
    rival = { id: 1, mass: 120, capturedChildren: 1 };
  const game = {
    mode,
    people: [actor, rival],
    mechanics: { clock: 1000 },
    outcome: "win",
  };
  const earned = [];
  const event = (name, p = actor, data) =>
    earned.push(...secretTrophyEvent(profile, name, p, data, game));
  const food = (count = 1, extra = {}) => {
    event("launch");
    for (let i = 0; i < count; i++)
      event("food", actor, {
        type:
          mode === "cannibal"
            ? "victim"
            : mode === "icecream"
              ? "child"
              : mode === "somalia"
                ? "mosquito"
                : "burger",
        ...extra,
      });
  };
  if (mode === "platform") {
    if (key === "first") food();
    else if (key === "1000") {
      actor.mass = 1000;
      event("mass");
    } else if (key === "2000") {
      actor.mass = 2000;
      event("end");
    } else if (key === "win" || key === "starve") event("end");
    else if (key === "fall") event("platformFall", actor, { combatTurn: 1 });
    else if (key === "escape") event("platformExit", actor, { turn: 3 });
    else
      event("platformDuel", actor, {
        won: true,
        playerFood: key === "leftovers" ? 1 : 0,
        opponentFood: 2,
        playerMass: 60,
        opponentMass: 120,
        pushedByPlayer: true,
        departure: key === "departure",
        bank: key === "bank",
      });
  } else if (mode === "cannibal") {
    if (key === "first") food();
    else if (key === "ten") food(10);
    else if (key === "hundred") {
      profile.shadow.totals.victims = 99;
      food();
    } else if (key === "five") food(5);
    else if (key === "clean") food(3);
    else if (key === "personal") {
      event("launch");
      event("eat", actor, rival);
      event("food", actor, { type: "victim" });
    } else if (key === "flee") food(1, { fleeing: true });
    else if (key === "fallen") food(1, { lastFallAt: 900 });
    else {
      if (key === "wins10") profile.shadow.wins.cannibal = 9;
      event("end");
    }
  } else if (mode === "icecream") {
    if (["first", "ten", "three", "five"].includes(key))
      food({ first: 1, ten: 10, three: 3, five: 5 }[key]);
    else if (key === "fifty") {
      profile.shadow.totals.children = 49;
      food();
    } else if (key === "rival") event("eat", actor, rival);
    else if (key === "eaten") event("eat", rival, actor);
    else if (key === "1000" || key === "2000") {
      actor.mass = Number(key);
      event("mass");
    } else {
      if (key === "wins10") profile.shadow.wins.icecream = 9;
      if (key === "wins25") profile.shadow.wins.icecream = 24;
      event("end");
    }
  } else {
    if (key === "first") food();
    else if (key === "ten") food(10);
    else if (key === "100") {
      actor.mass = 100;
      event("mass");
    } else {
      profile.shadow.wins.somalia = 9;
      event("end");
    }
  }
  return { profile, earned, selected: !!profile.shadow.trophies[id] };
}
export function setupSecretTrophyLab(renderMedal) {
  const dialog = document.querySelector("#trophy-lab"),
    select = document.querySelector("#trophy-lab-select"),
    result = document.querySelector("#trophy-lab-result");
  for (const trophy of SECRET_TROPHIES) {
    const option = document.createElement("option");
    option.value = trophy.id;
    option.textContent = trophy.name;
    select.append(option);
  }
  document.querySelector("#trophy-lab-open").onclick = () => {
    result.replaceChildren();
    dialog.showModal();
  };
  document.querySelector("#close-trophy-lab").onclick = () => dialog.close();
  document.querySelector("#trophy-lab-run").onclick = () => {
    const { earned, selected } = simulateSecretTrophy(select.value);
    const text = document.createElement("p");
    text.textContent = selected
      ? "Condition déclenchée dans la simulation. Aucune progression sauvegardée."
      : "Condition non déclenchée.";
    result.replaceChildren(
      text,
      ...earned.map((id) => {
        const trophy = SECRET_TROPHIES.find((t) => t.id === id),
          card = document.createElement("article");
        card.className = "trophy-card unlocked";
        card.append(renderMedal(trophy), document.createTextNode(trophy.name));
        return card;
      }),
    );
  };
}
