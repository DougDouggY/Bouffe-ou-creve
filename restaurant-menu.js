import { mapGroups } from "./map-catalog.js?v=filmovore-15";
import { mapArtURL } from "./map-art.js?v=filmovore-15";
export function modeUnlocked(mode, profile) {
  return (
    !["gros", "usa"].includes(mode) ||
    (mode === "gros"
      ? profile.modeWins?.classic > 0
      : profile.modeWins?.gros > 0)
  );
}
export function createRestaurantMenu(catalog, onSelect) {
  const root = document.querySelector("#map-gallery");
  root.replaceChildren();
  root.classList.add("restaurant-books");
  const search = document.querySelector("#map-search");
  let mode = "classic",
    category = null,
    selected = "cantine";
  const groups = mapGroups(catalog),
    books = [];
  groups[0].maps.push(
    ...Object.entries(catalog).filter(([id]) =>
      ["platform", "cannibal", "icecream", "survival"].includes(id),
    ),
  );
  const back = document.createElement("button");
  back.id = "book-back";
  back.textContent = "← Les deux cartes";
  back.hidden = true;
  root.before(back);
  for (const group of groups) {
    const book = document.createElement("section");
    book.className = "restaurant-book";
    book.dataset.group = group.id;
    book.id = group.id === "available" ? "maps-available" : "maps-in-progress";
    const cover = document.createElement("button");
    cover.className = "book-cover";
    cover.innerHTML = `<span>BOUFFE OU CRÈVE</span><strong>${group.id === "available" ? "La carte de la maison" : "Le carnet des essais"}</strong><small>${group.id === "available" ? "LES CARTES VALIDÉES" : "LES CARTES EN TRAVAUX"}</small><i>Ouvrir la carte →</i>`;
    book.append(cover);
    const inside = document.createElement("div");
    inside.className = "book-inside";
    inside.hidden = true;
    const index = document.createElement("nav");
    index.className = "book-index";
    index.setAttribute("aria-label", "Liste des arènes");
    for (const [id, map] of group.maps) {
      const button = document.createElement("button");
      button.className = "map-card";
      button.dataset.map = id;
      button.textContent = map.name;
      button.onclick = () => select(id);
      index.append(button);
    }
    const page = document.createElement("article");
    page.className = "restaurant-page";
    page.innerHTML =
      '<p class="page-kicker">LE FESTIN DU JOUR</p><h3></h3><figure></figure><div class="page-turner"><button type="button" data-page="prev" aria-label="Page précédente">←</button><span></span><button type="button" data-page="next" aria-label="Page suivante">→</button></div>';
    inside.append(index, page);
    book.append(inside);
    root.append(book);
    books.push({ group, book, cover, inside, index, page });
    cover.onclick = () => open(group.id);
    for (const direction of ["prev", "next"])
      page.querySelector(`[data-page="${direction}"]`).onclick = () => {
        const entries = visibleEntries(group),
          at = entries.findIndex(([id]) => id === selected),
          next = Math.max(
            0,
            Math.min(entries.length - 1, at + (direction === "next" ? 1 : -1)),
          );
        if (entries[next]) {
          page.classList.remove("turning");
          void page.offsetWidth;
          page.classList.add("turning");
          select(entries[next][0]);
        }
      };
  }
  function visibleEntries(group) {
    return group.maps.filter(
      ([id, map]) =>
        (mode === "platform"
          ? ["platform", "survival"].includes(id)
          : ["cannibal", "icecream", "survival"].includes(mode)
            ? id === mode
            : mode === "somalia"
              ? id === "savanna"
              : !["platform", "cannibal", "icecream", "survival"].includes(
                  id,
                ) &&
                (mode === "chef" || id !== "savanna")) &&
        map.name
          .toLocaleLowerCase("fr")
          .includes(search.value.toLocaleLowerCase("fr")),
    );
  }
  function select(id) {
    selected = id;
    onSelect(id);
    render();
  }
  function open(id) {
    category = id;
    back.hidden = false;
    root.classList.add("book-chosen");
    for (const item of books) {
      const chosen = item.group.id === id;
      item.book.classList.toggle("discarded", !chosen);
      item.book.classList.toggle("opened", chosen);
      item.cover.hidden = chosen;
      item.inside.hidden = !chosen;
    }
    const group = groups.find((g) => g.id === id),
      entries = visibleEntries(group);
    if (!entries.some(([id]) => id === selected) && entries[0])
      selected = entries[0][0];
    onSelect(selected);
    render();
  }
  function render() {
    for (const item of books) {
      const entries = visibleEntries(item.group);
      item.book.hidden = !entries.length;
      for (const button of item.index.children) {
        button.hidden = !entries.some(([id]) => id === button.dataset.map);
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.map === selected),
        );
      }
      if (category !== item.group.id || !entries.length) continue;
      if (!entries.some(([id]) => id === selected)) {
        selected = entries[0][0];
        onSelect(selected);
      }
      const map = catalog[selected],
        at = entries.findIndex(([id]) => id === selected);
      item.page.querySelector("h3").textContent = map.name;
      item.page.querySelector(".page-kicker").textContent =
        selected === "platform"
          ? "FILMOVORE · 16 GOURMANDS · DUELS À 2"
          : selected === "survival"
            ? "FILMOVORE · 24 GOURMANDS"
            : selected === "icecream" || selected === "cannibal"
              ? "16 GOURMANDS"
              : "LE FESTIN DU JOUR";
      const figure = item.page.querySelector("figure");
      figure.replaceChildren();
      const url = `./assets/previews/${selected}.webp?v=hunger-18`;
      const img = new Image();
      img.className = "map-preview";
      img.alt = `Aperçu de ${map.name}`;
      img.src = url;
      img.onerror = () => {
        img.remove();
        figure.textContent = "La table est dressée";
      };
      figure.append(img);
      item.page.querySelector(".page-turner span").textContent =
        `${at + 1} / ${entries.length}`;
      item.page.querySelector('[data-page="prev"]').disabled = at === 0;
      item.page.querySelector('[data-page="next"]').disabled =
        at === entries.length - 1;
    }
    document.querySelector("#start-game").hidden = !category;
    document.querySelector(".gallery-heading").hidden = !category;
    document.querySelector("#menu-map-description").hidden = true;
  }
  function reset() {
    category = null;
    back.hidden = true;
    root.classList.remove("book-chosen");
    for (const item of books) {
      item.book.classList.remove("opened", "discarded");
      item.cover.hidden = false;
      item.inside.hidden = true;
    }
    render();
  }
  back.onclick = reset;
  search.oninput = render;
  return {
    show(nextMode, id) {
      mode = nextMode;
      selected = id;
      search.value = "";
      reset();
    },
    refresh: render,
  };
}
export function setupSecretBurger({ profile, choose, backToMenu }) {
  let secret = false;
  const slots = ["somalia", "classic", "gros"].map((id) =>
    document.querySelector(`[data-menu-mode="${id}"]`),
  );
  slots.push(document.querySelector("#menu-shop"));
  const shopClick = slots[3].onclick;
  const subtitle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text",
  );
  const steakText = slots[3].querySelector("text");
  subtitle.setAttribute("class", "ingredient-subtitle");
  subtitle.setAttribute("text-anchor", "middle");
  subtitle.setAttribute("x", steakText.getAttribute("x"));
  subtitle.setAttribute("y", String(Number(steakText.getAttribute("y")) + 28));
  slots[3].append(subtitle);
  const notice = document.createElement("p");
  notice.id = "mode-unlock-note";
  notice.setAttribute("role", "status");
  document.querySelector("#title-screen").append(notice);
  function refresh() {
    const modes = secret
      ? ["somalia", "platform", "cannibal", "icecream"]
      : ["usa", "classic", "gros", "shop"];
    const titles = secret
      ? ["SOMALIE", "FILMOVORE", "LE FESTIN CANNIBALE", "LE MARCHAND DE GLACES"]
      : ["ÉTATS-UNIS", "CLASSIQUE", "GRAND BANQUET", "LE DRESSING DU GLOUTON"];
    const counts = secret
      ? ["50 gourmands", "16 ou 24 gourmands", "16 gourmands", "16 gourmands"]
      : ["50 gourmands", "8 gourmands", "24 gourmands", "DU GLOUTON"];
    subtitle.style.display = secret ? "" : "none";
    slots.forEach((slot, i) => {
      slot.querySelector("text:not(.ingredient-subtitle)").textContent =
        titles[i];
      if (slot.querySelector(".ingredient-subtitle"))
        slot.querySelector(".ingredient-subtitle").textContent = counts[i];
      slot.setAttribute("aria-label", titles[i] + " · " + counts[i]);
      slot.dataset.actualMode = modes[i];
      slot.setAttribute(
        "aria-disabled",
        String(modes[i] === "work" || !modeUnlocked(modes[i], profile)),
      );
    });
    document.body.classList.toggle("shadow-realm", secret);
    document.dispatchEvent(
      new CustomEvent("shadowchange", { detail: { secret } }),
    );
    document.querySelector("#trophies-entry .ingredient-subtitle").textContent =
      secret ? "DE LA FACE CACHÉE" : "DU GOURMAND";
    document
      .querySelector("#trophies-entry")
      .setAttribute(
        "aria-label",
        secret ? "Trophées de La Face Cachée" : "Les Trophées du Gourmand",
      );
    document.querySelector("#return-classic").hidden = !secret;
    document.querySelector("#shadow-entry").hidden = secret;
  }
  for (const slot of slots)
    slot.onclick = () => {
      const mode = slot.dataset.actualMode;
      if (mode === "shop") {
        shopClick?.call(slot);
        return;
      }
      if (mode === "work") {
        notice.textContent = "Cette face du burger est encore en travaux.";
        return;
      }
      if (!modeUnlocked(mode, profile)) {
        notice.textContent =
          mode === "gros"
            ? "Gagne une partie en Classique pour ouvrir le Grand Banquet."
            : "Gagne une partie au Grand Banquet pour ouvrir les États-Unis.";
        return;
      }
      notice.textContent = "";
      choose(mode);
    };
  const dialog = document.querySelector("#shadow-dialog"),
    form = document.querySelector("#shadow-form"),
    message = document.querySelector("#shadow-message");
  document.querySelector("#shadow-entry").onclick = () => {
    document.querySelector("#options-dialog").close();
    form.hidden = false;
    message.hidden = true;
    form.reset();
    document.querySelector("#shadow-error").textContent = "";
    dialog.showModal();
    document.querySelector("#shadow-password").focus();
  };
  document.querySelector("#close-shadow").onclick = () => dialog.close();
  form.onsubmit = (event) => {
    event.preventDefault();
    if (
      document
        .querySelector("#shadow-password")
        .value.trim()
        .toLocaleLowerCase("fr") !== "pologne"
    ) {
      document.querySelector("#shadow-error").textContent =
        "Ce mot de passe n’ouvre pas cette face du burger.";
      return;
    }
    form.hidden = true;
    message.hidden = false;
    document.querySelector("#enter-shadow").focus();
  };
  document.querySelector("#enter-shadow").onclick = () => {
    secret = true;
    dialog.close();
    backToMenu();
    refresh();
    notice.textContent = "";
  };
  document.querySelector("#return-classic").onclick = () => {
    secret = false;
    document.querySelector("#options-dialog").close();
    backToMenu();
    refresh();
    notice.textContent = "";
  };
  refresh();
  return {
    refresh,
    get secret() {
      return secret;
    },
  };
}
