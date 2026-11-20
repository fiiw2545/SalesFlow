import { test, expect } from "@playwright/test";

test("should rotate refresh token successfully", async ({ request }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  expect(email, "E2E_EMAIL must be configured").toBeTruthy();
  expect(password, "E2E_PASSWORD must be configured").toBeTruthy();

  // 1. Login
  const loginResponse = await request.post("http://localhost:8000/auth/login", {
    data: { email, password },
  });

  expect(loginResponse.status()).toBe(200);

  // 2. เก็บ Refresh Token เดิม
  const beforeRefresh = await request.storageState();

  const oldRefreshToken = beforeRefresh.cookies.find(
    (cookie) => cookie.name === "refresh_token",
  );

  expect(oldRefreshToken).toBeDefined();

  // 3. เรียก Refresh API
  const refreshResponse = await request.post(
    "http://localhost:8000/auth/refresh",
  );

  expect(refreshResponse.status()).toBe(200);

  const refreshBody = await refreshResponse.json();
  expect(refreshBody.message).toBe("Token refreshed successfully");

  // 4. ตรวจสอบว่า Refresh Token เปลี่ยนแล้ว
  const afterRefresh = await request.storageState();

  const newRefreshToken = afterRefresh.cookies.find(
    (cookie) => cookie.name === "refresh_token",
  );

  expect(newRefreshToken).toBeDefined();
  expect(newRefreshToken?.value).not.toBe(oldRefreshToken?.value);

  // 5. ตรวจสอบว่า Session ยังใช้งานได้
  const meResponse = await request.get("http://localhost:8000/auth/me");

  expect(meResponse.status()).toBe(200);
  const user = await meResponse.json();

  expect(user.email).toBe(email);
});
