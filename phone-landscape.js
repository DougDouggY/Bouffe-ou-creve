// Orientation is a presentation preference. Never rotate authoritative coordinates.
const panel = document.querySelector("#phone-rotate");
let portraitAllowed = false,
  playing = false,
  ownsFullscreen = false;
function update() {
  const now = document.body.classList.contains("playing");
  if (now !== playing) {
    portraitAllowed = false;
    playing = now;
    if (!now) {
      try {
        screen.orientation?.unlock?.();
      } catch {}
      if (
        ownsFullscreen &&
        document.fullscreenElement === document.documentElement
      )
        document.exitFullscreen?.().catch(() => {});
      ownsFullscreen = false;
    }
  }
  panel.hidden = !(
    playing &&
    document.documentElement.dataset.display === "phone" &&
    innerHeight > innerWidth &&
    !portraitAllowed
  );
  document.body.classList.toggle("phone-awaiting-landscape", !panel.hidden);
}
async function landscape() {
  if (document.documentElement.dataset.display !== "phone") return;
  try {
    if (
      !document.fullscreenElement &&
      document.documentElement.requestFullscreen
    ) {
      await document.documentElement.requestFullscreen({
        navigationUI: "hide",
      });
      ownsFullscreen = true;
    }
  } catch {}
  try {
    await screen.orientation?.lock?.("landscape");
  } catch {}
  update();
}
document.querySelector("#phone-fullscreen").onclick = landscape;
document.querySelector("#phone-portrait").onclick = () => {
  portraitAllowed = true;
  update();
};
document.addEventListener(
  "click",
  (event) => {
    if (event.target.closest("#start-game,#multiplayer-start")) landscape();
  },
  true,
);
new MutationObserver(update).observe(document.body, {
  attributes: true,
  attributeFilter: ["class"],
});
new MutationObserver(update).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-display"],
});
window.addEventListener("resize", update);
window.addEventListener("orientationchange", update);
update();
