import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.QA_ADMIN_EMAIL;
const adminPassword = process.env.QA_ADMIN_PASSWORD;
const limitedEmail = process.env.QA_LIMITED_EMAIL;
const limitedPassword = process.env.QA_LIMITED_PASSWORD;

test.beforeAll(() => {
  for (const [name, value] of Object.entries({
    QA_ADMIN_EMAIL: adminEmail,
    QA_ADMIN_PASSWORD: adminPassword,
    QA_LIMITED_EMAIL: limitedEmail,
    QA_LIMITED_PASSWORD: limitedPassword,
  })) {
    if (!value) throw new Error(`${name} is required for E2E tests`);
  }
});

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await Promise.all([
    page.waitForURL(/\/dashboard(?:$|\/)/, { timeout: 30_000 }),
    page.getByRole("button", { name: "Entrar al estudio" }).click(),
  ]);
}

test("admin can log in and access the admin area", async ({ page }) => {
  await login(page, adminEmail!, adminPassword!);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin(?:$|\/)/);
});

test("limited user can log in but cannot access the admin area", async ({ page }) => {
  await login(page, limitedEmail!, limitedPassword!);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard(?:$|\/)/);
});
