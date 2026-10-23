// One menu jingle per page load. Browsers may require a first user gesture.
export function isPlayerMeal(event, actor, victim) {
  return (
    (["food", "fondue", "shelf"].includes(event) && actor?.id === 0) ||
    (event === "power" &&
      actor?.id === 0 &&
      ["armored", "inferno"].includes(victim?.kind)) ||
    (event === "eat" && (actor?.id === 0 || victim?.id === 0))
  );
}

export function createGameAudio({
  isMenuVisible,
  isShadowMenu = () => false,
  AudioClass = Audio,
  target = document,
}) {
  const jingle = new AudioClass(
    new URL("./assets/jingle.m4a", import.meta.url).href,
  );
  const mealURL = new URL("./assets/bruitage-gourmand.m4a", import.meta.url)
    .href;
  const meals = new Set();
  // A quiet shared budget prevents stacked mouthfuls from producing a loud burst.
  const mealVolume = 0.06;
  const balanceMeals = () => {
    for (const sound of meals) sound.volume = mealVolume / meals.size;
  };
  let muted = false;
  let played = false;
  let pending = false;
  jingle.loop = false;
  jingle.preload = "auto";
  jingle.volume = 0.35;

  async function startJingle() {
    if (muted || played || pending || !isMenuVisible() || isShadowMenu())
      return;
    pending = true;
    try {
      await jingle.play();
      played = true;
      target.removeEventListener("pointerdown", startJingle, true);
      target.removeEventListener("keydown", startJingle, true);
    } catch (error) {
      // Keep the gesture retry only for browser autoplay restrictions.
      if (error.name !== "NotAllowedError" && error.name !== "AbortError") {
        console.warn("Le jingle n’a pas pu être lu.", error);
      }
    } finally {
      pending = false;
    }
  }
  let shadowJingle,
    shadowWanted = false,
    shadowPending = false,
    shadowActive = isShadowMenu();
  async function startShadowJingle() {
    if (
      !shadowWanted ||
      shadowPending ||
      muted ||
      !isMenuVisible() ||
      !isShadowMenu()
    )
      return;
    shadowJingle ||= new AudioClass(
      new URL("./assets/secrets/jingle.m4a", import.meta.url).href,
    );
    shadowJingle.loop = false;
    shadowJingle.volume = 0.22;
    shadowPending = true;
    try {
      await shadowJingle.play();
      shadowWanted = false;
    } catch (error) {
      if (error.name !== "NotAllowedError" && error.name !== "AbortError") {
        shadowWanted = false;
        console.warn("Le jingle de la Face Cachée n’a pas pu être lu.", error);
      }
    } finally {
      shadowPending = false;
    }
  }
  target.addEventListener("pointerdown", startShadowJingle, true);
  target.addEventListener("keydown", startShadowJingle, true);
  target.addEventListener("shadowchange", () => {
    const active = isShadowMenu();
    if (active === shadowActive) return;
    shadowActive = active;
    shadowWanted = active;
    if (shadowJingle) {
      shadowJingle.pause();
      shadowJingle.currentTime = 0;
    }
    if (shadowWanted) {
      jingle.pause();
      startShadowJingle();
    }
  });
  target.addEventListener("pointerdown", startJingle, true);
  target.addEventListener("keydown", startJingle, true);
  startJingle();

  return {
    event(event, actor, victim) {
      if (muted || !isPlayerMeal(event, actor, victim)) return;
      // Separate voices preserve rapid, distinct mouthfuls without restarting a sound.
      const sound = new AudioClass(mealURL);
      sound.loop = false;
      meals.add(sound);
      balanceMeals();
      const release = () => {
        meals.delete(sound);
        balanceMeals();
      };
      sound.addEventListener("ended", release, { once: true });
      sound.addEventListener("error", release, { once: true });
      sound.play().catch(release);
    },
    setMuted(value) {
      muted = value;
      if (muted) {
        jingle.pause();
        shadowJingle?.pause();
        for (const sound of meals) sound.pause();
        meals.clear();
      } else {
        startJingle();
        startShadowJingle();
      }
    },
  };
}
