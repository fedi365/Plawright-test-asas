import {test, expect, Page} from '@playwright/test';
import { dumpPage } from '../helpers/dumpPage';
import { BASE_URL,EMAIL,PASSWORD } from '../helpers/config';

test('aller à Members', async ({ page }) => {
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
  async function fillCombo(page: Page, label: string, value: string) {
    const combo = page.getByRole('combobox', { name: new RegExp(`^${label}`) });
    await combo.click();                                    // ouvre la liste
    await combo.pressSequentially(value, { delay: 80 });    // vraies frappes clavier
    await page.getByRole('option').filter({ hasText: value }).first().click({ timeout: 5000 });
    await expect(combo, `${label} est vide`).not.toHaveValue('');
  }
  await page.goto(`${BASE_URL}/login`);

  await page.locator('input:not([type="password"]):visible').first().fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /Sign In|Se connecter/ }).first().click();

  await page.waitForURL('**/dashboard');

  // Le login t'amène déjà sur le dashboard
  await page.goto(`${BASE_URL}/dashboard`);

  // Clic sur Members dans la sidebar
  await page.getByRole('link', { name: 'Members', exact: true }).click();
  await page.waitForURL('**/globalMembers');

  // Attendre que la grille soit affichée avant de prendre le snapshot
  await expect(page.locator('vaadin-grid')).toBeVisible();
  await page.waitForLoadState('networkidle');

  await dumpPage(page, 'members');
// 2. Aller à Members via la sidebar
  await page.getByRole('link', { name: 'Members', exact: true }).click();
  await page.waitForURL('**/globalMembers');

  await expect(page.locator('vaadin-grid').first()).toBeVisible();
  await page.waitForLoadState('networkidle');

  // 3. Données du test (uniques à chaque lancement)
  const suffix = String(Date.now()).slice(-6);
  const code = `0001${suffix}`;        // commence par 0001
  const lastName = `E2E${suffix}`;

  // 4. Remplir le formulaire
  await selectCombo(page, 'Client', 'ASR company');   // avant Policy (dépend probablement du client)
  await fillText(page, 'First Name', 'Test');
  await fillText(page, 'Last Name', lastName);
  await fillText(page, 'Arabic First Name', 'اختبار');
  await fillText(page, 'Arabic Last Name', 'اختبار');
  await selectCombo(page, 'Civility');
  await fillText(page, 'Date of Birth', '01/15/1990');
  await page.keyboard.press('Enter'); // format MM/JJ/AAAA, comme Start Date
  await selectCombo(page, 'Sex');
  await selectCombo(page, 'Status');
  await fillText(page, 'Insured Code', code);
  await fillText(page, 'Card Number', code);
  await page.getByRole('combobox', { name: /^Policy/ }).fill('md-test-00000001');
  await page.keyboard.press('Enter');
  await fillText(page, 'Family Limit Amount', '5000');
  await fillText(page, 'Individual Limit Amount', '500');
  await fillCombo(page, 'Payment Currency', 'TND');
  const currency = page.getByRole('combobox', { name: /^Payment Currency/ });
  console.log('Policy =', JSON.stringify(await page.getByRole('combobox', { name: /^Policy/ }).inputValue()));
  console.log('Devise =', JSON.stringify(await currency.inputValue()));
  await page.screenshot({ path: 'avant-devise.png' });
  await dumpPage(page, 'avant-devise');


  await page.getByRole('combobox', { name: /^BANK/ }).fill('Default Bank');
  await page.keyboard.press('Enter');

  // pour vérifier ce qui a été rempli

  // 5. Sauvegarder
  await page.getByRole('button', { name: 'Save' }).first().click();
  console.log(`Member ${lastName} with code ${code} has been created.`);
  await page.waitForTimeout(1500);

});