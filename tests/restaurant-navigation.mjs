// Real menu navigation shared by browser regressions after the four-ingredient redesign.
export async function chooseSolo(page, mode) {
  await page.locator("#solo-entry").press("Enter");
  await page.locator("#solo-menu").waitFor({ state: "visible" });
  await page.locator(`[data-solo-mode="${mode}"]`).click();
}
export async function openGourmand(page, tab = "look") {
  await page.locator("#gourmand-entry").press("Enter");
  const secret = await page
    .locator("body")
    .evaluate((el) => el.classList.contains("shadow-realm"));
  if (!secret && tab === "trophies") {
    await page.locator("#shop-dialog").waitFor({ state: "visible" });
    await page.locator('#shop-dialog [data-gourmand-page="trophies"]').click();
  }
  await page
    .locator(tab === "trophies" || secret ? "#trophies-dialog" : "#shop-dialog")
    .waitFor({ state: "visible" });
}
export async function closeBriefing(page, touch = false) {
  if (await page.locator("#phone-rotate").isVisible())
    await page.locator("#phone-portrait").click();
  await page.locator("#close-briefing")[touch ? "tap" : "click"]();
}
