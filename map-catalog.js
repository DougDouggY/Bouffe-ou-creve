// Rendering's historical `experimental` flag is independent of playtest approval.
export const REMOVED_MAPS = new Set([
  "sushi",
  "cinema",
  "gym",
  "space",
  "candy",
  "train",
  "haunted",
  "beach",
]);

export const WORK_IN_PROGRESS_MAPS = new Set([
  "parking",
  "station",
  "rooftop",
  "underwater",
  "wok",
  "fair",
  "crepe",
  "picnic",
  "garden",
  "palace",
  "works",
  "mirror",
]);

export function mapGroups(catalog) {
  const entries = Object.entries(catalog).filter(
    ([id]) => !REMOVED_MAPS.has(id),
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
