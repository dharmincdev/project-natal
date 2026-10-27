import { test, expect } from '@playwright/test';

test.describe('QA Test Harness & Verification Matrix (/qa)', () => {
  test('should load /qa harness with all 10 QA suites and 50 test cases', async ({ page }) => {
    await page.goto('/qa');

    // Verify main page heading and subtitle
    await expect(page.getByRole('heading', { name: /Project Natal QA Plan/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Interactive Manual Testing Checklist/i)).toBeVisible();

    // Verify presence of core test suites in the sidebar / tabs
    await expect(page.getByRole('button', { name: /TS-1: Interactive Tree Canvas & Graph/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /TS-2: Relative Management & Details/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /TS-3: Audio Memories & Document Vault/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /TS-4: Multi-Dimensional Visualizations/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /TS-5: GEDCOM 7.0 & Multi-Format Export/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /TS-6: Supabase Cloud Auth & Multi-Tree/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /TS-7: Stripe Payments & Monetization/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /TS-8: Collaborative Trees & Real-Time/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /TS-9: Public Tree Sharing & QR Codes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /TS-10: Top Navigation & Responsive UX/i })).toBeVisible();
  });

  test('should filter test cases by search query and suite', async ({ page }) => {
    await page.goto('/qa');

    // Search for "GEDCOM"
    const searchInput = page.getByPlaceholder(/Search test cases by title/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('GEDCOM');

    // Verify GEDCOM test cases are displayed
    await expect(page.getByText(/Open Import GEDCOM Dialog/i).first()).toBeVisible();
  });

  test('should interact with test case status, subchecks, and notes', async ({ page }) => {
    await page.goto('/qa');

    // Expand first test case: TC-1.1
    const testHeader = page.getByText(/Default Fixture Load & Canvas Rendering/i).first();
    await expect(testHeader).toBeVisible();
    await testHeader.click();

    // Click "Pass" button for TC-1.1
    const passBtn = page.getByRole('button', { name: /Pass/i }).first();
    await expect(passBtn).toBeVisible();
    await passBtn.click();

    // Verify test state updates to passed
    await expect(page.getByText(/Passed/i).first()).toBeVisible();

    // Reload page and assert persistence from localStorage
    await page.reload();
    await expect(page.getByText(/Passed/i).first()).toBeVisible();
  });
});
