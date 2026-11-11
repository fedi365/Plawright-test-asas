import { test, expect, Page } from '@playwright/test';
import { dumpPage } from '../helpers/dumpPage';
import { BASE_URL, EMAIL, PASSWORD } from '../helpers/config';

async function fillText(page: Page, label: string, value: string) {
    await page.getByRole('textbox', { name: new RegExp(`^${label}`) }).fill(value);
}

// option omise = première option de la liste
async function selectCombo(page: Page, label: string, option?: string | RegExp) {
    await page.getByRole('combobox', { name: new RegExp(`^${label}`) }).click();
    const options = page.getByRole('option');
    await options.first().waitFor();
    await (option ? options.filter({ hasText: option }).first() : options.first()).click();
}

// ouvre la liste, tape, clique l'option (marche pour Policy)
async function fillCombo(page: Page, label: string, value: string) {
    const combo = page.getByRole('combobox', { name: new RegExp(`^${label}`) });
    await combo.click();
    await combo.pressSequentially(value, { delay: 80 });
    await page.getByRole('option').filter({ hasText: value }).first().click({ timeout: 5000 });
    await expect(combo, `${label} est vide`).not.toHaveValue('');
}

// fill + Enter, avec attente du filtrage serveur, vérification et nouvelle tentative
async function fillComboEnter(page: Page, label: string, value: string) {
    const combo = page.getByRole('combobox', { name: new RegExp(`^${label}`) });
    await expect(async () => {
        await combo.fill(value);
        await page.waitForTimeout(600);               // laisse le serveur filtrer la liste
        await combo.press('Enter');
        await expect(combo).toHaveValue(new RegExp(value, 'i'), { timeout: 1500 });
    }, `${label} : "${value}" n'a pas été sélectionné`).toPass({ timeout: 15_000 });
}

test('créer un membre', async ({ page }) => {
    test.setTimeout(90_000);

    // 1. Login
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input:not([type="password"]):visible').first().fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole('button', { name: /Sign In|Se connecter/ }).first().click();
    await page.waitForURL('**/dashboard');

    // 2. Members
    await page.getByRole('link', { name: 'Members', exact: true }).click();
    await page.waitForURL('**/globalMembers');
    await expect(page.locator('vaadin-grid').first()).toBeVisible();
    await page.waitForLoadState('networkidle');

    // 3. Données uniques
    const suffix = String(Date.now()).slice(-6);
    const code = `0001${suffix}`;
    const lastName = `E2E${suffix}`;

    // 4. Formulaire
    await selectCombo(page, 'Client', 'ASR company');
    await fillText(page, 'First Name', 'Test');
    await fillText(page, 'Last Name', lastName);
    await fillText(page, 'Arabic First Name', 'اختبار');
    await fillText(page, 'Arabic Last Name', 'اختبار');
    await selectCombo(page, 'Civility');

    const dob = page.getByRole('textbox', { name: /^Date of Birth/ });
    await dob.fill('01/15/1990');
    await dob.press('Enter');

    await selectCombo(page, 'Sex');
    await selectCombo(page, 'Status');
    await fillText(page, 'Insured Code', code);
    await fillText(page, 'Card Number', code);
    await fillCombo(page, 'Policy', 'md-test-00000001');
    await fillText(page, 'Family Limit Amount', '5000');
    await fillText(page, 'Individual Limit Amount', '500');

    await fillComboEnter(page, 'Payment Currency', 'TND');

    // DEBUG (à retirer) : affiche les banques proposées pour connaître le vrai nom
    const bank = page.getByRole('combobox', { name: /^BANK/ });
    await bank.click();
    await page.waitForTimeout(1500);
    console.log('Banques :', await page.getByRole('option').allInnerTexts());
    await page.keyboard.press('Escape');

    await fillComboEnter(page, 'BANK', 'Default Bank');

    // 5. Sauvegarde
    const save = page.getByRole('button', { name: 'Save' }).first();
    await expect(save).toBeEnabled();
    await save.click();

    // Vérification 1 : la notification
    const alert = page.getByRole('alert').first();
    await expect(alert).toBeVisible();
    console.log('Notification :', await alert.innerText());
    await dumpPage(page, 'apres-save');
    await expect(alert).not.toContainText(/required|obligatoire/i);

    await page.reload();
    await expect(page.locator('vaadin-grid').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('Filter').nth(1).fill(lastName);
});