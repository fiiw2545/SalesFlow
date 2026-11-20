import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should display login form correctly", async ({ page }) => {
    await expect(page.getByText("ยินดีต้อนรับกลับสู่ SalesFlow")).toBeVisible();

    await expect(page.getByLabel("อีเมลของคุณ")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "รหัสผ่าน" })).toBeVisible();

    await expect(
      page.getByRole("button", { name: "เข้าสู่ระบบ" }),
    ).toBeVisible();
  });

  test("should show validation errors when submitting an empty form", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(
      page.getByText("Please enter a valid email address"),
    ).toBeVisible();

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible();
  });

  test("should reject an invalid email address", async ({ page }) => {
    const emailInput = page.getByLabel("อีเมลของคุณ");

    await emailInput.fill("invalid-email");
    await page.getByRole("textbox", { name: "รหัสผ่าน" }).fill("password123");

    // Browser should reject an invalid email format.
    const isValid = await emailInput.evaluate(
      (element: HTMLInputElement) => element.validity.valid,
    );

    expect(isValid).toBe(false);
  });

  test("should reject a password shorter than 8 characters", async ({
    page,
  }) => {
    await page.getByLabel("อีเมลของคุณ").fill("test@example.com");
    await page.getByRole("textbox", { name: "รหัสผ่าน" }).fill("1234567");

    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible();
  });

  test("should toggle password visibility", async ({ page }) => {
    const passwordInput = page.getByRole("textbox", { name: "รหัสผ่าน" });

    await passwordInput.fill("password123");

    await expect(passwordInput).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "แสดงรหัสผ่าน" }).click();

    await expect(passwordInput).toHaveAttribute("type", "text");

    await page.getByRole("button", { name: "ซ่อนรหัสผ่าน" }).click();

    await expect(passwordInput).toHaveAttribute("type", "password");
  });
});
