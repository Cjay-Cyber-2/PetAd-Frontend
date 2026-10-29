import { expect, test } from "@playwright/test";

/**
 * Visual baselines for the public screens. Update them with:
 *   npm run test:e2e:update-snapshots
 * which runs `playwright test e2e/visual --update-snapshots`.
 */
const SCREENS = [
  { name: "home", path: "/home", ready: "Welcome Pet Lover" },
  { name: "listings", path: "/listings", ready: "Listings" },
  { name: "login", path: "/login", ready: "Welcome Pet Lover" },
] as const;

const WIDTHS = [375, 1280] as const;

test.describe("visual regression", () => {
  test.use({ colorScheme: "light" });

  for (const screen of SCREENS) {
    for (const width of WIDTHS) {
      test(`${screen.name} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        if (screen.name === "login") {
          await page.goto("/");
          await page.evaluate(() => {
            localStorage.removeItem("auth_token");
            sessionStorage.removeItem("auth_token");
            localStorage.removeItem("petad_user_role");
          });
        }
        await page.goto(screen.path);
        await page.addStyleTag({
          content: "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
        });
        // The routes are lazy-loaded: wait for the page itself, not the Suspense
        // fallback, or the baseline records "Loading page...".
        await expect(page.getByRole("heading", { name: screen.ready }).first()).toBeVisible({
          timeout: 30_000,
        });

        await expect(page).toHaveScreenshot(`${screen.name}-${width}.png`, {
          animations: "disabled",
          caret: "hide",
          maxDiffPixelRatio: 0.01,
          mask: [
            page.locator("time"),
            page.locator("img"),
            page.locator("[data-testid='avatar']"),
          ],
        });
      });
    }
  }
});
