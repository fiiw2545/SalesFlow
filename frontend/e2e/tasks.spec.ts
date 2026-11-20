import { test, expect, type Page } from "@playwright/test";

function createUniqueTask() {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    title: `E2E Task ${uniqueId}`,
    description: `Task description ${uniqueId}`,
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
  await page.getByRole("button", { name: /เพิ่มงาน/ }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  return dialog;
}

async function fillTaskForm(
  dialog: ReturnType<Page["locator"]>,
  task: ReturnType<typeof createUniqueTask>,
) {
  await dialog.locator('input[name="title"]').fill(task.title);

  await dialog.locator('textarea[name="description"]').fill(task.description);

  await dialog.locator('select[name="priority"]').selectOption("HIGH");
  await dialog.locator('select[name="status"]').selectOption("PENDING");
}

async function createTask(
  page: Page,
  task: ReturnType<typeof createUniqueTask>,
) {
  const dialog = await openCreateModal(page);

  await fillTaskForm(dialog, task);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/tasks/") &&
      response.request().method() === "POST",
  );

  await dialog.locator('button[type="submit"]').click();

  const response = await responsePromise;
  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body.id).toBeTruthy();

  return body.id as string;
}

test.describe("Tasks E2E", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should load tasks page", async ({ page }) => {
    const tasksResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/tasks/") &&
        response.request().method() === "GET",
    );

    await page.goto("/tasks");

    const response = await tasksResponsePromise;
    expect([200, 304]).toContain(response.status());

    await expect(page.getByRole("button", { name: /เพิ่มงาน/ })).toBeVisible();
  });

  test("should create a task", async ({ page }) => {
    await page.goto("/tasks");

    const task = createUniqueTask();

    await createTask(page, task);

    await expect(page.getByText(task.title)).toBeVisible();
  });

  test("should update a task", async ({ page }) => {
    await page.goto("/tasks");

    const task = createUniqueTask();

    await createTask(page, task);
    await expect(page.getByText(task.title)).toBeVisible();

    const row = page.locator("tr").filter({
      hasText: task.title,
    });

    await row.getByRole("button", { name: "แก้ไขงาน" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const updatedTitle = `${task.title} Updated`;

    await dialog.locator('input[name="title"]').fill(updatedTitle);

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/tasks/") &&
        response.request().method() === "PUT",
    );

    await dialog.locator('button[type="submit"]').click();

    const updateResponse = await updateResponsePromise;
    expect(updateResponse.status()).toBe(200);

    await expect(page.getByText(updatedTitle)).toBeVisible();

    await page.reload();

    await expect(page.getByText(updatedTitle)).toBeVisible();
  });

  test("should delete a task", async ({ page }) => {
    await page.goto("/tasks");

    const task = createUniqueTask();

    await createTask(page, task);
    await expect(page.getByText(task.title)).toBeVisible();

    page.on("dialog", (dialog) => dialog.accept());

    const row = page.locator("tr").filter({
      hasText: task.title,
    });

    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/tasks/") &&
        response.request().method() === "DELETE",
    );

    await row.getByRole("button", { name: "ลบงาน" }).click();

    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(200);

    await expect(page.getByText(task.title)).toHaveCount(0);
  });
});
