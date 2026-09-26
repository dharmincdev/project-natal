import { test, expect } from '@playwright/test';

test.describe('GEDCOM Import & Interoperability', () => {
  test('should open Import GEDCOM modal from header toolbar', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

    // Click Import .GED button in toolbar
    const importBtn = page.getByRole('button', { name: /Import \.GED/i });
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    // Verify modal header and dropzone
    await expect(page.getByRole('heading', { name: /Import GEDCOM File/i })).toBeVisible();
    await expect(page.getByText(/Click to browse or drop your \.ged file here/i)).toBeVisible();
    await expect(page.getByText(/Supports GEDCOM 5\.5\.1 and 7\.0 standards/i)).toBeVisible();
  });
});
