import { test, expect } from "@playwright/test";

test("should revoke session when old refresh token is reused", async ({
  request,
}) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  expect(email, "E2E_EMAIL must be configured").toBeTruthy();
  expect(password, "E2E_PASSWORD must be configured").toBeTruthy();

  // 1. Login
  const loginResponse = await request.post("http://localhost:8000/auth/login", {
    data: { email, password },
  });

  expect(loginResponse.status()).toBe(200);

  // เก็บ Token ชุดแรกไว้
  const initialState = await request.storageState();
  const oldRefreshToken = initialState.cookies.find(
    (cookie) => cookie.name === "refresh_token",
  );

  expect(oldRefreshToken).toBeDefined();

  // 2. Refresh ครั้งแรก
  const refreshResponse = await request.post(
    "http://localhost:8000/auth/refresh",
  );

  expect(refreshResponse.status()).toBe(200);

  const rotatedState = await request.storageState();
  const newAccessToken = rotatedState.cookies.find(
    (cookie) => cookie.name === "access_token",
  );
  const newRefreshToken = rotatedState.cookies.find(
    (cookie) => cookie.name === "refresh_token",
  );

  expect(newAccessToken).toBeDefined();
  expect(newRefreshToken).toBeDefined();
  expect(newRefreshToken?.value).not.toBe(oldRefreshToken?.value);

  // 3. จำลอง Replay Attack โดยนำ Refresh Token เก่ากลับมาใช้
  const replayResponse = await request.post(
    "http://localhost:8000/auth/refresh",
    {
      headers: {
        Cookie: `refresh_token=${oldRefreshToken!.value}`,
      },
    },
  );

  expect(replayResponse.status()).toBe(401);

  // 4. ตรวจสอบว่า Session ถูก Revoked
  // ใช้ Access Token ชุดใหม่ที่เคยได้รับก่อนเกิด Replay Attack
  const meResponse = await request.get("http://localhost:8000/auth/me", {
    headers: {
      Cookie: `access_token=${newAccessToken!.value}`,
    },
  });

  expect(meResponse.status()).toBe(401);
});
