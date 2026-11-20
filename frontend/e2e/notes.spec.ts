import { test, expect, type Page, type Locator } from "@playwright/test";

function createUniqueNote() {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    title: `E2E Note ${uniqueId}`,
    content: `Note content ${uniqueId}`,
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

async function fillNoteForm(
  dialog: Locator,
  note: ReturnType<typeof createUniqueNote>,
) {
  await dialog.locator('input[name="title"]').fill(note.title);
  await dialog.locator('textarea[name="content"]').fill(note.content);

  // ไม่เชื่อมโยง Company, Contact หรือ Deal
}

async function createNote(
  page: Page,
  note: ReturnType<typeof createUniqueNote>,
) {
  const dialog = await openCreateModal(page);

  await fillNoteForm(dialog, note);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/notes/") &&
      response.request().method() === "POST",
  );

  await dialog.locator('button[type="submit"]').click();

  const response = await responsePromise;
  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body.id).toBeTruthy();

  return body.id as string;
}

test.describe("Notes E2E", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should load notes page", async ({ page }) => {
    const notesResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/notes/") &&
        response.request().method() === "GET",
    );

    await page.goto("/notes");

    const response = await notesResponsePromise;
    expect([200, 304]).toContain(response.status());

    await expect(page.locator("button:has(svg.lucide-plus)")).toBeVisible();
  });

  test("should create a note", async ({ page }) => {
    await page.goto("/notes");

    const note = createUniqueNote();

    await createNote(page, note);

    await expect(page.getByText(note.title)).toBeVisible();
    await expect(page.getByText(note.content)).toBeVisible();
  });

  test("should update a note and persist after reload", async ({ page }) => {
    await page.goto("/notes");

    const note = createUniqueNote();

    await createNote(page, note);

    await expect(page.getByText(note.title)).toBeVisible();

    const row = page.locator("tr").filter({
      hasText: note.title,
    });

    await row.locator("button[aria-label]").nth(0).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const updatedTitle = `${note.title} Updated`;
    const updatedContent = `${note.content} Updated`;

    await dialog.locator('input[name="title"]').fill(updatedTitle);
    await dialog.locator('textarea[name="content"]').fill(updatedContent);

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/notes/") &&
        response.request().method() === "PUT",
    );

    await dialog.locator('button[type="submit"]').click();

    const updateResponse = await updateResponsePromise;
    expect(updateResponse.status()).toBe(200);

    await expect(page.getByText(updatedTitle)).toBeVisible();
    await expect(page.getByText(updatedContent)).toBeVisible();

    await page.reload();

    await expect(page.getByText(updatedTitle)).toBeVisible();
    await expect(page.getByText(updatedContent)).toBeVisible();
  });

  test("should delete a note", async ({ page }) => {
    await page.goto("/notes");

    const note = createUniqueNote();

    await createNote(page, note);

    await expect(page.getByText(note.title)).toBeVisible();

    const row = page.locator("tr").filter({
      hasText: note.title,
    });

    page.once("dialog", (dialog) => dialog.accept());

    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/notes/") &&
        response.request().method() === "DELETE",
    );

    await row.locator("button[aria-label]").nth(1).click();

    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(200);

    await expect(page.getByText(note.title)).toHaveCount(0);
  });
});
