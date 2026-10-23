// Camera only: world dimensions, physics and authoritative coordinates stay intact.
export function gameplayViewport(
  width,
  height,
  worldWidth,
  worldHeight,
  phone,
  fitToArena,
) {
  const screenWidth = Math.max(320, width),
    screenHeight = Math.max(320, height);
  const fit = Math.max(screenWidth / worldWidth, screenHeight / worldHeight);
  const desktopScale = fitToArena ? Math.max(1, fit) : 1;
  const zoomOut = phone
    ? Math.max(1, 720 / Math.min(screenWidth, screenHeight))
    : 1;
  const scale = phone
    ? Math.max(desktopScale / zoomOut, fitToArena ? fit : 0)
    : desktopScale;
  return { width: screenWidth / scale, height: screenHeight / scale };
}
