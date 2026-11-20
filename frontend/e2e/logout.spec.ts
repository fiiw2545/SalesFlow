import { test, expect } from "@playwright/test";

test("should logout successfully and revoke authentication", async ({
  request,
}) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  expect(email, "E2E_EMAIL must be configured").toBeTruthy();
  expect(password, "E2E_PASSWORD must be configured").toBeTruthy();

  // 1. Login เพื่อรับ Authentication Cookies
  const loginResponse = await request.post("http://localhost:8000/auth/login", {
    data: { email, password },
  });

  expect(loginResponse.status()).toBe(200);

  // 2. ตรวจสอบว่า Login ได้รับ Cookies
  const cookiesBeforeLogout = await request.storageState();
  const accessCookie = cookiesBeforeLogout.cookies.find(
    (cookie) => cookie.name === "access_token",
  );
  const refreshCookie = cookiesBeforeLogout.cookies.find(
    (cookie) => cookie.name === "refresh_token",
  );

  expect(accessCookie).toBeDefined();
  expect(refreshCookie).toBeDefined();

  // 3. Logout
  const logoutResponse = await request.post(
    "http://localhost:8000/auth/logout",
  );

  expect(logoutResponse.status()).toBe(200);

  const logoutBody = await logoutResponse.json();
  expect(logoutBody.message).toBe("Logout successful");

  // 4. ตรวจสอบว่า Cookies ถูกล้าง
  const cookiesAfterLogout = await request.storageState();

  const remainingAccessCookie = cookiesAfterLogout.cookies.find(
    (cookie) => cookie.name === "access_token",
  );
  const remainingRefreshCookie = cookiesAfterLogout.cookies.find(
    (cookie) => cookie.name === "refresh_token",
  );

  expect(remainingAccessCookie).toBeUndefined();
  expect(remainingRefreshCookie).toBeUndefined();

  // 5. ตรวจสอบว่า Session ใช้งานไม่ได้แล้ว
  const meResponse = await request.get("http://localhost:8000/auth/me");

  expect(meResponse.status()).toBe(401);
});
