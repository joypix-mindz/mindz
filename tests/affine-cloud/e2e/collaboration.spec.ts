import { test } from '@affine-test/kit/playwright';
import {
  addUserToWorkspace,
  createRandomUser,
  enableCloudWorkspace,
  enableCloudWorkspaceFromShareButton,
  loginUser,
} from '@affine-test/kit/utils/cloud';
import { clickEdgelessModeButton } from '@affine-test/kit/utils/editor';
import {
  clickNewPageButton,
  getBlockSuiteEditorTitle,
  waitForEditorLoad,
} from '@affine-test/kit/utils/page-logic';
import { clickUserInfoCard } from '@affine-test/kit/utils/setting';
import { clickSideBarSettingButton } from '@affine-test/kit/utils/sidebar';
import { createLocalWorkspace } from '@affine-test/kit/utils/workspace';
import { expect } from '@playwright/test';
import { resolve } from 'path';

let user: {
  id: string;
  name: string;
  email: string;
  password: string;
};

test.beforeEach(async () => {
  user = await createRandomUser();
});

test.beforeEach(async ({ page }) => {
  await loginUser(page, user.email);
});

test('can enable share page', async ({ page, browser }) => {
  await page.reload();
  await waitForEditorLoad(page);
  await createLocalWorkspace(
    {
      name: 'test',
    },
    page
  );
  await enableCloudWorkspaceFromShareButton(page);
  const title = getBlockSuiteEditorTitle(page);
  await title.pressSequentially('TEST TITLE', {
    delay: 50,
  });
  await page.keyboard.press('Enter', { delay: 50 });
  await page.keyboard.type('TEST CONTENT', { delay: 50 });
  await page.getByTestId('cloud-share-menu-button').click();
  await page.getByTestId('share-menu-create-link-button').click();
  await page.getByTestId('share-menu-copy-link-button').click();

  // check share page is accessible
  {
    const context = await browser.newContext();
    const url: string = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    const page2 = await context.newPage();
    await page2.goto(url);
    await waitForEditorLoad(page2);
    const title = getBlockSuiteEditorTitle(page2);
    expect(await title.innerText()).toBe('TEST TITLE');
    expect(await page2.textContent('affine-paragraph')).toContain(
      'TEST CONTENT'
    );
  }
});

test('share page with default edgeless', async ({ page, browser }) => {
  await page.reload();
  await waitForEditorLoad(page);
  await createLocalWorkspace(
    {
      name: 'test',
    },
    page
  );
  await enableCloudWorkspaceFromShareButton(page);
  const title = getBlockSuiteEditorTitle(page);
  await title.pressSequentially('TEST TITLE', {
    delay: 50,
  });
  await page.keyboard.press('Enter', { delay: 50 });
  await page.keyboard.type('TEST CONTENT', { delay: 50 });
  await clickEdgelessModeButton(page);
  await expect(page.locator('affine-edgeless-page')).toBeVisible({
    timeout: 1000,
  });
  await page.getByTestId('cloud-share-menu-button').click();
  await page.getByTestId('share-menu-create-link-button').click();
  await page.getByTestId('share-menu-copy-link-button').click();

  // check share page is accessible
  {
    const context = await browser.newContext();
    const url: string = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    const page2 = await context.newPage();
    await page2.goto(url);
    await waitForEditorLoad(page2);
    await expect(page.locator('affine-edgeless-page')).toBeVisible({
      timeout: 1000,
    });
    expect(await page2.textContent('affine-paragraph')).toContain(
      'TEST CONTENT'
    );
    const logo = page2.getByTestId('share-page-logo');
    const editButton = page2.getByTestId('share-page-edit-button');
    await expect(editButton).not.toBeVisible();
    await expect(logo).toBeVisible();
  }
});

test('can collaborate with other user and name should display when editing', async ({
  page,
  browser,
}) => {
  await page.reload();
  await waitForEditorLoad(page);
  await createLocalWorkspace(
    {
      name: 'test',
    },
    page
  );
  await enableCloudWorkspace(page);
  await clickNewPageButton(page);
  const currentUrl = page.url();
  // format: http://localhost:8080/workspace/${workspaceId}/xxx
  const workspaceId = currentUrl.split('/')[4];
  const userB = await createRandomUser();
  const context = await browser.newContext();
  const page2 = await context.newPage();
  await loginUser(page2, userB.email);
  await addUserToWorkspace(workspaceId, userB.id, 1 /* READ */);
  await page2.reload();
  await waitForEditorLoad(page2);
  await page2.goto(currentUrl);
  {
    const title = getBlockSuiteEditorTitle(page);
    await title.pressSequentially('TEST TITLE', {
      delay: 50,
    });
  }
  await page2.waitForTimeout(200);
  {
    const title = getBlockSuiteEditorTitle(page2);
    expect(await title.innerText()).toBe('TEST TITLE');
    const typingPromise = Promise.all([
      page.keyboard.press('Enter', { delay: 50 }),
      page.keyboard.type('TEST CONTENT', { delay: 50 }),
    ]);
    // username should be visible when editing
    await expect(page2.getByText(user.name)).toBeVisible();
    await typingPromise;
  }

  // change username
  await clickSideBarSettingButton(page);
  await clickUserInfoCard(page);
  const input = page.getByTestId('user-name-input');
  await input.clear();
  await input.pressSequentially('TEST USER', {
    delay: 50,
  });
  await page.getByTestId('save-user-name').click({
    delay: 50,
  });
  await page.keyboard.press('Escape', {
    delay: 50,
  });
  const title = getBlockSuiteEditorTitle(page);
  await title.focus();

  {
    await expect(page2.getByText('TEST USER')).toBeVisible({
      timeout: 2000,
    });
  }
});

test('can sync collections between different browser', async ({
  page,
  browser,
}) => {
  await page.reload();
  await waitForEditorLoad(page);
  await createLocalWorkspace(
    {
      name: 'test',
    },
    page
  );
  await enableCloudWorkspace(page);
  await page.getByTestId('slider-bar-add-collection-button').click();
  const title = page.getByTestId('input-collection-title');
  await title.isVisible();
  await title.fill('test collection');
  await page.getByTestId('save-collection').click();

  {
    const context = await browser.newContext();
    const page2 = await context.newPage();
    await loginUser(page2, user.email);
    await page2.goto(page.url());
    const collections = page2.getByTestId('collections');
    await expect(collections.getByText('test collection')).toBeVisible();
  }
});

test('can sync svg between different browsers', async ({ page, browser }) => {
  await page.reload();
  await waitForEditorLoad(page);
  await createLocalWorkspace(
    {
      name: 'test',
    },
    page
  );
  await enableCloudWorkspace(page);
  await clickNewPageButton(page);
  await waitForEditorLoad(page);

  // upload local svg

  const slashMenu = page.locator(`.slash-menu`);
  const image = page.locator('affine-image');

  page.evaluate(async () => {
    window.showOpenFilePicker = undefined;
  });

  const title = getBlockSuiteEditorTitle(page);
  await title.pressSequentially('TEST TITLE', {
    delay: 50,
  });
  await page.keyboard.press('Enter', { delay: 50 });
  await page.waitForTimeout(100);
  await page.keyboard.type('/', { delay: 50 });
  await expect(slashMenu).toBeVisible();
  await page.keyboard.type('image', { delay: 100 });
  await expect(slashMenu).toBeVisible();
  await page.keyboard.press('Enter', { delay: 50 });
  await page.setInputFiles(
    "input[type='file']",
    resolve(__dirname, 'logo.svg')
  );
  await expect(image).toBeVisible();

  // the user should see the svg
  // get the image src under "affine-image img"
  const src1 = await page.locator('affine-image img').getAttribute('src');
  expect(src1).not.toBeNull();

  // fetch the actual src1 resource in the browser
  const svg1 = await page.evaluate(
    src =>
      fetch(src!)
        .then(res => res.blob())
        .then(blob => blob.text()),
    src1
  );

  {
    const context = await browser.newContext();
    const page2 = await context.newPage();
    await loginUser(page2, user.email);
    await page2.goto(page.url());

    // second user should see the svg
    // get the image src under "affine-image img"
    const src2 = await page2.locator('affine-image img').getAttribute('src');
    expect(src2).not.toBeNull();

    // fetch the actual src2 resource in the browser
    const svg2 = await page2.evaluate(
      src =>
        fetch(src!)
          .then(res => res.blob())
          .then(blob => blob.text()),
      src2
    );

    expect(svg2).toEqual(svg1);
  }
});
