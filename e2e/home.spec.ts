import { test, expect } from '@playwright/test';

test.describe('Home Page & Bento Showcase', () => {
  test('should load homepage and display hero content', async ({ page }) => {
    await page.goto('/');

    // Check title and brand
    await expect(page).toHaveTitle(/Project Natal/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Project Natal');

    // Check Hero CTA buttons
    const startTreeBtn = page.getByRole('link', { name: /Start Your Family Tree/i });
    await expect(startTreeBtn).toBeVisible();

    const liveDemoBtn = page.getByRole('link', { name: /Explore Live Demo/i });
    await expect(liveDemoBtn).toBeVisible();
  });

  test('should display fixture showcase cards and link to /t/smith-family', async ({ page }) => {
    await page.goto('/');

    // Check sample tree cards
    const smithCard = page.getByRole('heading', { name: 'The Smith Family' });
    await expect(smithCard).toBeVisible();

    const riveraCard = page.getByRole('heading', { name: 'Rivera-Chen Family' });
    await expect(riveraCard).toBeVisible();

    const targaryenCard = page.getByRole('heading', { name: 'House Targaryen Dynasty' });
    await expect(targaryenCard).toBeVisible();
  });

  test('should scroll down and display Apple-style Bento Feature Showcase', async ({ page }) => {
    await page.goto('/');

    // Locate Bento Feature Section
    const bentoHeading = page.getByRole('heading', { name: /Built for Modern Families & Memorable Gatherings/i });
    await expect(bentoHeading).toBeVisible();

    // Check prominent bento tiles
    await expect(page.getByText('Interactive Canvas')).toBeVisible();
    await expect(page.getByText('4 Visualization Modes')).toBeVisible();
    await expect(page.getByText('3D World Globe')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AI Family Historian' })).toBeVisible();
    await expect(page.getByText('Privacy First')).toBeVisible();
    await expect(page.getByText('25+')).toBeVisible();
    await expect(page.getByText('High-Res Export')).toBeVisible();
  });
});
