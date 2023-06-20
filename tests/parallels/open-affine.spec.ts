import { test } from '@affine-test/kit/playwright';
import { expect } from '@playwright/test';

import { openHomePage } from '../libs/load-page';
import { waitEditorLoad } from '../libs/page-logic';
import { createWorkspace } from '../libs/workspace';

test('Open last workspace when back to affine', async ({ page }) => {
  await openHomePage(page);
  await waitEditorLoad(page);
  await createWorkspace({ name: 'New Workspace 2' }, page);
  await waitEditorLoad(page);
  // show workspace list
  await page.getByTestId('workspace-name').click();

  //check workspace list length
  const workspaceCards = await page.$$('data-testid=workspace-card');
  expect(workspaceCards.length).toBe(2);
  await workspaceCards[1].click();
  await openHomePage(page);

  const workspaceNameDom = page.getByTestId('workspace-name');
  const currentWorkspaceName = await workspaceNameDom.evaluate(
    node => node.textContent
  );
  expect(currentWorkspaceName).toEqual('New Workspace 2');
});

test('Download client tip', async ({ page }) => {
  await openHomePage(page);
  const downloadClientTipItem = page.locator(
    '[data-testid=download-client-tip]'
  );
  await expect(downloadClientTipItem).toBeVisible();
  const closeButton = page.locator(
    '[data-testid=download-client-tip-close-button]'
  );
  await closeButton.click();
  await expect(downloadClientTipItem).not.toBeVisible();
  await page.goto('http://localhost:8080');
  const currentDownloadClientTipItem = page.locator(
    '[data-testid=download-client-tip]'
  );
  await expect(currentDownloadClientTipItem).not.toBeVisible();
});
