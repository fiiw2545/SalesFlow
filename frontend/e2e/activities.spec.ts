import { test, expect, type Page, type Locator } from "@playwright/test";

function createUniqueActivity() {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    subject: `E2E Activity ${uniqueId}`,
    description: `Activity description ${uniqueId}`,
  };
}

async function login(page: Page) {
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
}

async function openCreateModal(page: Page) {
  await page.getByRole("button", { name: /เพิ่มกิจกรรม/ }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  return dialog;
}

async function fillActivityForm(
  dialog: Locator,
  activity: ReturnType<typeof createUniqueActivity>,
) {
  await dialog.locator('input[name="subject"]').fill(activity.subject);

  await dialog.locator('select[name="type"]').selectOption("CALL");

  await dialog
    .locator('textarea[name="description"]')
    .fill(activity.description);

  // ไม่เชื่อม Deal หรือ Contact
}

async function createActivity(
  page: Page,
  activity: ReturnType<typeof createUniqueActivity>,
) {
  const dialog = await openCreateModal(page);

  await fillActivityForm(dialog, activity);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/activities/") &&
      response.request().method() === "POST",
  );

  await dialog.locator('button[type="submit"]').click();

  const response = await responsePromise;
  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body.id).toBeTruthy();

  return body.id as string;
}

test.describe("Activities E2E", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should load activities page", async ({ page }) => {
    const activitiesResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/activities/") &&
        response.request().method() === "GET",
    );

    await page.goto("/activities");

    const response = await activitiesResponsePromise;
    expect([200, 304]).toContain(response.status());

    await expect(
      page.getByRole("button", { name: /เพิ่มกิจกรรม/ }),
    ).toBeVisible();
  });

  test("should create an activity", async ({ page }) => {
    await page.goto("/activities");

    const activity = createUniqueActivity();

    await createActivity(page, activity);

    await expect(page.getByText(activity.subject)).toBeVisible();
  });

  test("should update an activity and persist after reload", async ({
    page,
  }) => {
    await page.goto("/activities");

    const activity = createUniqueActivity();

    await createActivity(page, activity);

    await expect(page.getByText(activity.subject)).toBeVisible();

    const row = page.locator("tr").filter({
      hasText: activity.subject,
    });

    await row.getByRole("button", { name: "แก้ไขกิจกรรม" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const updatedSubject = `${activity.subject} Updated`;

    await dialog.locator('input[name="subject"]').fill(updatedSubject);

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/activities/") &&
        response.request().method() === "PUT",
    );

    await dialog.locator('button[type="submit"]').click();

    const updateResponse = await updateResponsePromise;
    expect(updateResponse.status()).toBe(200);

    await expect(page.getByText(updatedSubject)).toBeVisible();

    await page.reload();

    await expect(page.getByText(updatedSubject)).toBeVisible();
  });

  test("should delete an activity", async ({ page }) => {
    await page.goto("/activities");

    const activity = createUniqueActivity();

    await createActivity(page, activity);

    await expect(page.getByText(activity.subject)).toBeVisible();

    const row = page.locator("tr").filter({
      hasText: activity.subject,
    });

    page.once("dialog", (dialog) => dialog.accept());

    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/activities/") &&
        response.request().method() === "DELETE",
    );

    await row.getByRole("button", { name: "ลบกิจกรรม" }).click();

    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(200);

    await expect(page.getByText(activity.subject)).toHaveCount(0);
  });
});
