import { test, expect } from "@playwright/test";

test.describe("Companies E2E", () => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  test.beforeEach(async ({ page }) => {
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
  });

  test("should display companies page and load company list", async ({
    page,
  }) => {
    const companiesResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/companies/") &&
        response.request().method() === "GET",
    );

    await page.goto("/companies");

    const companiesResponse = await companiesResponsePromise;

    expect([200, 304]).toContain(companiesResponse.status());
    await expect(page.locator("table")).toBeVisible();
  });

  test("should create a new company successfully", async ({ page }) => {
    const companyName = `E2E Create ${Date.now()}`;

    await page.goto("/companies");

    await page.getByRole("button", { name: /เพิ่มบริษัท/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.locator('input[name="name"]').fill(companyName);
    await dialog.locator('input[name="industry"]').fill("Technology");
    await dialog.locator('textarea[name="address"]').fill("Bangkok, Thailand");
    await dialog.locator('input[name="phone"]').fill("0812345678");
    await dialog.locator('input[name="website"]').fill("example.com");

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/companies/") &&
        response.request().method() === "POST",
    );

    await dialog.locator('button[type="submit"]').click();

    const createResponse = await createResponsePromise;

    expect(createResponse.status()).toBe(201);

    await expect(dialog).toHaveCount(0);
    await expect(page.getByText(companyName)).toBeVisible();
  });

  test("should update an existing company successfully", async ({ page }) => {
    const companyName = `E2E Update ${Date.now()}`;
    const updatedCompanyName = `${companyName} Updated`;

    await page.goto("/companies");

    await page.getByRole("button", { name: /เพิ่มบริษัท/i }).click();

    const dialog = page.getByRole("dialog");

    await dialog.locator('input[name="name"]').fill(companyName);

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/companies/") &&
        response.request().method() === "POST",
    );

    await dialog.locator('button[type="submit"]').click();

    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(201);

    const createdCompany = await createResponse.json();
    const companyId = createdCompany.id;

    expect(companyId).toBeTruthy();

    await expect(dialog).toHaveCount(0);
    await expect(page.getByText(companyName)).toBeVisible();

    const companyRow = page.locator("tr").filter({ hasText: companyName });

    await companyRow
      .getByRole("button", { name: new RegExp(`แก้ไข ${companyName}`) })
      .click();

    const editDialog = page.getByRole("dialog");

    await expect(editDialog).toBeVisible();
    await expect(editDialog.locator('input[name="name"]')).toHaveValue(
      companyName,
    );

    await editDialog.locator('input[name="name"]').fill(updatedCompanyName);

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/companies/${companyId}`) &&
        response.request().method() === "PATCH",
    );

    await editDialog.locator('button[type="submit"]').click();

    const updateResponse = await updateResponsePromise;

    expect(updateResponse.status()).toBe(200);

    await expect(editDialog).toHaveCount(0);
    await expect(page.getByText(updatedCompanyName)).toBeVisible();

    await page.reload();

    await expect(page.getByText(updatedCompanyName)).toBeVisible();
    await expect(page.getByText(companyName, { exact: true })).toHaveCount(0);
  });
});
