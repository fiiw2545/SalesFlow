import { test, expect } from "@playwright/test";

function createUniqueContact() {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    name: `E2E Contact ${uniqueId}`,
    email: `e2e.${uniqueId}@example.com`,
    phone: "0812345678",
    age: 25,
    position: "E2E Tester",
  };
}

async function login(page: import("@playwright/test").Page) {
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

async function openCreateContactModal(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "เพิ่มผู้ติดต่อ" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  return dialog;
}

async function fillContactForm(
  dialog: import("@playwright/test").Locator,
  contact: ReturnType<typeof createUniqueContact>,
) {
  const textInputs = dialog.locator("input:not([type])");

  await expect(textInputs).toHaveCount(2);

  await textInputs.nth(0).fill(contact.name);
  await dialog.locator('input[type="email"]').fill(contact.email);
  await dialog.locator('input[type="tel"]').fill(contact.phone);
  await dialog.locator('input[type="number"]').fill(String(contact.age));
  await textInputs.nth(1).fill(contact.position);
}

async function getCreatedContactId(
  response: import("@playwright/test").Response,
) {
  const body = await response.json();
  const contact = Array.isArray(body.data) ? body.data[0] : body.data;

  expect(contact?.id?.id).toBeTruthy();

  return contact.id.id as string;
}

test.describe("Contacts E2E", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/contacts");
  });

  test("should load contacts page", async ({ page }) => {
    const contactsResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/contacts/") &&
        response.request().method() === "GET",
    );

    await page.reload();

    const contactsResponse = await contactsResponsePromise;

    expect([200, 304]).toContain(contactsResponse.status());
    await expect(
      page.getByRole("button", { name: "เพิ่มผู้ติดต่อ" }),
    ).toBeVisible();
  });

  test("should create a contact", async ({ page }) => {
    const contact = createUniqueContact();
    const dialog = await openCreateContactModal(page);

    await fillContactForm(dialog, contact);

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/contacts/") &&
        response.request().method() === "POST",
    );

    await dialog.locator('button[type="submit"]').click();

    const createResponse = await createResponsePromise;

    expect(createResponse.status()).toBe(201);

    await expect(page.getByText(contact.name)).toBeVisible();
  });

  test("should update a contact", async ({ page }) => {
    const contact = createUniqueContact();
    const dialog = await openCreateContactModal(page);

    await fillContactForm(dialog, contact);

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/contacts/") &&
        response.request().method() === "POST",
    );

    await dialog.locator('button[type="submit"]').click();

    const createResponse = await createResponsePromise;

    expect(createResponse.status()).toBe(201);

    const contactId = await getCreatedContactId(createResponse);

    await expect(page.getByText(contact.name)).toBeVisible();

    const editButton = page.getByRole("button", {
      name: new RegExp(`^แก้ไข ${contact.name}$`),
    });

    await editButton.click();

    const editDialog = page.getByRole("dialog");
    await expect(editDialog).toBeVisible();

    const updatedName = `${contact.name} Updated`;

    const editTextInputs = editDialog.locator("input:not([type])");

    await expect(editTextInputs).toHaveCount(2);
    await editTextInputs.nth(0).fill(updatedName);

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(contactId) &&
        response.request().method() === "PUT",
    );

    await editDialog.locator('button[type="submit"]').click();

    const updateResponse = await updateResponsePromise;

    expect(updateResponse.status()).toBe(200);

    await expect(page.getByText(updatedName)).toBeVisible();

    await page.reload();

    await expect(page.getByText(updatedName)).toBeVisible();
  });
});
