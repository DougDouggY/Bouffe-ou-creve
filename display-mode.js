(() => {
  const key = "bouffe-display-v1";
  const root = document.documentElement;
  let saved;
  try {
    saved = localStorage.getItem(key);
  } catch {}
  let mode = ["desktop", "phone"].includes(saved)
    ? saved
    : matchMedia("(max-width: 650px), (pointer: coarse)").matches
      ? "phone"
      : "desktop";
  root.dataset.display = mode;
  document.addEventListener("DOMContentLoaded", () => {
    const radios = document.querySelectorAll('input[name="display-mode"]');
    const update = () => {
      root.dataset.display = mode;
      radios.forEach((input) => {
        input.checked = input.value === mode;
      });
      document.querySelector("#display-status").textContent =
        mode === "phone"
          ? "Téléphone : vue élargie, menus et commandes adaptés au toucher."
          : "Ordinateur : présentation classique, souris ou pavé tactile.";
    };
    radios.forEach((input) =>
      input.addEventListener("change", () => {
        if (!input.checked) return;
        mode = input.value;
        try {
          localStorage.setItem(key, mode);
        } catch {}
        update();
        window.dispatchEvent(new Event("resize"));
      }),
    );
    update();
  });
})();
