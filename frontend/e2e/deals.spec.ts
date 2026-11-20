import { test, expect, type Page } from "@playwright/test";

type Stage = {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
};

function createUniqueDeal() {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    title: `E2E Deal ${uniqueId}`,
    value: "25000",
    currency: "THB",
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

async function getPipelineAndStage(page: Page) {
  const pipelinesResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/pipelines") &&
      !response.url().includes("/stages") &&
      response.request().method() === "GET",
  );

  const stageResults: Array<{
    pipelineId: string;
    items: Stage[];
  }> = [];

  page.on("response", async (response) => {
    const url = response.url();

    // เก็บเฉพาะ Stage API ของ Backend
    if (
      !url.startsWith("http://localhost:8000/") ||
      !url.includes("/stages") ||
      response.request().method() !== "GET" ||
      response.status() !== 200
    ) {
      return;
    }

    try {
      const body = await response.json();
      const match = url.match(/\/pipelines\/([^/]+)\/stages/);

      if (match) {
        stageResults.push({
          pipelineId: match[1],
          items: body.items ?? [],
        });
      }
    } catch {
      // Ignore responses that cannot be parsed
    }
  });

  await page.goto("/deals");

  const pipelinesResponse = await pipelinesResponsePromise;
  expect([200, 304]).toContain(pipelinesResponse.status());

  const dialog = await openCreateModal(page);

  const pipelineSelect = dialog.locator('select[name="pipeline_id"]');
  const stageSelect = dialog.locator('select[name="stage_id"]');

  await expect(async () => {
    const count = await pipelineSelect.locator("option").count();
    expect(count).toBeGreaterThan(1);
  }).toPass({ timeout: 10000 });

  // รอจนกว่าจะพบ Pipeline ที่มี Stage อย่างน้อยหนึ่งรายการ
  await expect
    .poll(() => stageResults.some((result) => result.items.length > 0), {
      timeout: 15000,
    })
    .toBeTruthy();

  // เลือก Pipeline ที่มี Stage จริง
  const pipelineWithStages = stageResults.find(
    (result) => result.items.length > 0,
  );

  expect(pipelineWithStages).toBeTruthy();

  const pipelineId = pipelineWithStages!.pipelineId;

  await pipelineSelect.selectOption(pipelineId);

  // รอให้ Stage Select แสดงรายการ
  await expect(async () => {
    const count = await stageSelect.locator("option").count();
    expect(count).toBeGreaterThan(1);
  }).toPass({ timeout: 10000 });

  const stageId = await stageSelect
    .locator("option")
    .nth(1)
    .getAttribute("value");

  expect(stageId).toBeTruthy();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  return {
    pipeline: { id: pipelineId },
    stage: { id: stageId! },
  };
}

async function openCreateModal(page: Page) {
  await page.getByRole("button", { name: /เพิ่มดีล/ }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  return dialog;
}

async function fillDealForm(
  dialog: import("@playwright/test").Locator,
  deal: ReturnType<typeof createUniqueDeal>,
  pipelineId: string,
  stageId: string,
) {
  await dialog.locator('input[name="title"]').fill(deal.title);
  await dialog.locator('input[name="value"]').fill(deal.value);
  await dialog.locator('input[name="currency"]').fill(deal.currency);
  await dialog.locator('select[name="pipeline_id"]').selectOption(pipelineId);
  await dialog.locator('select[name="stage_id"]').selectOption(stageId);
}

async function createDeal(
  page: Page,
  deal: ReturnType<typeof createUniqueDeal>,
  pipelineId: string,
  stageId: string,
) {
  const dialog = await openCreateModal(page);
  await fillDealForm(dialog, deal, pipelineId, stageId);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/deals/") &&
      response.request().method() === "POST",
  );

  await dialog.locator('button[type="submit"]').click();

  const response = await responsePromise;
  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body.id).toBeTruthy();

  return body.id as string;
}

test.describe("Deals E2E", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should load deals page", async ({ page }) => {
    const dealsResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/deals") &&
        response.request().method() === "GET",
    );

    await page.goto("/deals");

    const response = await dealsResponsePromise;
    expect([200, 304]).toContain(response.status());

    await expect(page.getByRole("button", { name: /เพิ่มดีล/ })).toBeVisible();
  });

  test("should create a deal", async ({ page }) => {
    const { pipeline, stage } = await getPipelineAndStage(page);
    const deal = createUniqueDeal();

    await createDeal(page, deal, pipeline.id, stage.id);

    await expect(page.getByText(deal.title)).toBeVisible();
  });

  test("should update a deal", async ({ page }) => {
    const { pipeline, stage } = await getPipelineAndStage(page);
    const deal = createUniqueDeal();

    await createDeal(page, deal, pipeline.id, stage.id);
    await expect(page.getByText(deal.title)).toBeVisible();

    const row = page.locator("tr").filter({ hasText: deal.title });
    await row.getByRole("button", { name: "แก้ไขดีล" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const updatedTitle = `${deal.title} Updated`;
    await dialog.locator('input[name="title"]').fill(updatedTitle);

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/deals/") &&
        response.request().method() === "PUT",
    );

    await dialog.locator('button[type="submit"]').click();

    const updateResponse = await updateResponsePromise;
    expect(updateResponse.status()).toBe(200);

    await expect(page.getByText(updatedTitle)).toBeVisible();

    await page.reload();
    await expect(page.getByText(updatedTitle)).toBeVisible();
  });
});
