import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport & Touch Responsive UX (TS-10)', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12/13/14

  test('should render mobile-optimized tree canvas and bottom drawer preview', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

    // Assert mobile header elements and zero horizontal overflow (PRO-9)
    await expect(page.getByText('Smith Family')).toBeVisible();
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    // Click on Robert Smith node on canvas
    await page.getByText('Robert Smith').first().click();

    // Assert MobilePersonPreview bottom card is visible
    const mobileDrawer = page.locator('.sm\\:hidden.fixed.bottom-3');
    await expect(mobileDrawer).toBeVisible({ timeout: 5000 });
    await expect(mobileDrawer.getByText('Robert Smith')).toBeVisible();

    // Click "Full Details" in mobile drawer to open full PersonDetailPanel
    const fullDetailsBtn = mobileDrawer.getByRole('button', { name: /Full Details/i });
    await expect(fullDetailsBtn).toBeVisible();
    await fullDetailsBtn.click();
    await expect(page.getByRole('heading', { name: /Robert Smith/i })).toBeVisible();
  });

  test('should toggle mobile spotlight search modal', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });
    await expect(page.getByText('Smith Family')).toBeVisible();

    // Click Search icon button in header
    const searchBtn = page.getByTitle(/Search relatives/i);
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    // Assert Spotlight search dialog opens with Jump to relative placeholder
    const searchInput = page.getByPlaceholder(/Jump to relative/i);
    await expect(searchInput).toBeVisible();

    // Search for "Emily"
    await searchInput.fill('Emily');
    await expect(page.getByText('Emily Smith')).toBeVisible();
  });
});
