import { test, expect } from "@playwright/test";

test("should login successfully and receive HttpOnly cookies", async ({
  page,
  context,
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

  const cookies = await context.cookies("http://localhost:8000");

  const accessCookie = cookies.find((cookie) => cookie.name === "access_token");

  const refreshCookie = cookies.find(
    (cookie) => cookie.name === "refresh_token",
  );

  expect(accessCookie).toBeDefined();
  expect(refreshCookie).toBeDefined();

  expect(accessCookie?.httpOnly).toBe(true);
  expect(refreshCookie?.httpOnly).toBe(true);

  const meResponse = await page.request.get("http://localhost:8000/auth/me");

  expect(meResponse.status()).toBe(200);

  const user = await meResponse.json();

  expect(user.email).toBe(email);
  expect(user.name).toBe("Playwright E2E User");
});
