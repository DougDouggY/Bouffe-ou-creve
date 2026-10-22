export const SHELF_EATING_MASS = 350;
export const SHELF_MASS_GAIN = 15;

// Remove both representations together: drawing, AI planning and Matter collisions.
export function consumeShelves(game, person, { intersects, removeBody }) {
  if (!person.alive || person.mass < SHELF_EATING_MASS) return 0;
  if (!["market", "nightmarket"].includes(game.mapId)) return 0;
  let eaten = 0;
  // Growth may touch another shelf; iterate until the enlarged body has room.
  for (let index = game.obstacles.length - 1; index >= 0; index--) {
    const shelf = game.obstacles[index];
    if (
      !shelf.shelf ||
      !intersects(person.body.position, person.body.circleRadius + 2, shelf)
    )
      continue;
    removeBody(game.obstacleBodies[index]);
    game.obstacleBodies.splice(index, 1);
    game.obstacles.splice(index, 1);
    eaten++;
    game.effects.push({
      x: shelf.x,
      y: shelf.y,
      text: `RAYON DÉVORÉ ! +${SHELF_MASS_GAIN} kg`,
      life: 1.4,
      color: "#8b5325",
    });
    game.emit("shelf", person, shelf);
  }
  return eaten;
}
