import { chromium } from '@playwright/test';
import bundled from '@sparticuz/chromium';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

// The npm-distributed browser allows testing in environments without a system Chrome.
mkdirSync('.cache/chromium-libs', { recursive: true });
if (!existsSync('.cache/chromium-libs/lib/libnspr4.so')) {
  writeFileSync('.cache/al.tar', brotliDecompressSync(readFileSync('node_modules/@sparticuz/chromium/bin/al2023.tar.br')));
  execFileSync('tar', ['xf', '.cache/al.tar', '-C', '.cache/chromium-libs']);
}
process.env.LD_LIBRARY_PATH = `${resolve('.cache/chromium-libs/lib')}:${process.env.LD_LIBRARY_PATH || ''}`;
const browser = await chromium.launch({ executablePath: await bundled.executablePath(), args: bundled.args, headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  const requests = [];
  page.on('request', request => { if (/wedding-\d+\.webp/.test(request.url())) requests.push(request.url()); });
  await page.goto(process.env.TEST_URL || 'http://localhost:5173');
  assert.equal(await page.locator('#cover').isVisible(), true);
  assert.equal(requests.length, 0, 'No wedding photos should load before the album opens');
  await page.locator('.wax-seal').click();
  await page.waitForSelector('#dolls:not([hidden])');
  await page.locator('#doll-next').click();
  assert.match(await page.locator('#doll-count').textContent(), /02/);
  assert.match(await page.locator('.doll-image.selected').getAttribute('src'), /media\/doll-02\.webp$/);
  await page.locator('nav [data-scene="album"]').click();
  await page.waitForTimeout(250);
  assert.equal(new Set(requests).size, 4, 'Only current and next spread should load');
  assert.equal(await page.locator('.album-prev').isDisabled(), true);
  for (let i = 0; i < 9; i++) {
    await page.locator('.album-next').click();
    await page.waitForTimeout(80);
  }
  assert.match(await page.locator('#reading-label').textContent(), /19 — 20 \/ 20/);
  assert.equal(await page.locator('.album-next').isDisabled(), true);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(80);
  assert.match(await page.locator('#reading-label').textContent(), /17 — 18/);
  const box = await page.locator('#album-book').boundingBox();
  await page.mouse.move(box.x + box.width * .7, box.y + 100); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .3, box.y + 100, { steps: 5 }); await page.mouse.up();
  await page.waitForTimeout(80);
  assert.match(await page.locator('#reading-label').textContent(), /19 — 20/);
  await page.locator('nav [data-scene="heart"]').click();
  await page.waitForSelector('#heart-canvas canvas');
  await page.locator('[data-color="#a9c7d0"]').click();
  await page.locator('[data-material="gold"]').click();
  await page.locator('[data-sticker="22"]').click();
  await page.locator('#heart-canvas').focus(); await page.keyboard.press('Enter');
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('wu-liu-heart')));
  assert.equal(saved.color, '#a9c7d0'); assert.equal(saved.material, 'gold'); assert.equal(saved.stickers.length, 1);
  await page.locator('#undo-sticker').click();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem('wu-liu-heart'))); assert.equal(saved.stickers.length, 0);
  const downloadEvent = page.waitForEvent('download'); await page.locator('#save-heart').click();
  const download = await downloadEvent; assert.match(download.suggestedFilename(), /Eternal-Heart\.png/);
  await page.reload(); await page.waitForSelector('#heart-canvas canvas');
  assert.equal(await page.locator('[data-color="#a9c7d0"]').getAttribute('aria-pressed'), 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  mkdirSync('.cache/screenshots', { recursive: true });
  for (const scene of ['cover', 'dolls', 'album', 'heart']) {
    await page.locator(`nav [data-scene="${scene}"]`).click(); await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No horizontal overflow on mobile ${scene}`);
    await page.screenshot({ path: `.cache/screenshots/mobile-${scene}.png`, fullPage: true });
  }
  await page.locator('nav [data-scene="album"]').click();
  assert.equal(await page.locator('.right-page').isVisible(), false);
  assert.match(await page.locator('#reading-label').textContent(), /^01 \/ 20$/);
  await page.locator('.album-next').click(); await page.waitForTimeout(80);
  assert.match(await page.locator('#reading-label').textContent(), /^02 \/ 20$/);
  await page.locator('#sound').click(); assert.equal(await page.locator('#sound').getAttribute('aria-pressed'), 'true');
  await page.locator('#sound').click(); assert.equal(await page.locator('#sound').getAttribute('aria-pressed'), 'false');
  assert.deepEqual(errors, [], 'No browser runtime errors');
  console.log('PASS: four scenes, cutouts, lazy loading, 20 pages, keyboard/drag, mobile layout, 3D customization, persistence, PNG download, opt-in audio.');
} finally { await browser.close(); }
