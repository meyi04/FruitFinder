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

test('offers FruitFinder-branded app icons for installation', async ({ page, request }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('FruitFinder');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');

  const manifestResponse = await request.get('/manifest.webmanifest');
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe('FruitFinder');
  expect(manifest.short_name).toBe('FruitFinder');
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: '/icons/fruitfinder-192.png', sizes: '192x192' }),
      expect.objectContaining({ src: '/icons/fruitfinder-512.png', sizes: '512x512' }),
      expect.objectContaining({
        src: '/icons/fruitfinder-maskable-512.png',
        sizes: '512x512',
        purpose: 'maskable',
      }),
    ]),
  );

  for (const iconPath of manifest.icons.map((icon: { src: string }) => icon.src)) {
    const iconResponse = await request.get(new URL(iconPath, page.url()).toString());
    expect(iconResponse.ok()).toBe(true);
    expect(iconResponse.headers()['content-type']).toContain('image/png');
    expect((await iconResponse.body()).subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
});
