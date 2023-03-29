import { expect } from '@playwright/test';

import { waitMarkdownImported } from '../../libs/page-logic';
import { test } from '../../libs/playwright';
import { clickPublishPanel } from '../../libs/setting';
import { clickSideBarSettingButton } from '../../libs/sidebar';
import { createFakeUser, loginUser, openHomePage } from '../../libs/utils';
import { createWorkspace } from '../../libs/workspace';

test.describe('affine public workspace', () => {
  test('enable public workspace', async ({ page }) => {
    await openHomePage(page);
    await waitMarkdownImported(page);
    const [a] = await createFakeUser();
    await loginUser(page, a);
    const name = `test-${Date.now()}`;
    await createWorkspace({ name }, page);
    await page.waitForTimeout(50);
    await clickSideBarSettingButton(page);
    await page.waitForTimeout(50);
    await clickPublishPanel(page);
    await page.getByTestId('publish-enable-affine-cloud-button').click();
    await page.getByTestId('confirm-enable-affine-cloud-button').click();
    await page.getByTestId('publish-to-web-button').waitFor({
      timeout: 10000,
    });
    await page.getByTestId('publish-to-web-button').click();
    await page.getByTestId('share-url').waitFor({
      timeout: 10000,
    });
    const url = await page.getByTestId('share-url').inputValue();
    expect(url.startsWith('http://localhost:8080/public-workspace/')).toBe(
      true
    );
  });
});
