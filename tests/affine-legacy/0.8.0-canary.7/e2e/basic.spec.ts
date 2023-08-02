import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

let app: express.Express;
let server: ReturnType<express.Express['listen']>;

process.env.DEBUG = 'http-proxy-middleware*';

async function switchToNext() {
  // close previous express server
  await new Promise<void>((resolve, reject) => {
    server.close(err => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
  app = express();
  app.use(
    createProxyMiddleware({
      target: 'http://localhost:8080',
      pathFilter: ['**'],
      changeOrigin: true,
    })
  );
  return new Promise<void>(resolve => {
    server = app.listen(8081, () => {
      console.log('proxy to next.js server');
      resolve();
    });
  });
}

test.beforeEach(() => {
  app = express();
  app.use(express.static(resolve(__dirname, '..', 'static')));
  server = app.listen(8081);
});

test.afterEach(() => {
  server.close();
});

test('database migration', async ({ page, context }) => {
  {
    // make sure 8080 is ready
    const page = await context.newPage();
    await page.goto('http://localhost:8080/');
    await page.waitForSelector('v-line', {
      timeout: 10000,
    });
    await page.close();
  }
  await page.goto('http://localhost:8081/');
  await page.waitForSelector('v-line', {
    timeout: 10000,
  });
  await page.getByTestId('new-page-button').click();
  const title = page.locator('.affine-default-page-block-title');
  await title.type('hello');
  await page.keyboard.press('Enter', { delay: 50 });
  await page.keyboard.press('/', { delay: 50 });
  await page.keyboard.press('d');
  await page.keyboard.press('a');
  await page.keyboard.press('t');
  await page.keyboard.press('a');
  await page.keyboard.press('b');
  await page.keyboard.press('a', { delay: 50 });
  await page.keyboard.press('Enter', { delay: 50 });

  await switchToNext();
  await page.waitForTimeout(1000);
  await page.goto('http://localhost:8081/');
  await page.waitForSelector('v-line', {
    timeout: 10000,
  });
  expect(await page.locator('v-line').nth(0).textContent()).toBe('hello');
  expect(await page.locator('affine-database').isVisible()).toBe(true);
});
