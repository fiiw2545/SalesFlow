import { test, expect } from "@playwright/test";

test("should logout successfully through profile menu", async ({
  page,
  context,
}) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  expect(email, "E2E_EMAIL must be configured").toBeTruthy();
  expect(password, "E2E_PASSWORD must be configured").toBeTruthy();

  // 1. Login
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

  // 2. ตรวจสอบ Authentication Cookies
  const cookiesBeforeLogout = await context.cookies("http://localhost:8000");

  expect(
    cookiesBeforeLogout.some((cookie) => cookie.name === "access_token"),
  ).toBe(true);

  expect(
    cookiesBeforeLogout.some((cookie) => cookie.name === "refresh_token"),
  ).toBe(true);

  // 3. เปิด Profile Menu
  await page.getByRole("button", { name: "เปิดเมนูโปรไฟล์" }).click();

  // 4. กด Logout
  const logoutResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/auth/logout") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Sign out" }).click();

  const logoutResponse = await logoutResponsePromise;
  expect(logoutResponse.status()).toBe(200);

  // 5. ตรวจสอบ Redirect
  await expect(page).toHaveURL(/\/login$/);

  // 6. ตรวจสอบ Cookies ถูกล้าง
  const cookiesAfterLogout = await context.cookies("http://localhost:8000");

  expect(
    cookiesAfterLogout.some((cookie) => cookie.name === "access_token"),
  ).toBe(false);

  expect(
    cookiesAfterLogout.some((cookie) => cookie.name === "refresh_token"),
  ).toBe(false);

  // 7. ตรวจสอบว่า Authentication ใช้งานไม่ได้แล้ว
  const meResponse = await page.request.get("http://localhost:8000/auth/me");

  expect(meResponse.status()).toBe(401);
});
