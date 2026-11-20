import { test, expect } from "@playwright/test";

test("should display dashboard and change date filter", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  expect(email, "E2E_EMAIL must be configured").toBeTruthy();
  expect(password, "E2E_PASSWORD must be configured").toBeTruthy();

  // Login
  await page.goto("/login");

  await page.getByLabel("อีเมลของคุณ").fill(email!);
  await page.getByRole("textbox", { name: "รหัสผ่าน" }).fill(password!);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/auth/login") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);

  // Open Dashboard
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);

  const dateFilter = page.locator("#dashboard-date-filter");

  await expect(dateFilter).toBeVisible();

  // ตรวจสอบค่าเริ่มต้น
  await expect(dateFilter).toHaveValue("last30Days");

  // เปลี่ยน Date Filter
  await dateFilter.selectOption("all");

  await expect(dateFilter).toHaveValue("all");
});
