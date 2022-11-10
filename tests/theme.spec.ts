import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');
});

test.describe('Change Theme', () => {
  test('default white', async ({ page }) => {
    const root = page.locator('html');
    const themeMode = await root.evaluate(element =>
      window.getComputedStyle(element).getPropertyValue('--affine-theme-mode')
    );

    await expect(themeMode).toBe('light');

    const lightButton = page.locator('[data-testid=change-theme-light]');
    const buttonPositionTop = await lightButton.evaluate(
      element => window.getComputedStyle(element).top
    );
    await expect(buttonPositionTop).toBe('0px');
  });

  test('change theme to dark', async ({ page }) => {
    const changeThemeContainer = page.locator(
      '[data-testid=change-theme-container]'
    );
    const box = await changeThemeContainer.boundingBox();
    await expect(box?.x).not.toBeUndefined();
    await page.mouse.move((box?.x ?? 0) + 5, (box?.y ?? 0) + 5);

    await page.waitForTimeout(3000);

    const darkButton = page.locator('[data-testid=change-theme-dark]');
    const darkButtonPositionTop = await darkButton.evaluate(
      element => element.getBoundingClientRect().y
    );
    await expect(darkButtonPositionTop).toBe(box?.y);

    await page.mouse.click((box?.x ?? 0) + 5, (box?.y ?? 0) + 5);

    const root = page.locator('html');
    const themeMode = await root.evaluate(element =>
      window.getComputedStyle(element).getPropertyValue('--affine-theme-mode')
    );

    await expect(themeMode).toBe('dark');
  });
});
