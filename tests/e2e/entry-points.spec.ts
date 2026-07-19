import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const snapshotKey = "memory-brewery.local-venue.snapshot.v1";

async function expectNoAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
}

async function expectNoHorizontalScroll(page: Page) {
  expect(
    await page.evaluate<boolean>(
      "document.documentElement.scrollWidth <= window.innerWidth",
    ),
  ).toBe(true);
}

async function completeParticipant(
  page: Page,
  options: { colorIndex?: number; scenario?: RegExp } = {},
) {
  await page.getByRole("button", { name: "三段仕込みをはじめる" }).click();
  await page
    .getByRole("radio")
    .nth(options.colorIndex ?? 0)
    .click();
  await page.getByRole("button", { name: "動きの代替入力を使う" }).click();
  await page.getByRole("button", { name: "この感覚を仕込みへ" }).click();
  await expect(page.getByRole("radio").first()).toBeVisible();
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: "土地の記憶を重ねる" }).click();
  await page
    .getByRole("radio", { name: options.scenario ?? /静かな夜/ })
    .click();
  await page.getByRole("button", { name: "三段の仕込みを完了する" }).click();
  await expect(page.getByText("三段の仕込みが完了しました。")).toBeVisible();
}

async function openWithoutAudio(page: Page) {
  await page.getByLabel("音声なしで開栓する").check();
  await page.getByRole("button", { name: /開栓する/ }).click();
  await expect(
    page.getByRole("img", { name: "醸造レシピから生まれた、動く記憶の作品" }),
  ).toBeVisible();
}

async function expectVenueCount(page: Page, count: number) {
  await expect(page.locator(".venue-counter strong")).toHaveText(String(count));
}

async function expectSnapshotCount(page: Page, count: number) {
  expect(
    await page.evaluate<number>(
      `(() => { const stored = localStorage.getItem(${JSON.stringify(snapshotKey)}); return stored === null ? 0 : JSON.parse(stored).recipes.length; })()`,
    ),
  ).toBe(count);
}

test("@visual participant representative states remain stable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/?test=1");
  await expect(page).toHaveScreenshot("participant-initial.png", {
    animations: "disabled",
    fullPage: true,
  });

  await completeParticipant(page);
  await expectNoAxeViolations(page);
  await openWithoutAudio(page);
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
  await expect(page).toHaveScreenshot("participant-opening-completed.png", {
    animations: "disabled",
    fullPage: true,
  });
  await expectNoHorizontalScroll(page);
});

test("participant accepts real Pointer Events, and the initial step has no axe violations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/?test=1");
  await page.getByRole("button", { name: "三段仕込みをはじめる" }).click();
  await expectNoAxeViolations(page);
  await page.getByRole("radio").first().click();
  const pad = page.getByRole("img", {
    name: "指、ペン、またはマウスで動きを描く入力領域",
  });
  await pad.dispatchEvent("pointerdown", {
    pointerId: 1,
    clientX: 20,
    clientY: 20,
    timeStamp: 0,
  });
  await pad.dispatchEvent("pointermove", {
    pointerId: 1,
    clientX: 80,
    clientY: 40,
    timeStamp: 30,
  });
  await pad.dispatchEvent("pointermove", {
    pointerId: 1,
    clientX: 140,
    clientY: 100,
    timeStamp: 60,
  });
  await pad.dispatchEvent("pointerup", {
    pointerId: 1,
    clientX: 140,
    clientY: 100,
    timeStamp: 80,
  });
  await expect(
    page.getByRole("button", { name: "この感覚を仕込みへ" }),
  ).toBeEnabled();
  await expectNoHorizontalScroll(page);
  expect(errors).toEqual([]);
});

test("participant can finish and publish using only the keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/?test=1");
  const start = page.getByRole("button", { name: "三段仕込みをはじめる" });
  await start.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(start).toBeFocused();
  await expect(start).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");

  const color = page.getByRole("radio").first();
  await color.focus();
  await page.keyboard.press("Space");
  const gestureAlternative = page.getByRole("button", {
    name: "動きの代替入力を使う",
  });
  await gestureAlternative.focus();
  await page.keyboard.press("Enter");
  const initialNext = page.getByRole("button", { name: "この感覚を仕込みへ" });
  await initialNext.focus();
  await page.keyboard.press("Enter");

  const land = page.getByRole("radio").first();
  await land.focus();
  await page.keyboard.press("Space");
  const landNext = page.getByRole("button", { name: "土地の記憶を重ねる" });
  await landNext.focus();
  await page.keyboard.press("Enter");
  const scenario = page.getByRole("radio", { name: /静かな夜/ });
  await scenario.focus();
  await page.keyboard.press("Space");
  const complete = page.getByRole("button", { name: "三段の仕込みを完了する" });
  await complete.focus();
  await page.keyboard.press("Enter");

  const noAudio = page.getByLabel("音声なしで開栓する");
  await noAudio.focus();
  await page.keyboard.press("Space");
  const opening = page.getByRole("button", { name: /開栓する/ });
  await opening.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "会場へ重ねる" }),
  ).toBeVisible();
  const publish = page.getByRole("button", { name: "会場へ重ねる" });
  await publish.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("会場へ記憶を重ねました。")).toBeVisible();
  const reset = page.getByRole("button", { name: "最初から仕込む" }).first();
  await reset.focus();
  await page.keyboard.press("Enter");
  await expect(start).toBeVisible();
});

test("an unknown sake_id is recoverable without silently selecting a different sake", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?test=1&sake_id=unknown-sake");
  await expect(page.getByRole("alert")).toHaveText(
    "指定された酒が見つかりません。",
  );
  await page.getByRole("button", { name: "既定の酒で始める" }).click();
  await expect(
    page.getByText("sake_id: development-sake-snow-01"),
  ).toBeVisible();
  await expectNoHorizontalScroll(page);
  expect(errors).toEqual([]);
});

test("@visual the comparative sake has its own deterministic opening canvas", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/?test=1&sake_id=development-sake-water-02");
  await completeParticipant(page);
  await openWithoutAudio(page);
  await expect(page.locator(".opening-canvas")).toHaveAttribute(
    "data-visual-time-ms",
    "20",
  );
  await expect(page.locator(".opening-canvas")).toHaveScreenshot(
    "opening-comparative-sake-b.png",
    { animations: "disabled" },
  );
});

test("@visual venue restores late-open recipes, rejects duplicates, and clears every open venue", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const participant = await context.newPage();
  await participant.setViewportSize({ width: 375, height: 760 });
  await participant.goto("/?test=1&sake_id=development-sake-snow-01");
  await completeParticipant(participant);
  const firstRecipeId = await participant.locator(".recipe-id").textContent();
  await openWithoutAudio(participant);
  await participant.getByRole("button", { name: "会場へ重ねる" }).click();
  await expect(participant.getByText("会場へ記憶を重ねました。")).toBeVisible();

  const venue = await context.newPage();
  await venue.setViewportSize({ width: 1280, height: 720 });
  await venue.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await venue.goto("/venue.html?test=1");
  await expectVenueCount(venue, 1);
  await expectSnapshotCount(venue, 1);

  const duplicateParticipant = await context.newPage();
  await duplicateParticipant.goto("/?test=1");
  await completeParticipant(duplicateParticipant);
  await openWithoutAudio(duplicateParticipant);
  await duplicateParticipant
    .getByRole("button", { name: "会場へ重ねる" })
    .click();
  await expect(
    duplicateParticipant.getByText("この記憶はすでに会場へ重なっています。"),
  ).toBeVisible();
  await expectVenueCount(venue, 1);
  await expectSnapshotCount(venue, 1);
  await venue.reload();
  await expectVenueCount(venue, 1);

  const secondParticipant = await context.newPage();
  await secondParticipant.goto("/?test=1&sake_id=development-sake-water-02");
  await expect(
    secondParticipant.getByText("開発用記憶酒・深い麹"),
  ).toBeVisible();
  await completeParticipant(secondParticipant);
  const secondRecipeId = await secondParticipant
    .locator(".recipe-id")
    .textContent();
  expect(secondRecipeId).not.toBe(firstRecipeId);
  await openWithoutAudio(secondParticipant);
  await secondParticipant.getByRole("button", { name: "会場へ重ねる" }).click();
  await expectVenueCount(venue, 2);
  await expect(venue.getByText("新しい記憶が重なりました。")).toBeVisible();
  await expectNoAxeViolations(venue);
  await expect(venue.locator(".venue-canvas")).toHaveScreenshot(
    "venue-fixed-chromium.png",
    { animations: "disabled" },
  );
  await expect(venue).toHaveScreenshot("venue-multiple.png", {
    animations: "disabled",
    fullPage: true,
  });

  const secondVenue = await context.newPage();
  await secondVenue.setViewportSize({ width: 1920, height: 1080 });
  await secondVenue.emulateMedia({
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  await secondVenue.goto("/venue.html?test=1");
  await expectVenueCount(secondVenue, 2);
  await venue.getByRole("button", { name: "会場の記憶をクリア" }).click();
  await venue.getByRole("button", { name: "キャンセル" }).click();
  await expectVenueCount(venue, 2);
  await venue.getByRole("button", { name: "会場の記憶をクリア" }).click();
  await venue.getByRole("button", { name: "消去する" }).click();
  await expectVenueCount(venue, 0);
  await expectVenueCount(secondVenue, 0);
  await expect(venue.getByText("まだ記憶はありません")).toBeVisible();
  await context.close();
});

test("@visual venue empty state remains stable", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/venue.html?test=1");
  await expect(page.getByText("まだ記憶はありません")).toBeVisible();
  await expectNoAxeViolations(page);
  await expect(page).toHaveScreenshot("venue-empty.png", {
    animations: "disabled",
    fullPage: true,
  });
});
