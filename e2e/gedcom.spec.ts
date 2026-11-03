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

    // Load Sample GEDCOM and verify parsed individuals & relationships (PRO-16, PRO-17)
    const sampleBtn = page.getByRole('button', { name: /Load Sample GEDCOM/i });
    await expect(sampleBtn).toBeVisible();
    await sampleBtn.click();

    await expect(page.getByText('sample-3-gen-lineage.ged')).toBeVisible();
    await expect(page.getByTestId('gedcom-individual-count')).toHaveText('10');
    await expect(page.getByRole('button', { name: /Complete Import/i })).toBeEnabled();
  });
});
