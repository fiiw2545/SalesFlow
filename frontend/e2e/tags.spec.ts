import { test, expect, type Page, type Locator } from "@playwright/test";

function createUniqueTag() {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    name: `E2E Tag ${uniqueId}`,
    updatedName: `E2E Tag Updated ${uniqueId}`,
    color: "#EF4444",
  };
}

async function login(page: Page) {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  expect(email, "E2E_EMAIL must be configured").toBeTruthy();
  expect(password, "E2E_PASSWORD must be configured").toBeTruthy();

  await page.goto("/login");

  await page.locator('input[type="email"]').fill(email!);
  await page.locator('input[type="password"]').fill(password!);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/auth/login") &&
      response.request().method() === "POST",
  );

  await page.locator('button[type="submit"]').click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);
}

async function openCreateModal(page: Page) {
  await page.locator("button:has(svg.lucide-plus)").click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  return dialog;
}

async function fillTagForm(dialog: Locator, name: string, color?: string) {
  await dialog.locator('input[name="name"]').fill(name);

  if (color) {
    await dialog.locator("#tag-color").fill(color);
  }
}

async function createTag(page: Page, tag: ReturnType<typeof createUniqueTag>) {
  const dialog = await openCreateModal(page);

  await fillTagForm(dialog, tag.name, tag.color);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/tags/") &&
      response.request().method() === "POST",
  );

  await dialog.locator('button[type="submit"]').click();

  const response = await responsePromise;
  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body.id).toBeTruthy();

  return body.id as string;
}

test.describe("Tags E2E", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should load tags page", async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/tags/") &&
        response.request().method() === "GET",
    );

    await page.goto("/tags");

    const response = await responsePromise;
    expect([200, 304]).toContain(response.status());

    await expect(page.locator("button:has(svg.lucide-plus)")).toBeVisible();
  });

  test("should validate tag name", async ({ page }) => {
    await page.goto("/tags");

    const dialog = await openCreateModal(page);

    await dialog.locator('input[name="name"]').fill("A");

    const responsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes("/tags/") &&
          response.request().method() === "POST",
        { timeout: 1500 },
      )
      .catch(() => null);

    await dialog.locator('button[type="submit"]').click();

    const response = await responsePromise;
    expect(response).toBeNull();

    await expect(dialog).toBeVisible();
  });

  test("should create a tag", async ({ page }) => {
    await page.goto("/tags");

    const tag = createUniqueTag();

    await createTag(page, tag);

    const row = page.locator("tr").filter({
      hasText: tag.name,
    });

    await expect(row).toBeVisible();
    await expect(
      row.getByText(tag.color.toLowerCase(), { exact: true }),
    ).toBeVisible();
  });

  test("should update a tag and persist after reload", async ({ page }) => {
    await page.goto("/tags");

    const tag = createUniqueTag();

    await createTag(page, tag);

    await expect(page.getByText(tag.name)).toBeVisible();

    const row = page.locator("tr").filter({
      hasText: tag.name,
    });

    await row.locator("button[aria-label]").nth(0).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await fillTagForm(dialog, tag.updatedName, "#22C55E");

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/tags/") &&
        response.request().method() === "PUT",
    );

    await dialog.locator('button[type="submit"]').click();

    const updateResponse = await updateResponsePromise;
    expect(updateResponse.status()).toBe(200);

    const updatedRow = page.locator("tr").filter({
      hasText: tag.updatedName,
    });

    await expect(updatedRow).toBeVisible();
    await expect(
      updatedRow.getByText("#22c55e", { exact: true }),
    ).toBeVisible();

    await page.reload();

    const reloadedRow = page.locator("tr").filter({
      hasText: tag.updatedName,
    });

    await expect(reloadedRow).toBeVisible();
    await expect(
      reloadedRow.getByText("#22c55e", { exact: true }),
    ).toBeVisible();
  });

  test("should cancel tag deletion", async ({ page }) => {
    await page.goto("/tags");

    const tag = createUniqueTag();

    await createTag(page, tag);

    const row = page.locator("tr").filter({
      hasText: tag.name,
    });

    page.once("dialog", (dialog) => dialog.dismiss());

    const deleteResponsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes("/tags/") &&
          response.request().method() === "DELETE",
        { timeout: 1500 },
      )
      .catch(() => null);

    await row.locator("button[aria-label]").nth(1).click();

    const response = await deleteResponsePromise;
    expect(response).toBeNull();

    await expect(page.getByText(tag.name)).toBeVisible();
  });

  test("should delete a tag", async ({ page }) => {
    await page.goto("/tags");

    const tag = createUniqueTag();

    await createTag(page, tag);

    const row = page.locator("tr").filter({
      hasText: tag.name,
    });

    page.once("dialog", (dialog) => dialog.accept());

    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/tags/") &&
        response.request().method() === "DELETE",
    );

    await row.locator("button[aria-label]").nth(1).click();

    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(200);

    await expect(page.getByText(tag.name)).toHaveCount(0);
  });
});
