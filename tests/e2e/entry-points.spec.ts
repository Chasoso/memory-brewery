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

test("participant publishes one recipe to a venue tab and venue restores it", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const venue = await context.newPage();
  const participant = await context.newPage();
  await venue.goto("/venue.html?test=1");
  await expect(venue.getByText("まだ記憶はありません")).toBeVisible();
  await participant.goto("/?test=1");
  await participant
    .getByRole("button", { name: "三段仕込みをはじめる" })
    .click();
  await participant
    .getByRole("button", { name: "動きの代替入力を使う" })
    .click();
  await participant.getByRole("button", { name: "この感覚を仕込みへ" }).click();
  await participant.getByRole("radio").first().click();
  await participant.getByRole("button", { name: "土地の記憶を重ねる" }).click();
  await participant.getByRole("radio", { name: /静かな夜/ }).click();
  await participant
    .getByRole("button", { name: "三段の仕込みを完了する" })
    .click();
  await participant.getByLabel("音声なしで開栓する").check();
  await participant.getByRole("button", { name: /開栓する/ }).click();
  await participant.getByRole("button", { name: "会場へ重ねる" }).click();
  await expect(participant.getByText("会場へ記憶を重ねました。")).toBeVisible();
  await expect(
    venue
      .getByText("MEMORIES BREWING")
      .locator("..")
      .getByText("1", { exact: true }),
  ).toBeVisible();
  await expect(venue.locator(".venue-canvas")).toHaveScreenshot(
    "venue-fixed-chromium.png",
    { animations: "disabled" },
  );
  await participant
    .getByRole("button", { name: "会場へ重ねる" })
    .click({ force: true })
    .catch(() => undefined);
  await venue.reload();
  await expect(
    venue
      .getByText("MEMORIES BREWING")
      .locator("..")
      .getByText("1", { exact: true }),
  ).toBeVisible();
  await venue.getByRole("button", { name: "会場の記憶をクリア" }).click();
  await venue.getByRole("button", { name: "消去する" }).click();
  await expect(venue.getByText("まだ記憶はありません")).toBeVisible();
  await context.close();
});
