import { test, expect } from '@playwright/test';

test.describe('Public Living Relative Privacy (SPEC.md §6.1)', () => {
  test('should redact living individuals on unauthenticated public /t/[slug] route', async ({ page }) => {
    await page.goto('/t/smith-family');

    // Wait for the tree canvas to render
    await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

    // Verify that living individuals show as "Living Relative"
    await expect(page.getByText('Living Relative').first()).toBeVisible();

    // Verify unredacted real names like "Robert Smith" are NOT exposed on public view
    await expect(page.getByText('Robert Smith')).not.toBeVisible();

    // PRO-12: Verify unified semantic theme palette (bg-background text-foreground) on /t/[slug]
    const shell = page.getByTestId('shared-tree-shell');
    await expect(shell).toBeVisible();
    await expect(shell).toHaveClass(/bg-background/);
  });
});
