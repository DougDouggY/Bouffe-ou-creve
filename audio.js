// One menu jingle per page load. Browsers may require a first user gesture.
export function isPlayerMeal(event, actor, victim) {
  return (
    (["food", "fondue", "shelf"].includes(event) && actor?.id === 0) ||
    (event === "eat" && (actor?.id === 0 || victim?.id === 0))
  );
}

export function createGameAudio({
  isMenuVisible,
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
    if (muted || played || pending || !isMenuVisible()) return;
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
        for (const sound of meals) sound.pause();
        meals.clear();
      } else {
        startJingle();
      }
    },
  };
}
