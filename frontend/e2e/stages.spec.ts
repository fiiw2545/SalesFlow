import { test, expect, type Page } from "@playwright/test";

function createUniqueData() {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    pipelineName: `E2E Stage Pipeline ${id}`,
    pipelineDescription: `Temporary pipeline ${id}`,
    stageName: `E2E Stage ${id}`,
    updatedStageName: `E2E Stage Updated ${id}`,
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

  const loginPromise = page.waitForResponse(
    (response) =>
      response.url().includes("/auth/login") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

  const response = await loginPromise;
  expect(response.status()).toBe(200);
}

async function createPipeline(
  page: Page,
  data: ReturnType<typeof createUniqueData>,
) {
  await page.goto("/pipelines");

  await page.getByRole("button", { name: /เพิ่มกระบวนการขาย/ }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.locator('input[name="name"]').fill(data.pipelineName);
  await dialog
    .locator('textarea[name="description"]')
    .fill(data.pipelineDescription);

  const checkbox = dialog.locator('input[type="checkbox"]');
  if (await checkbox.isChecked()) {
    await checkbox.uncheck();
  }

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

  return body.id as string;
}

async function openStages(page: Page, pipelineName: string) {
  const row = page.locator("tr").filter({ hasText: pipelineName });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "จัดการขั้นตอน" }).click();
  await expect(page).toHaveURL(/\/pipelines\/[^/]+\/stages$/);

  await expect(
    page.getByRole("button", { name: "เพิ่มขั้นตอน" }),
  ).toBeVisible();
}

async function createStage(
  page: Page,
  name: string,
  position = 1,
  probability = 25,
) {
  await page.getByRole("button", { name: "เพิ่มขั้นตอน" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.locator('input[name="name"]').fill(name);
  await dialog.locator('input[name="position"]').fill(String(position));
  await dialog.locator('input[name="probability"]').fill(String(probability));

  const responsePromise = page.waitForResponse(
    (response) =>
      /\/pipelines\/[^/]+\/stages\/?$/.test(new URL(response.url()).pathname) &&
      response.request().method() === "POST",
  );

  await dialog.getByRole("button", { name: "เพิ่มขั้นตอน" }).click();

  const response = await responsePromise;
  expect(response.status()).toBe(201);

  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

async function deleteStage(page: Page, name: string) {
  const row = page.locator("tr").filter({ hasText: name });
  await expect(row).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());

  const responsePromise = page.waitForResponse(
    (response) =>
      /\/pipelines\/[^/]+\/stages\/[^/]+\/?$/.test(
        new URL(response.url()).pathname,
      ) && response.request().method() === "DELETE",
  );

  await row.getByRole("button", { name: `ลบ ${name}` }).click();

  const response = await responsePromise;
  expect(response.status()).toBe(200);

  await expect(page.getByText(name, { exact: true })).toHaveCount(0);
}

async function deletePipeline(page: Page, name: string) {
  await page.goto("/pipelines");

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

  await expect(page.getByText(name, { exact: true })).toHaveCount(0);
}

test.describe("Stages E2E", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should load stages page", async ({ page }) => {
    const data = createUniqueData();
    await createPipeline(page, data);
    await openStages(page, data.pipelineName);

    const responsePromise = page.waitForResponse(
      (response) =>
        /\/pipelines\/[^/]+\/stages(?:\?.*)?$/.test(response.url()) &&
        response.request().method() === "GET",
    );

    await page.reload();

    const response = await responsePromise;
    expect([200, 304]).toContain(response.status());

    await expect(
      page.getByRole("heading", {
        name: `${data.pipelineName} - ขั้นตอนการขาย`,
      }),
    ).toBeVisible();

    await deletePipeline(page, data.pipelineName);
  });

  test("should validate stage name", async ({ page }) => {
    const data = createUniqueData();
    await createPipeline(page, data);
    await openStages(page, data.pipelineName);

    await page.getByRole("button", { name: "เพิ่มขั้นตอน" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.locator('input[name="name"]').fill("A");

    const responsePromise = page
      .waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          /\/pipelines\/[^/]+\/stages\/?$/.test(
            new URL(response.url()).pathname,
          ),
        { timeout: 1500 },
      )
      .catch(() => null);

    await dialog.getByRole("button", { name: "เพิ่มขั้นตอน" }).click();

    expect(await responsePromise).toBeNull();
    await expect(dialog.getByText(/2–100 ตัวอักษร/)).toBeVisible();

    await deletePipeline(page, data.pipelineName);
  });

  test("should create a stage", async ({ page }) => {
    const data = createUniqueData();
    await createPipeline(page, data);
    await openStages(page, data.pipelineName);

    await createStage(page, data.stageName, 1, 25);

    await expect(page.getByText("25%", { exact: true })).toBeVisible();

    await deleteStage(page, data.stageName);
    await deletePipeline(page, data.pipelineName);
  });

  test("should update a stage and persist after reload", async ({ page }) => {
    const data = createUniqueData();
    await createPipeline(page, data);
    await openStages(page, data.pipelineName);

    await createStage(page, data.stageName, 1, 25);

    const row = page.locator("tr").filter({ hasText: data.stageName });
    await row.getByRole("button", { name: `แก้ไข ${data.stageName}` }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.locator('input[name="name"]').fill(data.updatedStageName);
    await dialog.locator('input[name="probability"]').fill("75");

    const responsePromise = page.waitForResponse(
      (response) =>
        /\/pipelines\/[^/]+\/stages\/[^/]+\/?$/.test(
          new URL(response.url()).pathname,
        ) && response.request().method() === "PUT",
    );

    await dialog.getByRole("button", { name: "บันทึกการแก้ไข" }).click();

    const response = await responsePromise;
    expect(response.status()).toBe(200);

    await expect(
      page.getByText(data.updatedStageName, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("75%", { exact: true })).toBeVisible();

    await page.reload();

    await expect(
      page.getByText(data.updatedStageName, { exact: true }),
    ).toBeVisible();

    await deleteStage(page, data.updatedStageName);
    await deletePipeline(page, data.pipelineName);
  });

  test("should cancel stage deletion", async ({ page }) => {
    const data = createUniqueData();
    await createPipeline(page, data);
    await openStages(page, data.pipelineName);

    await createStage(page, data.stageName);

    const row = page.locator("tr").filter({ hasText: data.stageName });

    page.once("dialog", (dialog) => dialog.dismiss());

    const responsePromise = page
      .waitForResponse(
        (response) =>
          response.request().method() === "DELETE" &&
          /\/pipelines\/[^/]+\/stages\/[^/]+\/?$/.test(
            new URL(response.url()).pathname,
          ),
        { timeout: 1500 },
      )
      .catch(() => null);

    await row.getByRole("button", { name: `ลบ ${data.stageName}` }).click();

    expect(await responsePromise).toBeNull();
    await expect(page.getByText(data.stageName, { exact: true })).toBeVisible();

    await deleteStage(page, data.stageName);
    await deletePipeline(page, data.pipelineName);
  });

  test("should delete a stage", async ({ page }) => {
    const data = createUniqueData();
    await createPipeline(page, data);
    await openStages(page, data.pipelineName);

    await createStage(page, data.stageName);

    await deleteStage(page, data.stageName);
    await deletePipeline(page, data.pipelineName);
  });
});
