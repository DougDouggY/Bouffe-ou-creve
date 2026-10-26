import { CA } from "./simulation-core.js?v=showtime-45";
import { mapGroups } from "./map-catalog.js?v=collection-37";
export const MULTIPLAYER_MAPS = mapGroups(CA)[0]
  .maps.filter(([id]) => id !== "savanna")
  .map(([id, map]) => ({
    id,
    name: map.name,
  }));
export const validMultiplayerMap = (id) =>
  MULTIPLAYER_MAPS.some((map) => map.id === id);
