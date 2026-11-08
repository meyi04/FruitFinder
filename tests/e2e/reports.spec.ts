import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('downloads a PDF report with FruitFinder branding', async ({ page }) => {
  await page.goto('/');
  const downloadPromise = page.waitForEvent('download');
  await page.evaluate(async () => {
    const modulePath = '/src/utils/brandedReportPdf.ts';
    const { downloadBrandedReport } = await import(modulePath);
    await downloadBrandedReport({
      title: 'Test sales report',
      dateRange: 'Nov 1, 2026 – Nov 8, 2026',
      filename: 'fruitfinder-test-report.pdf',
      metrics: [{ label: 'Completed sales', value: 'PHP 150.00' }],
      sections: [{ title: 'Daily sales', columns: ['Date', 'Revenue'], rows: [['Nov 8, 2026', '150.00']] }],
    });
  });

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('fruitfinder-test-report.pdf');
  const path = await download.path();
  if (!path) throw new Error('The PDF download did not produce a file.');
  const pdfContents = await readFile(path);
  expect(pdfContents.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdfContents.toString('latin1')).toContain('FruitFinder');
  expect(pdfContents.toString('latin1')).toContain('/Subtype /Image');
});
