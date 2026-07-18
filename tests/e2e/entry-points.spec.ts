import { expect, test } from "@playwright/test";

test("participant entry is available", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Memory Brewery" }),
  ).toBeVisible();
  await expect(page.getByText("Participant entry")).toBeVisible();
});

test("venue entry is available", async ({ page }) => {
  await page.goto("/venue.html");

  await expect(
    page.getByRole("heading", { name: "Memory Brewery" }),
  ).toBeVisible();
  await expect(page.getByText("Venue entry")).toBeVisible();
});
