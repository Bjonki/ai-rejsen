import { test, expect } from "@playwright/test";

test("renders CampScout hero copy", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /browser-assisted availability checks/i,
    }),
  ).toBeVisible();
});
