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

  test('should switch view modes between Flat, unified Timeline, and 3D World Globe without deprecated 3D Orbit or 2D Map toggles', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });

    // PRO-8 & PRO-11: Verify 3-zone header and capacity badge are visible on desktop
    await expect(page.getByTestId('demo-header')).toBeVisible();
    await expect(page.getByTestId('header-zone-1')).toBeVisible();
    await expect(page.getByTestId('header-zone-2')).toBeVisible();
    await expect(page.getByTestId('header-zone-3')).toBeVisible();
    await expect(page.getByTestId('capacity-badge')).toContainText('10/25');

    // PRO-13: Verify 3D Orbit tab is removed
    await expect(page.getByRole('tab', { name: /3D/i })).toHaveCount(0);

    // PRO-14: Switch to unified Timeline view
    const timelineTab = page.getByRole('tab', { name: /Timeline/i });
    await expect(timelineTab).toBeVisible();
    await timelineTab.click();

    await expect(page.getByText('Family Timeline')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('time-traveler-scrubber')).toBeVisible();
    await expect(page.getByText(/Lifespan Tracks/i)).toBeVisible();
    await expect(page.getByText(/Chronological Event Stream/i)).toBeVisible();

    // PRO-15: Switch to 3D World Globe view
    const globeTab = page.getByRole('tab', { name: /Globe/i });
    await expect(globeTab).toBeVisible();
    await globeTab.click();

    await expect(page.getByRole('button', { name: /Migration Arcs/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /2D Map/i })).toHaveCount(0);

    // Click Chicago hub pill in Global Hubs bar to open Location Details Drawer
    const chicagoHubBtn = page.getByRole('button', { name: /Chicago/i }).first();
    await expect(chicagoHubBtn).toBeVisible();
    await chicagoHubBtn.click();
    await expect(page.getByTestId('globe-location-drawer')).toBeVisible();
    await expect(page.getByTestId('globe-location-drawer')).toContainText('Chicago');
  });

  test('should open Add Person modal, display form fields, and align Birth/Death Date inputs when Deceased is toggled (PRO-10)', async ({ page }) => {
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

    // PRO-10: Toggle Deceased pill and verify Birth Date & Death Date inputs align horizontally
    await page.locator('label[for="add-isDeceased"]').click();
    const birthInput = page.locator('#add-birthDate');
    const deathInput = page.locator('#add-deathDate');
    await expect(birthInput).toBeVisible();
    await expect(deathInput).toBeVisible();

    const birthBox = await birthInput.boundingBox();
    const deathBox = await deathInput.boundingBox();
    expect(birthBox).not.toBeNull();
    expect(deathBox).not.toBeNull();
    expect(Math.abs(birthBox!.y - deathBox!.y)).toBeLessThanOrEqual(2);
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

    // Verify Simulate Voice button is removed (PRO-20) and click Start Recording
    await expect(page.getByRole('button', { name: /Simulate Voice/i })).toHaveCount(0);
    const startRecBtn = page.getByRole('button', { name: /Start Recording/i });
    await expect(startRecBtn).toBeVisible();
    await startRecBtn.click();

    // Stop recording to enter review state deterministically
    const stopBtn = page.getByRole('button', { name: /Stop & Review/i });
    await stopBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await stopBtn.isVisible()) {
      await stopBtn.click();
    }

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

