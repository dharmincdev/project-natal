import { test, expect } from '@playwright/test';

test.describe('Graph Invariant & DAG Cycle Prevention (SPEC.md §3.1)', () => {
  test('should display cycle detection error when user attempts to make child into parent', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

    // Open Robert Smith's detail panel
    await page.getByText('Robert Smith').first().click();
    await expect(page.getByRole('heading', { name: /Robert Smith/i })).toBeVisible({ timeout: 5000 });

    // Click "Connect" button in Family Relationships section
    const connectBtn = page.getByRole('button', { name: 'Connect', exact: true });
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();

    // Verify AddRelationshipDialog opens
    await expect(page.getByRole('heading', { name: /Connect Family Members/i })).toBeVisible();

    // Select relationship type: "Child of (Parent)"
    const typeSelect = page.locator('#rel-type');
    await typeSelect.selectOption('child_of');

    // Select Person B: James Smith (who is already Robert's child)
    const personBSelect = page.locator('#rel-personB');
    await personBSelect.selectOption({ label: 'James Smith (b. 1970)' });

    // Click "Create Connection"
    const createBtn = page.getByRole('button', { name: /Create Connection/i });
    await expect(createBtn).toBeEnabled();
    await createBtn.click();

    // Assert cycle detection validation error is displayed
    await expect(page.getByText(/CYCLE_DETECTED/i)).toBeVisible();
    await expect(page.getByText(/Person cannot be an ancestor of themselves/i)).toBeVisible();

    // Assert dialog remained open (did not submit the invalid relationship)
    await expect(page.getByRole('heading', { name: /Connect Family Members/i })).toBeVisible();
  });

  test('should display duplicate relationship error when attempting to add existing spouse', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

    // Open Robert Smith's detail panel
    await page.getByText('Robert Smith').first().click();
    await expect(page.getByRole('heading', { name: /Robert Smith/i })).toBeVisible({ timeout: 5000 });

    // Click "Connect"
    const connectBtn = page.getByRole('button', { name: 'Connect', exact: true });
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();

    // Leave type as Spouse / Partner of
    // Select Person B: Margaret Smith (who is already Robert's spouse)
    const personBSelect = page.locator('#rel-personB');
    await personBSelect.selectOption({ label: 'Margaret Smith (b. 1948)' });

    // Click "Create Connection"
    const createBtn = page.getByRole('button', { name: /Create Connection/i });
    await createBtn.click();

    // Assert duplicate relationship error is displayed
    await expect(page.getByText(/already exists between these individuals/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Connect Family Members/i })).toBeVisible();
  });

  test('should calculate dynamic LCA kinship between granddaughter and grandfather', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

    // Click on Emily Smith node to open PersonDetailPanel
    await page.getByText('Emily Smith').first().click();
    await expect(page.getByRole('heading', { name: /Emily Smith/i })).toBeVisible({ timeout: 5000 });

    // Check Kinship card is visible
    await expect(page.getByText(/Kinship & Consanguinity/i)).toBeVisible();

    // Select Robert Smith in calculate relative to dropdown
    const kinshipSelect = page.locator('#kinship-compare');
    await kinshipSelect.selectOption({ label: 'Robert Smith (Tree Root)' });

    // Verify LCA Engine displays Granddaughter and degree descendant
    await expect(page.getByText('Granddaughter', { exact: true })).toBeVisible();
    await expect(page.getByText('2th Degree Descendant', { exact: true })).toBeVisible();
  });
});
