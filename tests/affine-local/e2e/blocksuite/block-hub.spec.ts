import { test } from '@affine-test/kit/playwright';
import { checkBlockHub } from '@affine-test/kit/utils/editor';
import { openHomePage } from '@affine-test/kit/utils/load-page';
import { newPage, waitEditorLoad } from '@affine-test/kit/utils/page-logic';

test('block-hub should work', async ({ page }) => {
  await openHomePage(page);
  await waitEditorLoad(page);
  await checkBlockHub(page);
  await newPage(page);
  await page.waitForTimeout(500);
  await checkBlockHub(page);
});
