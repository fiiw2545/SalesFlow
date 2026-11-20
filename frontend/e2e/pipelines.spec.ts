import { test, expect, type Page, type Locator } from "@playwright/test";

function createUniquePipeline() {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    name: `E2E Pipeline ${uniqueId}`,
    updatedName: `E2E Pipeline Updated ${uniqueId}`,
    description: `E2E Description ${uniqueId}`,
    updatedDescription: `E2E Updated Description ${uniqueId}`,
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

  const response = await loginResponsePromise;
  expect(response.status()).toBe(200);
}

async function openCreateModal(page: Page) {
  await page.getByRole("button", { name: /เพิ่มกระบวนการขาย/ }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  return dialog;
}

async function fillPipelineForm(
  dialog: Locator,
  name: string,
  description: string,
) {
  await dialog.locator('input[name="name"]').fill(name);
  await dialog.locator('textarea[name="description"]').fill(description);

  // ไม่เปลี่ยน Default Pipeline เดิมขององค์กร
  const defaultCheckbox = dialog.locator('input[type="checkbox"]');
  if (await defaultCheckbox.isChecked()) {
    await defaultCheckbox.uncheck();
  }
}

async function createPipeline(
  page: Page,
  pipeline: ReturnType<typeof createUniquePipeline>,
) {
  const dialog = await openCreateModal(page);
  await fillPipelineForm(dialog, pipeline.name, pipeline.description);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/pipelines/") &&
      !response.url().includes("/stages") &&
      response.request().method() === "POST",
  );

  await dialog.getByRole("button", { name: "เพิ่มกระบวนการขาย" }).click();

  const response = await responsePromise;
  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body.id).toBeTruthy();

  await expect(page.getByText(pipeline.name)).toBeVisible();

  return body.id as string;
}

async function deletePipeline(page: Page, name: string) {
  const row = page.locator("tr").filter({ hasText: name });
  await expect(row).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/pipelines/") &&
      !response.url().includes("/stages") &&
      response.request().method() === "DELETE",
  );

  await row.getByRole("button", { name: `ลบ ${name}` }).click();

  const response = await responsePromise;
  expect(response.status()).toBe(200);
}

test.describe("Pipelines E2E", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/pipelines");
  });

  test("should load pipelines page", async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/pipelines") &&
        !response.url().includes("/stages") &&
        response.request().method() === "GET",
    );

    await page.reload();

    const response = await responsePromise;
    expect([200, 304]).toContain(response.status());

    await expect(
      page.getByRole("button", { name: /เพิ่มกระบวนการขาย/ }),
    ).toBeVisible();
  });

  test("should validate pipeline name", async ({ page }) => {
    const dialog = await openCreateModal(page);

    await dialog.locator('input[name="name"]').fill("A");

    const responsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes("/pipelines/") &&
          !response.url().includes("/stages") &&
          response.request().method() === "POST",
        { timeout: 1500 },
      )
      .catch(() => null);

    await dialog.getByRole("button", { name: "เพิ่มกระบวนการขาย" }).click();

    expect(await responsePromise).toBeNull();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/อย่างน้อย 2 ตัวอักษร/)).toBeVisible();
  });

  test("should create a pipeline", async ({ page }) => {
    const pipeline = createUniquePipeline();

    await createPipeline(page, pipeline);

    await expect(page.getByText(pipeline.description)).toBeVisible();

    // ลบเฉพาะข้อมูลที่ Test นี้สร้าง
    await deletePipeline(page, pipeline.name);
    await expect(page.getByText(pipeline.name)).toHaveCount(0);
  });

  test("should update a pipeline and persist after reload", async ({
    page,
  }) => {
    const pipeline = createUniquePipeline();

    await createPipeline(page, pipeline);

    const row = page.locator("tr").filter({
      hasText: pipeline.name,
    });

    await row.getByRole("button", { name: `แก้ไข ${pipeline.name}` }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await fillPipelineForm(
      dialog,
      pipeline.updatedName,
      pipeline.updatedDescription,
    );

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/pipelines/") &&
        !response.url().includes("/stages") &&
        response.request().method() === "PUT",
    );

    await dialog.getByRole("button", { name: "บันทึกการแก้ไข" }).click();

    const response = await responsePromise;
    expect(response.status()).toBe(200);

    await expect(page.getByText(pipeline.updatedName)).toBeVisible();
    await expect(page.getByText(pipeline.updatedDescription)).toBeVisible();

    await page.reload();
    await expect(page.getByText(pipeline.updatedName)).toBeVisible();

    await deletePipeline(page, pipeline.updatedName);
    await expect(page.getByText(pipeline.updatedName)).toHaveCount(0);
  });

  test("should cancel pipeline deletion", async ({ page }) => {
    const pipeline = createUniquePipeline();

    await createPipeline(page, pipeline);

    const row = page.locator("tr").filter({
      hasText: pipeline.name,
    });

    page.once("dialog", (dialog) => dialog.dismiss());

    const responsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes("/pipelines/") &&
          !response.url().includes("/stages") &&
          response.request().method() === "DELETE",
        { timeout: 1500 },
      )
      .catch(() => null);

    await row.getByRole("button", { name: `ลบ ${pipeline.name}` }).click();

    expect(await responsePromise).toBeNull();
    await expect(page.getByText(pipeline.name)).toBeVisible();

    await deletePipeline(page, pipeline.name);
  });

  test("should delete a pipeline", async ({ page }) => {
    const pipeline = createUniquePipeline();

    await createPipeline(page, pipeline);
    await deletePipeline(page, pipeline.name);

    await expect(page.getByText(pipeline.name)).toHaveCount(0);
  });
});
