import { expect, test } from "@playwright/test";

const validationToken = "petnido-local-e2e-token";

test("real profile settings render and remain operable at required viewport", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const mobile = testInfo.project.name === "mobile-chromium";
  await page.setViewportSize(
    mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
  );

  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("ClientFetchError: Failed to fetch.")) consoleErrors.push(message.text());
  });
  await page.route("https://res.cloudinary.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  });

  await page.goto(
    `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`,
  );
  await expect(page.getByText('{"ok":true}', { exact: true })).toBeVisible();
  const reset = await page.request.post(
    `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`,
    { data: { action: "resetProfileFixture" } },
  );
  expect(reset.ok()).toBeTruthy();
  const secondLocationResponse = await page.request.post(
    "/api/trpc/savedLocation.create?batch=1",
    {
      data: {
        "0": {
          label: null,
          regionLabel: "Shibuya, Tokyo",
          lat: 35.6595,
          lon: 139.7005,
          displayPrecision: "MAP_POINT",
          makeDefault: false,
        },
      },
    },
  );
  expect(secondLocationResponse.ok()).toBeTruthy();
  const emailMutationResponse = await page.request.post(
    "/api/trpc/profile.requestEmailChange?batch=1",
    {
      data: {
        "0": { json: { email: "profile-e2e@petnido.invalid" } },
      },
    },
  );
  expect(emailMutationResponse.headers()["content-type"]).toContain(
    "application/json",
  );
  await expect(emailMutationResponse.json()).resolves.toMatchObject([
    { error: { data: { httpStatus: 400 } } },
  ]);
  await page.goto("/dashboard/settings");
  await expect(page).toHaveURL(/\/dashboard\/settings$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Settings", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Account & profiles", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText(
      "Manage your personal profile, pets, default publishing locations, and notifications.",
      { exact: true },
    ),
  ).toHaveCount(0);
  if (!mobile) {
    const shellBox = await page.locator("[data-dashboard-shell]").boundingBox();
    const panelBox = await page.locator("[data-dashboard-panel]").boundingBox();
    expect(shellBox).not.toBeNull();
    expect(panelBox).not.toBeNull();
    expect(panelBox!.y - shellBox!.y).toBeGreaterThanOrEqual(16);
    expect(shellBox!.y + shellBox!.height - panelBox!.y - panelBox!.height).toBeGreaterThanOrEqual(16);
  }
  await expect(page.getByRole("img", { name: "avatar" }).first()).toBeVisible({
    timeout: 15_000,
  });
  const accountSection = page.locator("#account");
  await expect(
    accountSection.getByRole("heading", { name: "Personal profile", exact: true }),
  ).toHaveCount(0);
  await expect(
    accountSection.getByRole("button", { name: "Change image" }),
  ).toBeVisible();
  await expect(accountSection.getByLabel("Email")).toHaveValue(
    "profile-e2e@petnido.invalid",
  );
  await expect(
    accountSection.getByText("Verified", { exact: true }),
  ).toBeVisible();
  await expect(
    accountSection.getByText(
      "Changing your email also changes the address used to sign in and receive notifications. The new address must be verified first.",
      { exact: true },
    ),
  ).toHaveCount(0);
  const personalProfileLayout = await accountSection.evaluate((section) => {
    const rows = Array.from(
      section.querySelectorAll<HTMLElement>("[data-profile-row]"),
    );
    const nicknameInput = section.querySelector<HTMLInputElement>(
      "#profile-nickname",
    );
    const emailInput = section.querySelector<HTMLInputElement>("#profile-email");
    const verified = Array.from(section.querySelectorAll<HTMLElement>("span")).find(
      (element) => element.textContent?.trim() === "Verified",
    );
    const emailRect = emailInput?.getBoundingClientRect();
    const verifiedRect = verified?.getBoundingClientRect();
    const nicknameLabel = section
      .querySelector("label[for='profile-nickname']")
      ?.getBoundingClientRect();
    const nicknameRect = nicknameInput?.getBoundingClientRect();
    return {
      borderWidths: rows.map(
        (row) => getComputedStyle(row).borderBottomWidth,
      ),
      labelWidth: rows[0]?.firstElementChild?.getBoundingClientRect().width ?? 0,
      nicknameWidth: nicknameInput?.getBoundingClientRect().width ?? 0,
      emailWidth: emailRect?.width ?? 0,
      verifiedInsideEmail:
        Boolean(emailRect && verifiedRect) &&
        verifiedRect!.left >= emailRect!.left &&
        verifiedRect!.right <= emailRect!.right,
      nicknameCenterDifference:
        nicknameLabel && nicknameRect
          ? Math.abs(
              nicknameLabel.top + nicknameLabel.height / 2 -
                (nicknameRect.top + nicknameRect.height / 2),
            )
          : null,
    };
  });
  expect(personalProfileLayout.borderWidths).toEqual([
    "0px",
    "0px",
    "0px",
    "0px",
  ]);
  expect(personalProfileLayout.verifiedInsideEmail).toBeTruthy();
  await expect(
    accountSection.getByRole("button", { name: "Save nickname" }),
  ).toHaveCount(0);
  if (!mobile) {
    expect(personalProfileLayout.labelWidth).toBeLessThanOrEqual(120);
    expect(personalProfileLayout.nicknameWidth).toBeLessThanOrEqual(460);
    expect(personalProfileLayout.emailWidth).toBeLessThanOrEqual(460);
    expect(personalProfileLayout.nicknameCenterDifference).not.toBeNull();
    expect(personalProfileLayout.nicknameCenterDifference!).toBeLessThanOrEqual(1);
  }
  await accountSection.getByLabel("Email").fill("not-an-email");
  const invalidEmailMessage = accountSection.getByText(
    "Enter a valid email address before requesting a verification code.",
    { exact: true },
  );
  await expect(invalidEmailMessage).toBeVisible();
  await expect(invalidEmailMessage).toHaveCSS("position", "absolute");
  await expect(
    accountSection.getByRole("button", { name: "Send verification code" }),
  ).toBeDisabled();
  await accountSection.getByLabel("Email").fill("replacement@example.com");
  const sendCodeButton = accountSection.getByRole("button", {
    name: "Send verification code",
  });
  await expect(sendCodeButton).toBeEnabled();
  await page.route(
    (url) => url.pathname.includes("/api/trpc/profile.requestEmailChange"),
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            result: {
              data: {
                expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                cooldownSeconds: 60,
              },
            },
          },
        ]),
      });
    },
  );
  if (!mobile) {
    const actionPlacement = await accountSection.evaluate((section) => {
      const input = section.querySelector("#profile-email")?.getBoundingClientRect();
      const button = Array.from(section.querySelectorAll("button")).find(
        (element) => element.textContent?.trim() === "Send verification code",
      )?.getBoundingClientRect();
      return input && button ? button.left >= input.right : false;
    });
    expect(actionPlacement).toBeTruthy();
  }
  await sendCodeButton.click();
  const codeInputs = accountSection.locator(
    "input[aria-label^='Verification code digit']",
  );
  await expect(codeInputs).toHaveCount(6);
  await expect(
    accountSection.getByText(
      "Enter the six-digit code sent to replacement@example.com. Your email will not change until it is confirmed.",
      { exact: true },
    ),
  ).toHaveCount(0);
  const codeRow = codeInputs.first().locator("..");
  await expect(codeRow).toHaveCSS("border-top-width", "0px");
  await expect(codeRow).toHaveCSS("border-right-width", "0px");
  await expect(codeRow).toHaveCSS("border-bottom-width", "0px");
  await expect(codeRow).toHaveCSS("border-left-width", "0px");
  const resendButton = accountSection.getByRole("button", {
    name: /^Resend code \(\d+s\)$/,
  });
  await expect(resendButton).toBeDisabled();
  const initialCountdown = Number(
    (await resendButton.textContent())?.match(/\((\d+)s\)/)?.[1],
  );
  await page.waitForTimeout(1_100);
  const nextCountdown = Number(
    (await resendButton.textContent())?.match(/\((\d+)s\)/)?.[1],
  );
  expect(nextCountdown).toBeLessThan(initialCountdown);
  if (!mobile) {
    const verificationAlignment = await accountSection.evaluate((section) => {
      const label = section
        .querySelector("label[for='profile-email']")
        ?.getBoundingClientRect();
      const emailInput = section
        .querySelector("#profile-email")
        ?.getBoundingClientRect();
      const firstCodeInput = section
        .querySelector("input[aria-label='Verification code digit 1']")
        ?.getBoundingClientRect();
      const buttons = Array.from(section.querySelectorAll("button"));
      const resend = buttons
        .find((button) => button.textContent?.startsWith("Resend code"))
        ?.getBoundingClientRect();
      const confirm = buttons
        .find((button) => button.textContent?.trim() === "Confirm email")
        ?.getBoundingClientRect();
      return {
        labelCenterDifference:
          label && emailInput
            ? Math.abs(
                label.top + label.height / 2 -
                  (emailInput.top + emailInput.height / 2),
              )
            : null,
        actionsAreRightOfCode:
          Boolean(firstCodeInput && resend && confirm) &&
          resend!.left > firstCodeInput!.right &&
          confirm!.left > resend!.left,
      };
    });
    expect(verificationAlignment.labelCenterDifference).not.toBeNull();
    expect(verificationAlignment.labelCenterDifference!).toBeLessThanOrEqual(1);
    expect(verificationAlignment.actionsAreRightOfCode).toBeTruthy();
  }
  await accountSection
    .getByLabel("Email")
    .fill("profile-e2e@petnido.invalid");
  await expect(
    accountSection.getByRole("heading", {
      level: 3,
      name: "Default address and used locations",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(accountSection.getByLabel("Display language")).toHaveCount(0);
  await expect(accountSection.getByLabel("Time zone")).toHaveCount(0);
  await expect(accountSection.getByLabel("Introduction")).toHaveCount(0);
  await expect(
    accountSection.getByText("Use an external image URL", { exact: true }),
  ).toHaveCount(0);
  await expect(
    accountSection.getByRole("button", { name: "Remove", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("footer")).toHaveCount(0);
  const shellAlignment = await page.evaluate(() => {
    const header = document.querySelector("header .site-shell");
    const dashboard = document.querySelector("[data-dashboard-shell]");
    if (!header || !dashboard) return null;
    const headerRect = header.getBoundingClientRect();
    const dashboardRect = dashboard.getBoundingClientRect();
    return {
      leftDifference: Math.abs(headerRect.left - dashboardRect.left),
      rightDifference: Math.abs(headerRect.right - dashboardRect.right),
    };
  });
  expect(shellAlignment).not.toBeNull();
  expect(shellAlignment?.leftDifference).toBeLessThanOrEqual(1);
  expect(shellAlignment?.rightDifference).toBeLessThanOrEqual(1);
  const addressRow = accountSection.locator('[data-profile-row="address"]');
  await expect(addressRow.getByText("Address", { exact: true })).toBeVisible();
  await expect(
    addressRow.getByRole("button", { name: "Change address", exact: true }),
  ).toHaveCount(0);
  const addressTrigger = addressRow.getByRole("button", {
    name: /Chiyoda, Tokyo/,
  });
  await expect(addressTrigger).toBeVisible();
  await addressTrigger.click();
  const addressDropdown = addressRow.locator("[data-address-dropdown]");
  await expect(addressDropdown).toBeVisible();
  const addressItems = addressDropdown.locator("[data-address-item]");
  await expect(addressItems).toHaveCount(2);
  await expect(addressItems.first()).toHaveAttribute("data-default", "true");
  await expect(addressItems.first().getByText("Chiyoda, Tokyo", { exact: true })).toBeVisible();
  await expect(addressItems.first().getByText("Default", { exact: true })).toBeVisible();
  await expect(addressItems.first().getByRole("button", { name: /Edit address/ })).toBeVisible();
  await expect(addressItems.first().getByRole("button", { name: /Delete address/ })).toBeVisible();
  await expect(addressDropdown.locator("[data-address-add]")).toBeVisible();
  expect(
    await addressDropdown.evaluate(
      (list) => list.lastElementChild?.hasAttribute("data-address-add") ?? false,
    ),
  ).toBe(true);

  let nativeDeleteDialogSeen = false;
  page.once("dialog", async (dialog) => {
    nativeDeleteDialogSeen = true;
    await dialog.dismiss();
  });
  await addressItems.first().getByRole("button", { name: /Delete address/ }).click();
  const globalConfirm = page.locator("[data-global-confirm]");
  await expect(globalConfirm).toBeVisible();
  await expect(
    globalConfirm.getByRole("heading", { name: "Delete address", exact: true }),
  ).toBeVisible();
  await expect(
    globalConfirm.getByText("Are you sure you want to delete this address?", {
      exact: true,
    }),
  ).toBeVisible();
  const confirmCenterDifference = await globalConfirm.evaluate((dialog) => {
    const rect = dialog.getBoundingClientRect();
    return {
      x: Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2),
      y: Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2),
    };
  });
  expect(confirmCenterDifference.x).toBeLessThanOrEqual(1);
  expect(confirmCenterDifference.y).toBeLessThanOrEqual(1);
  expect(nativeDeleteDialogSeen).toBe(false);
  await expect(
    globalConfirm.getByRole("button", { name: "Delete", exact: true }),
  ).toBeVisible();
  await globalConfirm.getByRole("button", { name: "Cancel" }).click();
  await expect(globalConfirm).toHaveCount(0);

  await addressTrigger.click();
  await addressItems.first().getByRole("button", { name: /Edit address/ }).click();
  const addressModal = page.locator("[data-address-modal]");
  await expect(addressModal).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Edit address" })).toBeVisible();
  await addressModal
    .locator("[data-address-backdrop]")
    .click({ position: { x: 5, y: 5 } });
  await expect(addressModal).toBeVisible();
  await page
    .getByRole("dialog", { name: "Edit address" })
    .getByRole("button", { name: "Close editor" })
    .click();
  await expect(addressModal).toHaveCount(0);

  await addressTrigger.click();
  await addressItems
    .filter({ hasText: "Shibuya, Tokyo" })
    .locator("[data-address-select]")
    .click();
  await expect(addressDropdown).toHaveCount(0);
  await expect(
    addressRow.getByRole("button", { name: /Shibuya, Tokyo/ }),
  ).toBeVisible();
  await addressRow.getByRole("button", { name: /Shibuya, Tokyo/ }).click();
  await expect(addressItems.first().getByText("Shibuya, Tokyo", { exact: true })).toBeVisible();
  await expect(addressItems.first()).toHaveAttribute("data-default", "true");
  await expect(addressItems.first().getByText("Default", { exact: true })).toBeVisible();
  await addressDropdown
    .getByRole("menuitem", { name: "Add new address", exact: true })
    .click();
  await expect(addressModal).toBeVisible();
  await addressModal
    .locator("[data-address-backdrop]")
    .click({ position: { x: 5, y: 5 } });
  await expect(addressModal).toBeVisible();
  const locationEditor = addressModal
    .getByRole("heading", { name: "Add new address", exact: true })
    .locator("xpath=ancestor::form");
  await expect(locationEditor).toHaveCSS("border-top-width", "0px");
  await expect(
    locationEditor.getByRole("button", { name: "Close editor" }),
  ).toBeVisible();
  await expect(
    locationEditor.getByText("Search for an address", { exact: true }),
  ).toBeVisible();
  await expect(
    locationEditor.getByRole("combobox", {
      name: "Choose an approximate map location",
    }),
  ).toBeVisible();
  await expect(
    locationEditor.getByText(/select a point directly on the map/i),
  ).toBeVisible();
  await expect(
    locationEditor.getByRole("checkbox", {
      name: "Make this the default location",
    }),
  ).toBeChecked();
  await expect(locationEditor.locator("[data-location-map]")).toBeVisible();
  await expect(locationEditor.locator("[data-location-map]")).toHaveCSS(
    "height",
    "288px",
  );
  await expect(locationEditor.locator("[data-location-map]")).toHaveCSS(
    "min-height",
    "288px",
  );
  await expect(
    locationEditor.locator("[data-location-status-slot]"),
  ).toHaveCSS("height", "20px");
  await expect(page.getByRole("dialog", { name: "Add new address" })).toHaveCSS(
    "scrollbar-gutter",
    "stable",
  );
  await expect(
    locationEditor.getByRole("button", {
      name: "Center map on selected location",
    }),
  ).toBeVisible();
  await expect(locationEditor.locator(".maplibregl-ctrl-compass")).toHaveCount(
    0,
  );
  await expect(
    locationEditor.getByText("Choose an approximate map location", {
      exact: true,
    }),
  ).toHaveCount(0);
  if (!mobile) {
    const controlLayout = await locationEditor.evaluate((form) => {
      const input = form.querySelector('[role="combobox"]');
      const inputLabel = form.querySelector(
        'label[for="address-location-search"]',
      );
      const map = form.querySelector("[data-location-map]");
      const save = Array.from(form.querySelectorAll("button")).find(
        (button) => button.textContent?.trim() === "Save",
      );
      const checkbox = form.querySelector('input[type="checkbox"]');
      if (!input || !inputLabel || !map || !save || !checkbox) return null;
      const formRect = form.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();
      const inputLabelRect = inputLabel.getBoundingClientRect();
      const mapRect = map.getBoundingClientRect();
      const saveRect = save.getBoundingClientRect();
      const checkboxRect = checkbox.getBoundingClientRect();
      return {
        labelAboveInput: inputLabelRect.bottom <= inputRect.top,
        saveBelowMap: saveRect.top > mapRect.bottom,
        saveRightDifference: Math.abs(formRect.right - saveRect.right),
        saveLeft: saveRect.left,
        checkboxLeft: checkboxRect.left,
      };
    });
    expect(controlLayout).not.toBeNull();
    expect(controlLayout!.labelAboveInput).toBeTruthy();
    expect(controlLayout!.saveBelowMap).toBeTruthy();
    expect(controlLayout!.saveRightDifference).toBeLessThanOrEqual(1);
    expect(controlLayout!.checkboxLeft).toBeLessThan(controlLayout!.saveLeft);
  }
  const mapStyleButtons = [
    "Standard",
    "Detailed",
    "Simple",
    "Monochrome",
    "Satellite",
  ];
  for (const name of mapStyleButtons) {
    await expect(
      locationEditor.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("type", "button");
  }
  await locationEditor
    .getByRole("button", { name: "Detailed", exact: true })
    .click();
  await expect(
    locationEditor.getByRole("heading", {
      name: "Add new address",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    locationEditor.getByRole("button", { name: "標準", exact: true }),
  ).toHaveCount(0);
  let searchRequestLanguage: string | null = null;
  await page.route(
    (url) => url.pathname.includes("/api/trpc/location.search"),
    async (route) => {
      const encodedInput = new URL(route.request().url()).searchParams.get(
        "input",
      );
      if (encodedInput) {
        const input = JSON.parse(encodedInput) as Record<
          string,
          { language?: string; json?: { language?: string } }
        >;
        const requestInput = input["0"];
        searchRequestLanguage =
          requestInput?.language ?? requestInput?.json?.language ?? null;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            result: {
              data: [
                {
                  id: "node-1",
                  countryCode: "JP",
                  label: "Tokyo Station",
                  subLabel: "Chiyoda, Tokyo, Japan",
                  lat: 35.681236,
                  lon: 139.767125,
                  type: "station",
                },
              ],
            },
          },
        ]),
      });
    },
  );
  const locationSearch = locationEditor.getByRole("combobox", {
    name: "Choose an approximate map location",
  });
  await locationSearch.fill("Tokyo");
  await expect(
    locationEditor.getByRole("option", { name: /Tokyo Station/ }),
  ).toBeVisible();
  expect(searchRequestLanguage).toBe("en");
  await locationEditor.getByRole("option", { name: /Tokyo Station/ }).click();
  await expect(locationSearch).toHaveValue("Tokyo Station");
  await expect(locationEditor.getByLabel("Label (optional)")).toHaveCount(0);
  await expect(
    locationEditor.getByLabel("Broad area label (optional)"),
  ).toHaveCount(0);
  await expect(locationEditor.getByLabel("Latitude")).toHaveCount(0);
  await expect(locationEditor.getByLabel("Longitude")).toHaveCount(0);
  await expect(locationEditor.getByLabel("Display precision")).toHaveCount(0);
  await expect(
    accountSection.getByText(/35\.681236|139\.767125/),
  ).toHaveCount(0);
  await locationEditor.getByRole("button", { name: "Close editor" }).click();
  for (let remaining = 2; remaining > 0; remaining -= 1) {
    await addressRow.locator('button[aria-haspopup="menu"]').click();
    const currentItems = addressRow.locator(
      "[data-address-dropdown] [data-address-item]",
    );
    await expect(currentItems).toHaveCount(remaining);
    await currentItems
      .first()
      .getByRole("button", { name: /Delete address/ })
      .click();
    await expect(globalConfirm).toBeVisible();
    await globalConfirm
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(globalConfirm).toHaveCount(0);
  }
  await expect(addressRow.locator("[data-empty-address-field]")).toHaveText(
    "No address added",
  );
  await expect(
    addressRow.getByRole("button", { name: "Add new address", exact: true }),
  ).toBeVisible();
  await expect(addressRow.locator('button[aria-haspopup="menu"]')).toHaveCount(
    0,
  );
  await expect(addressRow.locator("[data-address-dropdown]")).toHaveCount(0);
  await expect(page.getByLabel("Experience and introduction")).toHaveCount(0);

  const settingsTabs = page.getByRole("navigation", { name: "Settings" });
  await settingsTabs.getByRole("link", { name: "Pet profiles", exact: true }).click();
  await expect(page).toHaveURL(/#pets$/);
  await expect(page.locator("#account")).toHaveCount(0);
  await expect(
    page.locator("#pets").getByRole("heading", { name: "Pet profiles", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Mochi", { exact: true })).toBeVisible();
  await expect(page.getByText("You currently have 2 pets", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add a pet", exact: true }).click();
  const petModal = page.locator("[data-pet-modal]");
  const petDialog = page.getByRole("dialog", { name: "Add a pet" });
  await expect(petModal).toBeVisible();
  await expect(petDialog).toBeVisible();
  await expect(petDialog).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(
    petDialog.getByRole("button", { name: "Cancel", exact: true }),
  ).toHaveCount(1);
  const savePetButton = petDialog.getByRole("button", {
    name: "Save",
    exact: true,
  });
  await expect(savePetButton).toBeEnabled();
  await savePetButton.click();
  await expect(petDialog.getByText("Name is required.", { exact: true })).toBeVisible();
  await expect(
    petDialog.getByText("Pet type is required.", { exact: true }),
  ).toBeVisible();
  await petModal
    .locator("[data-pet-backdrop]")
    .click({ position: { x: 5, y: 5 } });
  await expect(petModal).toBeVisible();
  await petDialog.getByRole("button", { name: "Close editor" }).click();
  await expect(petModal).toHaveCount(0);

  await settingsTabs.getByRole("link", { name: "Preferences", exact: true }).click();
  await expect(page).toHaveURL(/#preferences$/);
  await expect(page.locator("#pets")).toHaveCount(0);
  await expect(
    page
      .locator("#preferences")
      .getByRole("heading", { name: "Preferences", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Email notifications", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Email notifications" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue("en");
  await expect(
    page.getByText(
      "This stays synchronized with the language switcher in the header.",
      { exact: true },
    ),
  ).toHaveCount(0);
  const languageSelectBox = await page
    .getByRole("combobox", { name: "Language" })
    .boundingBox();
  expect(languageSelectBox).not.toBeNull();
  expect(languageSelectBox!.width).toBeLessThanOrEqual(180);
  await expect(
    page.getByRole("switch", { name: "Accepting service requests" }),
  ).toBeVisible();

  const profileSectionLink = settingsTabs.getByRole("link", {
    name: "Personal profile",
    exact: true,
  });
  await profileSectionLink.click();
  await expect(page).toHaveURL(/#account$/);
  await expect(accountSection).toBeVisible();

  if (!mobile) {
    await accountSection.getByLabel("Nickname").fill("Updated Mika");
    const saveNicknameButton = accountSection.getByRole("button", {
      name: "Save nickname",
    });
    await expect(saveNicknameButton).toBeVisible();
    await saveNicknameButton.click();
    await expect(page.getByText("Nickname saved", { exact: true })).toBeVisible();
    await page.locator("header [role=button][aria-haspopup=menu]").click();
    await expect(page.getByText(/Updated Mika/)).toBeVisible();
  }

  await profileSectionLink.focus();
  await profileSectionLink.press("Enter");
  await expect(page).toHaveURL(/#account$/);

  await page.evaluate(() => {
    document.documentElement.style.setProperty("zoom", "2");
  });
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
  expect(consoleErrors).toEqual([]);

  await page.evaluate(() => {
    document.documentElement.style.removeProperty("zoom");
  });
  if (mobile) return;

  await page.goto("/dashboard/serviceprofile");
  await expect(page).toHaveURL(/\/dashboard\/serviceprofile$/);
  await expect(
    page.getByRole("heading", { level: 2, name: "Service profile", exact: true }).first(),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel("Experience and introduction")).toHaveValue(
    "Experienced with cats, rabbits, and medication routines.",
  );
  await expect(page.getByLabel("Default service location")).toHaveValue("");
  await expect(page.getByLabel("Common currency")).toHaveValue("JPY");
});
