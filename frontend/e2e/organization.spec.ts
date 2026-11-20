import { test, expect } from "@playwright/test";

test("should display the current organization and SALES membership", async ({
  page,
}) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  expect(email, "E2E_EMAIL must be configured").toBeTruthy();
  expect(password, "E2E_PASSWORD must be configured").toBeTruthy();

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
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/organization");

  await expect(
    page.getByRole("heading", { name: "Organization A" }),
  ).toBeVisible();

  await expect(page.getByText("organization-a").first()).toBeVisible();
  await expect(page.getByText("FREE").first()).toBeVisible();

  // บัญชี E2E เป็นสมาชิกเพียงหนึ่งองค์กร จึงไม่ต้องแสดงตัวเลือกองค์กร
  await expect(page.locator("#organization-selector")).toHaveCount(0);

  // ตรวจสอบว่ารายการองค์กรของผู้ใช้แสดงอยู่
  await expect(
    page.getByRole("button").filter({ hasText: "organization-a" }),
  ).toBeVisible();
});
