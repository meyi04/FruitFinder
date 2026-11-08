import { expect, test } from '@playwright/test';

test('visits the sign-in page from the app root', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('ion-content')).toContainText('Fresh finds');
  await expect(page.getByRole('link', { name: 'Create an account' })).toBeVisible();
  await expect(page.locator('img[alt="FruitFinder"]')).toBeVisible();
  const passwordInput = page.locator('ion-input input').nth(1);
  await expect(passwordInput).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(passwordInput).toHaveAttribute('type', 'text');
  await expect(page.getByRole('button', { name: 'Hide password' })).toBeVisible();
});

test('keeps transaction pages inside the authenticated app', async ({ page }) => {
  await page.goto('/messages/example-conversation');
  await expect(page.locator('ion-content')).toContainText('Fresh finds');
  await expect(page).toHaveURL(/\/login\?redirect=/);
});

test('requires authentication before opening the admin dashboard', async ({ page }) => {
  await page.goto('/tabs/admin');
  await expect(page).toHaveURL(/\/login\?redirect=\/tabs\/admin/);
});
