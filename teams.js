// Shared team rules: cosmetics, character sizes and ordinary solo matches are independent.
export const TEAM_SIZES = [1, 2, 3, 4];
export function validTeamSetup(count, size) {
  return TEAM_SIZES.includes(size) && count >= size * 2 && count % size === 0;
}
export function sameTeam(a, b) {
  return Number.isInteger(a?.teamId) && a.teamId === b?.teamId;
}
export function survivingTeams(game) {
  return new Set(game.people.filter((p) => p.alive).map((p) => p.teamId));
}
export function lastTeamStanding(game) {
  return game.teamSize > 1 && survivingTeams(game).size <= 1;
}
export function localTeamWon(game) {
  return game.teamSize > 1
    ? game.people.some((p) => p.alive && sameTeam(p, game.people[0]))
    : game.people[0].alive;
}
export function teamColor(id) {
  return `hsl(${(id * 137.508 + 165) % 360} 78% 64%)`;
}
export function teamLabel(size) {
  return { 1: "Chacun pour soi", 2: "Duo", 3: "Trio", 4: "Quatuor" }[size];
}
