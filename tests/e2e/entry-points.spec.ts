import { expect, test } from "@playwright/test";

test("participant completes the three-stage flow on a mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/?test=1");

  await page.getByRole("button", { name: "三段仕込みをはじめる" }).click();
  await page.getByRole("button", { name: "動きの代替入力を使う" }).click();
  await page.getByRole("button", { name: "この感覚を仕込みへ" }).click();
  await expect(page.getByRole("radio").first()).toBeVisible();
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: "土地の記憶を重ねる" }).click();
  await page.getByRole("radio", { name: /静かな夜/ }).click();
  await page.getByRole("button", { name: "三段の仕込みを完了する" }).click();
  await expect(page.getByText("三段の仕込みが完了しました。")).toBeVisible();
  await expect(page.getByText(/Recipe ID: recipe-v1-/)).toBeVisible();
  await page.getByLabel("音声なしで開栓する").check();
  await page.getByRole("button", { name: /開栓する/ }).click();
  await expect(
    page.getByRole("img", { name: "醸造レシピから生まれた、動く記憶の作品" }),
  ).toBeVisible();
  await expect(
    page.getByText("作品は静かな余韻として残っています。"),
  ).toBeVisible();
  await expect(page.locator(".opening-canvas")).toHaveAttribute(
    "data-visual-time-ms",
    "20",
  );
  await expect(page.locator(".opening-canvas")).toHaveScreenshot(
    "opening-fixed-chromium.png",
    { animations: "disabled" },
  );
  const hasNoHorizontalScroll = await page.evaluate<boolean>(
    "document.documentElement.scrollWidth <= window.innerWidth",
  );
  expect(hasNoHorizontalScroll).toBe(true);
});

test("venue entry is available", async ({ page }) => {
  await page.goto("/venue.html");

  await expect(
    page.getByRole("heading", { name: "Memory Brewery" }),
  ).toBeVisible();
  await expect(page.getByText("Venue entry")).toBeVisible();
});
