import { modeUnlocked } from "./restaurant-menu.js?v=wardrobe-41";
export function setupRestaurantHome({ profile, journey, choose }) {
  const $ = (s) => document.querySelector(s),
    solo = $("#solo-menu"),
    pages = $("#solo-menu-pages");
  const trigger = (el) =>
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  const openStyle = () => {
    const button = $("[data-open-shop]");
    trigger(button);
  };
  $("#gourmand-entry").onclick = () =>
    journey.secret ? trigger($("#trophies-entry")) : openStyle();
  const normal = [
    ["classic", "Classique", 8, "Le premier service"],
    ["gros", "Grand Banquet", 24, "La grande tablée"],
    ["usa", "États-Unis", 50, "Le festin démesuré"],
  ];
  const hidden = [
    ["somalia", "Somalie", 50, "La face cachée"],
    ["platform", "Filmovore", "16 ou 24", "La Plateforme · Hunger Games"],
    ["cannibal", "Le Festin cannibale", 16, "La face cachée"],
    ["icecream", "Le Marchand de glaces", 16, "La face cachée"],
  ];
  $("#solo-entry").onclick = () => {
    pages.replaceChildren();
    for (const [mode, name, count, sub] of journey.secret ? hidden : normal) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "home-mode-page";
      b.dataset.soloMode = mode;
      const k = document.createElement("small"),
        h = document.createElement("strong"),
        p = document.createElement("span");
      k.textContent = sub;
      h.textContent = name;
      p.textContent = `${count} gourmands`;
      b.append(k, h, p);
      const locked = !modeUnlocked(mode, profile);
      b.disabled = locked;
      if (locked) {
        const note = document.createElement("em");
        note.textContent =
          mode === "gros"
            ? "Gagne une partie en Classique"
            : "Gagne une partie au Grand Banquet";
        b.append(note);
      }
      b.onclick = () => {
        solo.close();
        choose(mode);
      };
      pages.append(b);
    }
    solo.showModal();
  };
  $("[data-close-solo]").onclick = () => solo.close();
  for (const button of document.querySelectorAll("[data-gourmand-page]"))
    button.onclick = () => {
      const current = button.closest("dialog"),
        target = button.dataset.gourmandPage;
      if (target === "look" && journey.secret) return;
      current.close();
      if (target === "look") openStyle();
      else trigger($("#trophies-entry"));
      const next =
        target === "look" ? $("#shop-dialog") : $("#trophies-dialog");
      next.classList.remove("turning-menu-page");
      void next.offsetWidth;
      next.classList.add("turning-menu-page");
    };
  const update = () => {
    for (const b of document.querySelectorAll('[data-gourmand-page="look"]'))
      b.hidden = journey.secret;
  };
  document.addEventListener("shadowchange", update);
  update();
}
