import { CA } from "./simulation-core.js?v=multi-20";
import { mapGroups } from "./map-catalog.js?v=filmovore-15";
export const MULTIPLAYER_MAPS = mapGroups(CA)[0]
  .maps.filter(([id]) => id !== "savanna")
  .map(([id, map]) => ({
    id,
    name: map.name,
  }));
export const validMultiplayerMap = (id) =>
  MULTIPLAYER_MAPS.some((map) => map.id === id);
