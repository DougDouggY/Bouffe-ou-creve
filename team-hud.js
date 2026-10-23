import { teamColor, teamSurface } from "./teams.js?v=rivalries-33";
const weight = (value) =>
  `${Number(value.toFixed(1)).toLocaleString("fr-FR")} kg`;
export function createTeamHud(getGame) {
  const stats = [...document.querySelectorAll(".inspect-stat")];
  let last = 0;
  const close = (stat) => {
    stat.querySelector(".hud-breakdown").hidden = true;
    stat.setAttribute("aria-expanded", "false");
  };
  function render(stat) {
    const game = getGame();
    if (!game) return;
    const panel = stat.querySelector(".hud-breakdown");
    panel.replaceChildren();
    const all = game.onlineObserver ? game.people.slice(1) : game.people;
    const own = stat.dataset.inspect === "weight";
    const members = own
      ? all.filter((p) =>
          game.teamSize > 1
            ? p.teamId === game.people[0].teamId
            : p === game.people[0],
        )
      : all;
    const groups = new Map();
    for (const p of members) {
      const key = game.teamSize > 1 ? p.teamId : null;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    }
    for (const [team, people] of [...groups].sort(
      (a, b) => (a[0] ?? 0) - (b[0] ?? 0),
    )) {
      const heading = document.createElement("strong");
      heading.className = "hud-team-title";
      heading.textContent =
        team === null
          ? own
            ? "Ton gourmand"
            : "Les gourmands"
          : `${own ? "Ton équipe" : "Équipe"} ${team + 1} · ${people.filter((p) => p.alive).length}/${people.length}`;
      panel.append(heading);
      for (const person of people) {
        const row = document.createElement("div");
        row.className = "hud-team-member";
        row.dataset.alive = String(person.alive);
        if (team !== null) {
          row.dataset.team = team;
          row.style.backgroundColor = teamSurface(team);
          row.style.borderColor = teamColor(team);
        }
        const name = document.createElement("span"),
          mass = document.createElement("b");
        name.textContent = person.name + (person.alive ? "" : " · éliminé");
        mass.textContent = weight(person.mass);
        row.append(name, mass);
        panel.append(row);
      }
    }
  }
  for (const stat of stats) {
    let timer;
    const open = () => {
      clearTimeout(timer);
      stat.querySelector(".hud-breakdown").hidden = false;
      stat.setAttribute("aria-expanded", "true");
      render(stat);
    };
    stat.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "touch") open();
    });
    stat.addEventListener("pointerleave", () => {
      timer = setTimeout(() => {
        if (!stat.contains(document.activeElement)) close(stat);
      }, 160);
    });
    stat.addEventListener("focusin", open);
    stat.addEventListener("focusout", (e) => {
      if (!stat.contains(e.relatedTarget)) close(stat);
    });
    stat.addEventListener("click", open);
    stat.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        close(stat);
        e.stopPropagation();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
    const panel = stat.querySelector(".hud-breakdown");
    panel.addEventListener("pointerenter", () => clearTimeout(timer));
    panel.addEventListener("pointerleave", () => {
      timer = setTimeout(() => close(stat), 160);
    });
  }
  document.addEventListener("pointerdown", (e) => {
    for (const stat of stats) if (!stat.contains(e.target)) close(stat);
  });
  return {
    update() {
      const now = performance.now();
      if (now - last < 100) return;
      last = now;
      for (const stat of stats)
        if (!stat.querySelector(".hud-breakdown").hidden) render(stat);
    },
    close() {
      stats.forEach(close);
    },
  };
}
export function deathNotice(event, people, teamSize) {
  const row = document.createElement("li");
  row.dataset.human = String(event.human);
  const victimTeam = event.teamId ?? people[event.person]?.teamId;
  function tag(name, team) {
    const span = document.createElement("span");
    span.className = "death-name";
    span.textContent = name;
    if (teamSize > 1 && Number.isInteger(team)) {
      span.dataset.team = team;
      span.style.backgroundColor = teamSurface(team);
      span.style.borderColor = teamColor(team);
    }
    return span;
  }
  row.append(tag(event.name, victimTeam));
  if (event.eliminatedBy)
    row.append(
      document.createTextNode(" a été dévoré par "),
      tag(
        event.eliminatedBy.name,
        event.eliminatedBy.teamId ?? people[event.eliminatedBy.id]?.teamId,
      ),
      document.createTextNode("."),
    );
  else row.append(document.createTextNode(" a été éliminé."));
  if (teamSize > 1 && Number.isInteger(victimTeam)) {
    row.dataset.team = victimTeam;
    row.style.backgroundColor = teamSurface(victimTeam);
    row.style.borderColor = teamColor(victimTeam);
    row.style.color = "#fff8e8";
  }
  return row;
}
