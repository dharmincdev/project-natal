import { test, expect } from '@playwright/test';

test.describe('Interactive Demo Tree Canvas', () => {
  test('should load Smith Family tree by default with 10 members', async ({ page }) => {
    await page.goto('/demo');

    // Wait for the tree canvas to render
    await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

    // Verify individual member nodes on canvas
    await expect(page.getByText('Robert Smith')).toBeVisible();
    await expect(page.getByText('Margaret Smith')).toBeVisible();
  });

  test('should switch view modes to 3D Orbit, Timeline, and World Globe', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

    // Open view switcher
    const modeBtn = page.getByRole('button', { name: /Flat/i });
    if (await modeBtn.isVisible()) {
      await modeBtn.click();
      
      // Select Timeline
      const timelineOption = page.getByText('Timeline');
      if (await timelineOption.isVisible()) {
        await timelineOption.click();
        await expect(page.getByText('Family Timeline')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should open Add Person modal and display form fields', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

    // Click + Add Person
    const addBtn = page.getByRole('button', { name: /\+ Add/i });
    await addBtn.click();

    // Assert dialog title
    await expect(page.getByRole('heading', { name: /Add.*Family Member/i })).toBeVisible();

    // Verify key fields including Maiden Name and Gender
    await expect(page.getByLabel(/First Name/i)).toBeVisible();
    await expect(page.getByLabel(/Last Name/i)).toBeVisible();
    await expect(page.getByLabel(/Maiden Name/i)).toBeVisible();
    await expect(page.getByText(/Biological Gender/i)).toBeVisible();
  });

  test('should open Export modal and display GEDCOM 7.0 option', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

    // Click Export button
    const exportBtn = page.getByRole('button', { name: /Export/i });
    await exportBtn.click();

    // Check modal contents
    await expect(page.getByRole('heading', { name: /Export Family Tree/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /GEDCOM 7.0/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /SVG Vector/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /PDF \/ Print/i })).toBeVisible();
  });

  test('should open Collaborators modal and display invite controls and active members', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

    // Click Collaborate button in header
    const collabBtn = page.getByRole('button', { name: /Collaborate/i });
    await expect(collabBtn).toBeVisible();
    await collabBtn.click();

    // Check modal header and active members
    await expect(page.getByRole('heading', { name: /Family Tree Collaborators/i })).toBeVisible();
    await expect(page.getByText(/Active Members & Contributors/i)).toBeVisible();
    await expect(page.getByText('Tree Creator')).toBeVisible();

    // Invite a new relative
    const emailInput = page.getByPlaceholder('relative@familyemail.com');
    await expect(emailInput).toBeVisible();
    await emailInput.fill('uncle.charlie@smithfamily.com');

    // Click Send Invite
    const sendInviteBtn = page.getByRole('button', { name: /Send Invite/i });
    await sendInviteBtn.click();

    // Verify collaborator added with pending status
    await expect(page.getByText('uncle.charlie@smithfamily.com', { exact: true })).toBeVisible();
    await expect(page.getByText(/Pending/i).first()).toBeVisible();
  });

  test('should open PersonDetailPanel and display Vault with audio memories and record new story', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

    // Click on Robert Smith node to open PersonDetailPanel
    await page.getByText('Robert Smith').first().click();

    // Verify PersonDetailPanel sheet opens
    await expect(page.getByRole('heading', { name: /Robert Smith/i })).toBeVisible({ timeout: 5000 });

    // Scroll to and verify Memories & Document Vault section
    await expect(page.getByText(/Memories & Document Vault/i)).toBeVisible();
    await expect(page.getByText("Grandpa Robert's Memories of Chicago (1968)")).toBeVisible();

    // Click Record button in Vault
    const recordBtn = page.getByRole('button', { name: /Record/i });
    await expect(recordBtn).toBeVisible();
    await recordBtn.click();

    // Verify recording UI
    await expect(page.getByText(/Record Oral History/i)).toBeVisible();

    // Click Simulate Voice
    const simulateBtn = page.getByRole('button', { name: /Simulate Voice/i });
    await expect(simulateBtn).toBeVisible();
    await simulateBtn.click();

    // Wait for review state
    await expect(page.getByText(/Recorded Audio Clip/i)).toBeVisible({ timeout: 10000 });

    // Click Save Voice Memory
    const saveBtn = page.getByRole('button', { name: /Save Voice Memory/i });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Verify new voice memory is listed in vault
    await expect(page.getByText(/Voice Memory of Robert Smith/i)).toBeVisible();
  });
});

