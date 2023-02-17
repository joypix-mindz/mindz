import { expect } from '@playwright/test';

import { loadPage } from './libs/load-page';
import { clickPageMoreActions } from './libs/page-logic';
import { test } from './libs/playwright';
loadPage();

test.describe('Change page mode(Paper or Edgeless)', () => {
  test('Switch to edgeless by switch edgeless item', async ({ page }) => {
    const switcher = page.locator('[data-testid=editor-mode-switcher]');
    const box = await switcher.boundingBox();
    expect(box?.x).not.toBeUndefined();

    //  mouse hover trigger animation for showing full switcher
    // await page.mouse.move((box?.x ?? 0) + 5, (box?.y ?? 0) + 5);
    await page.mouse.move((box?.x ?? 0) + 10, (box?.y ?? 0) + 10);

    // await page.waitForTimeout(1000);
    const edgelessButton = page.getByTestId('switch-edgeless-item'); // page.getByText('Edgeless').click()
    await edgelessButton.click();

    // // mouse move to edgeless button
    // await page.mouse.move(
    //   (box?.x ?? 0) + (box?.width ?? 0) - 5,
    //   (box?.y ?? 0) + 5
    // );

    // await page.waitForTimeout(1000);

    // // click switcher
    // await page.mouse.click(
    //   (box?.x ?? 0) + (box?.width ?? 0) - 5,
    //   (box?.y ?? 0) + 5
    // );

    const edgeless = page.locator('affine-edgeless-page');
    expect(await edgeless.isVisible()).toBe(true);
  });

  test('Convert to edgeless by editor header items', async ({ page }) => {
    await clickPageMoreActions(page);
    const menusEdgelessItem = page.getByTestId('editor-option-menu-edgeless');
    await menusEdgelessItem.click();

    const edgeless = page.locator('affine-edgeless-page');
    expect(await edgeless.isVisible()).toBe(true);
  });
});
