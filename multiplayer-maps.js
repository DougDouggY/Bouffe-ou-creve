import { CA } from "./simulation-core.js?v=podium-35";
import { mapGroups } from "./map-catalog.js?v=teams-31";
export const MULTIPLAYER_MAPS = [
  ...mapGroups(CA)[0].maps,
  ...mapGroups(CA)[1].maps.filter(([id]) => id === "trampoline"),
]
  .filter(([id]) => id !== "savanna")
  .map(([id, map]) => ({
    id,
    name: map.name + (id === "trampoline" ? " · En travaux" : ""),
  }));
export const validMultiplayerMap = (id) =>
  MULTIPLAYER_MAPS.some((map) => map.id === id);
