// Rendering's historical `experimental` flag is independent of playtest approval.
export const REMOVED_MAPS = new Set([
  "cuisine",
  "foodcourt",
  "sushi",
  "cinema",
  "gym",
  "space",
  "candy",
  "train",
  "haunted",
  "crepe",
  "parking",
]);

export const WORK_IN_PROGRESS_MAPS = new Set([
  "hunger",
  "station",
  "rooftop",
  "underwater",
  "wok",
  "picnic",
  "garden",
  "palace",
  "works",
  "mirror",
]);

export const SECRET_MAPS = new Set([
  "platform",
  "cannibal",
  "icecream",
  "survival",
]);
export function mapGroups(catalog) {
  const entries = Object.entries(catalog).filter(
    ([id]) => !REMOVED_MAPS.has(id) && !SECRET_MAPS.has(id),
  );
  return [
    {
      id: "available",
      label: "Cartes disponibles",
      maps: entries.filter(([id]) => !WORK_IN_PROGRESS_MAPS.has(id)),
    },
    {
      id: "in-progress",
      label: "En travaux · cartes de test",
      maps: entries.filter(([id]) => WORK_IN_PROGRESS_MAPS.has(id)),
    },
  ];
}
