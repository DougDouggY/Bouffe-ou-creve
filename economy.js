export const MATCH_POINTS_CAP = 80;
export function eventPoints(event, food, mode = "classic") {
  const raw =
    event === "food"
      ? food?.type === "salad"
        ? 0
        : food?.size === "chef"
          ? 12
          : food?.size === "xl"
            ? 4
            : 2
      : event === "eat"
        ? 20
        : event === "fondue"
          ? 15
          : event === "win"
            ? mode === "somalia"
              ? 250
              : mode === "gros"
                ? 150
                : 100
            : event === "truce"
              ? mode === "somalia"
                ? 200
                : mode === "gros"
                  ? 120
                  : 80
              : 0;
  return Math.floor(raw / 2);
}
export function matchPoints(personal, win, mode) {
  return Math.min(
    MATCH_POINTS_CAP,
    Math.max(0, personal) + (win ? eventPoints("win", null, mode) : 0),
  );
}
