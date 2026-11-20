import { test, expect } from "@playwright/test";

test.describe("Memberships E2E", () => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  // Existing user who is not a member of Organization A.
  const testUserId = "users:4jbeu1d5rld4h6krp1at";
  const testUserEmail = "fiiw1972@gmail.com";

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

  test("should load invitations and display invitation list", async ({
    page,
  }) => {
    const invitationsResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());

      return (
        url.origin === "http://localhost:8000" &&
        url.pathname === "/invitations/" &&
        response.request().method() === "GET"
      );
    });

    await page.goto("/members");

    const invitationsResponse = await invitationsResponsePromise;

    expect([200, 304]).toContain(invitationsResponse.status());

    // Read invitation data from the API when a response body is available.
    // A 304 response means the browser uses its cached data.
    if (invitationsResponse.status() === 200) {
      const invitationData = await invitationsResponse.json();

      expect(invitationData).toHaveProperty("items");
      expect(invitationData).toHaveProperty("total");
      expect(Array.isArray(invitationData.items)).toBe(true);

      const invitationsList = page
        .locator("div.divide-y.divide-slate-100")
        .nth(1);

      const invitationRows = invitationsList.locator(
        ":scope > div.flex.flex-col.gap-4.p-5",
      );

      await expect(invitationRows).toHaveCount(invitationData.items.length);

      const statusLabels: Record<string, string> = {
        PENDING: "รอตอบรับ",
        ACCEPTED: "ตอบรับแล้ว",
        REVOKED: "ยกเลิกแล้ว",
        EXPIRED: "หมดอายุ",
      };

      for (const [index, invitation] of invitationData.items.entries()) {
        const invitationRow = invitationRows.nth(index);

        await expect(invitationRow).toBeVisible();
        await expect(invitationRow).toContainText(invitation.email);
        await expect(invitationRow).toContainText(
          statusLabels[invitation.status] ?? invitation.status,
        );

        if (invitation.status !== "PENDING") {
          await expect(invitationRow.locator("button")).toHaveCount(0);
        }
      }
    } else {
      // With 304, verify that the cached invitation list is rendered.
      await expect(
        page.locator("div.divide-y.divide-slate-100").nth(1),
      ).toBeVisible();
    }
  });

  test("should create, update, reload and delete a member", async ({
    page,
  }) => {
    await page.goto("/members");

    // Scope locator to the members list, not the invitations list.
    const membersList = page.locator("div.divide-y.divide-slate-100").first();

    const getTestMemberRow = () =>
      membersList
        .locator(":scope > div.flex.flex-col.gap-4.p-5")
        .filter({ hasText: testUserEmail });

    // Create member.
    await page.getByRole("button", { name: /เพิ่มสมาชิก/ }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.locator('input[name="user_id"]').fill(testUserId);
    await dialog.locator("#new-member-role").selectOption("SALES");

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/memberships/") &&
        response.request().method() === "POST",
    );

    await dialog.locator('button[type="submit"]').click();

    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(201);

    await expect(dialog).toHaveCount(0);

    // Verify created member.
    const memberRow = getTestMemberRow();

    await expect(memberRow).toHaveCount(1);
    await expect(memberRow).toBeVisible();

    // Update member role from SALES to MANAGER.
    await memberRow.locator("select[aria-label]").selectOption("MANAGER");

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/memberships/") &&
        response.request().method() === "PATCH",
    );

    await memberRow.getByRole("button", { name: "บันทึก Role" }).click();

    const updateResponse = await updateResponsePromise;
    expect(updateResponse.status()).toBe(200);

    // Reload and verify role persistence.
    await page.reload();

    const reloadedMemberRow = getTestMemberRow();

    await expect(reloadedMemberRow).toHaveCount(1);
    await expect(reloadedMemberRow.locator("select[aria-label]")).toHaveValue(
      "MANAGER",
    );

    // Delete test member.
    page.once("dialog", (browserDialog) => browserDialog.accept());

    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/memberships/") &&
        response.request().method() === "DELETE",
    );

    await reloadedMemberRow.getByRole("button", { name: "นำออก" }).click();

    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(200);

    await expect(getTestMemberRow()).toHaveCount(0);
  });

  test("should open invitation form and display role options", async ({
    page,
  }) => {
    await page.goto("/members");

    await page.getByRole("button", { name: /เชิญสมาชิก/ }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const emailInput = dialog.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");

    const roleSelect = dialog.locator("#invite-member-role");
    await expect(roleSelect).toBeVisible();

    // Verify available roles without submitting the invitation.
    const roleValues = await roleSelect
      .locator("option")
      .evaluateAll((options) =>
        options.map((option) => (option as HTMLOptionElement).value),
      );

    expect(roleValues).toContain("SALES");
    expect(roleValues).toContain("MANAGER");
    expect(roleValues).toContain("ADMIN");

    await expect(
      dialog.getByRole("button", { name: /ส่งคำเชิญ/ }),
    ).toBeVisible();

    // Close without sending.
    await dialog.getByRole("button", { name: /ยกเลิก/ }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("should prevent invitation submission with empty email", async ({
    page,
  }) => {
    await page.goto("/members");

    await page.getByRole("button", { name: /เชิญสมาชิก/ }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const emailInput = dialog.locator('input[name="email"]');

    await expect(emailInput).toHaveValue("");

    // Browser native validation should prevent form submission.
    await expect(emailInput).toHaveAttribute("required", "");

    const invitationPostPromise = page
      .waitForResponse(
        (response) =>
          response.url().includes("/invitations") &&
          response.request().method() === "POST",
        { timeout: 2000 },
      )
      .catch(() => null);

    await dialog.getByRole("button", { name: /ส่งคำเชิญ/ }).click();

    const invitationResponse = await invitationPostPromise;
    expect(invitationResponse).toBeNull();

    await expect(dialog).toBeVisible();
  });

  test("should cancel invitation deletion without sending revoke request", async ({
    page,
  }) => {
    const invitationEmail = "pending-e2e@example.com";

    // Mock invitation list with one PENDING invitation.
    await page.route("**/invitations/", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "invitations:e2e-pending-invitation",
              email: invitationEmail,
              role: "SALES",
              status: "PENDING",
              expires_at: "2026-12-01T00:00:00Z",
              created_at: "2026-11-19T00:00:00Z",
              accepted_at: null,
            },
          ],
          total: 1,
        }),
      });
    });

    let revokeRequestCount = 0;

    page.on("request", (request) => {
      if (
        request.url().includes("/invitations/") &&
        request.method() === "POST"
      ) {
        revokeRequestCount++;
      }
    });

    await page.goto("/members");

    const invitationsList = page
      .locator("div.divide-y.divide-slate-100")
      .nth(1);

    const invitationRow = invitationsList
      .locator(":scope > div.flex.flex-col.gap-4.p-5")
      .filter({ hasText: invitationEmail });

    await expect(invitationRow).toBeVisible();

    // Cancel the browser confirmation dialog.
    page.once("dialog", (dialog) => dialog.dismiss());

    await invitationRow.getByRole("button", { name: "ยกเลิกคำเชิญ" }).click();

    // Invitation must remain visible and no revoke request is sent.
    await expect(invitationRow).toBeVisible();
    expect(revokeRequestCount).toBe(0);
  });
});
