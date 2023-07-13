import { test } from '@affine-test/kit/playwright';
import { openHomePage } from '@affine-test/kit/utils/load-page';
import {
  getBlockSuiteEditorTitle,
  newPage,
  waitEditorLoad,
} from '@affine-test/kit/utils/page-logic';
import { expect } from '@playwright/test';

test('New a page , then delete it in all pages, permanently delete it', async ({
  page,
  workspace,
}) => {
  await openHomePage(page);
  await waitEditorLoad(page);
  await newPage(page);
  await getBlockSuiteEditorTitle(page).click();
  await getBlockSuiteEditorTitle(page).fill('this is a new page to restore');
  const newPageId = page.url().split('/').reverse()[0];
  await page.getByTestId('all-pages').click();
  const cell = page.getByRole('cell', {
    name: 'this is a new page to restore',
  });
  expect(cell).not.toBeUndefined();

  await page
    .getByTestId('more-actions-' + newPageId)
    .getByRole('button')
    .first()
    .click();
  const deleteBtn = page.getByTestId('move-to-trash');
  await deleteBtn.click();
  const confirmTip = page.getByText('Delete page?');
  expect(confirmTip).not.toBeUndefined();

  await page.getByRole('button', { name: 'Delete' }).click();

  await page.getByTestId('trash-page').click();
  // permanently delete it
  await page
    .getByTestId('more-actions-' + newPageId)
    .getByRole('button')
    .nth(1)
    .click();
  await page.getByText('Delete permanently?').dblclick();

  // show empty tip
  expect(
    page.getByText(
      'Tips: Click Add to Favorites/Trash and the page will appear here.'
    )
  ).not.toBeUndefined();
  const currentWorkspace = await workspace.current();

  expect(currentWorkspace.flavour).toContain('local');
});
