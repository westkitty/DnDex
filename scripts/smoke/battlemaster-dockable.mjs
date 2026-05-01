import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const REPO_ROOT = '/Users/andrew/Projects/DM_Hub';
const OUTPUT_DIR = '/tmp/dndex-smoke';
const BASE_URL = 'http://127.0.0.1:4173/DnDex/';

const results = { passed: [], failed: [], consoleErrors: [], pageErrors: [] };

const ok = (name, condition, details = '') => {
  if (condition) {
    results.passed.push(name);
    return;
  }
  results.failed.push({ name, details });
};

const waitForServer = async (timeoutMs = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(BASE_URL, { method: 'GET' });
      if (response.ok) return true;
    } catch {
      // server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  return false;
};

const startPreviewServer = async () => {
  const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  let stdout = '';
  let stderr = '';
  server.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  server.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  const ready = await waitForServer();
  if (!ready) {
    throw new Error(`Preview server did not start in time.\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
  }

  return {
    stop: () => {
      if (!server.killed) {
        server.kill('SIGTERM');
      }
    },
  };
};

const runSmoke = async () => {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const preview = await startPreviewServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, serviceWorkers: 'block' });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') results.consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => results.pageErrors.push(String(err)));

  try {
    const verifyGatewayKeyboardEntry = async (keyName) => {
      const keyboardContext = await browser.newContext({ viewport: { width: 1600, height: 1000 }, serviceWorkers: 'block' });
      const keyboardPage = await keyboardContext.newPage();
      keyboardPage.on('console', (msg) => {
        if (msg.type() === 'error') results.consoleErrors.push(msg.text());
      });
      keyboardPage.on('pageerror', (err) => results.pageErrors.push(String(err)));

      try {
        await keyboardPage.goto(BASE_URL, { waitUntil: 'networkidle' });
        const keyboardGateway = keyboardPage.locator('[data-testid="gateway-splash"]');
        const keyboardEnter = keyboardPage.locator('[data-testid="gateway-enter"]');
        await keyboardGateway.waitFor({ state: 'visible', timeout: 8000 });
        await keyboardEnter.waitFor({ state: 'visible', timeout: 8000 });
        await keyboardPage.waitForFunction(() => {
          const enter = document.querySelector('[data-testid="gateway-enter"]');
          return enter && !enter.disabled;
        });
        await keyboardPage.waitForTimeout(150);
        await keyboardEnter.focus();
        await keyboardEnter.press(keyName);
        await keyboardPage.waitForSelector('[data-testid="gateway-splash"]', { state: 'detached', timeout: 15000 });
        ok(`gateway accepts ${keyName} key`, true);
      } catch (error) {
        ok(`gateway accepts ${keyName} key`, false, String(error));
      } finally {
        await keyboardContext.close();
      }
    };

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    ok('app loads', await page.locator('body').isVisible());

    // Gateway: must appear on every open; click through before continuing workspace checks.
    const gatewaySplash = page.locator('[data-testid="gateway-splash"]');
    const gatewayVisible = await gatewaySplash.isVisible().catch(() => false);
    ok('gateway appears on open', gatewayVisible);
    ok('gateway displays DnDex title', await gatewaySplash.getByText('DnDex', { exact: true }).isVisible().catch(() => false));
    ok('gateway displays DM_Hub subtitle', await gatewaySplash.getByText('DM_Hub', { exact: true }).isVisible().catch(() => false));
    if (gatewayVisible) {
      const gatewayEnter = page.locator('[data-testid="gateway-enter"]');
      await gatewayEnter.waitFor({ state: 'visible', timeout: 8000 });
      await page.waitForFunction(() => {
        const enter = document.querySelector('[data-testid="gateway-enter"]');
        return enter && !enter.disabled;
      });
      await page.waitForTimeout(150);
      ok('gateway enter control visible', await gatewayEnter.isVisible().catch(() => false));
      ok('gateway enter control enabled', await gatewayEnter.isEnabled().catch(() => false));
      // mouse.click at center dispatches trusted pointer events the animated button requires.
      const gwBox = await gatewayEnter.boundingBox();
      if (gwBox === null) {
        throw new Error("Gateway enter control has no bounding box");
      }
      await page.mouse.click(gwBox.x + gwBox.width / 2, gwBox.y + gwBox.height / 2);
      await page.waitForSelector('[data-testid="gateway-splash"]', { state: 'detached', timeout: 15000 });
      ok('gateway dismisses after enter', true);
    } else {
      ok('gateway dismisses after enter', false, 'Gateway was not visible on load');
    }

    await verifyGatewayKeyboardEntry('Enter');
    await verifyGatewayKeyboardEntry('Space');

    await page.getByTitle('Battlemaster — Map + Panels').waitFor({ state: 'visible', timeout: 8000 });
    await page.waitForSelector('canvas', { timeout: 10000 });
    ok('map canvas renders', await page.locator('canvas').isVisible());

    const combatButton = page.getByRole('button', { name: 'Combat' });
    const prepButton = page.getByRole('button', { name: 'Prep' });
    ok('combat mode button visible', await combatButton.isVisible());
    ok('prep mode button visible', await prepButton.isVisible());

    await prepButton.click();
    await combatButton.click();

    const leftPanel = page.locator('section[aria-label="Combat"]').first();
    const rightPanel = page.locator('section[aria-label="Initiative"]').first();
    const bottomPanel = page.locator('section[aria-label="Prep Dock"]').first();

    ok('left panel visible', await leftPanel.isVisible());
    ok('right panel visible', await rightPanel.isVisible());
    ok('bottom panel visible', await bottomPanel.isVisible());

    await leftPanel.getByTitle('Collapse Panel').click({ force: true });
    await leftPanel.getByTitle('Expand Panel').click({ force: true });
    await rightPanel.getByTitle('Collapse Panel').click({ force: true });
    await rightPanel.getByTitle('Expand Panel').click({ force: true });
    await bottomPanel.getByTitle('Expand Panel').click({ force: true });
    await bottomPanel.getByTitle('Collapse Panel').click({ force: true });
    ok('collapse expand controls work', true);

    await leftPanel.getByTitle('Undock Panel').click({ force: true });
    const floatingLeft = page.locator('section[aria-label="Combat"]').last();
    const dragStart = await floatingLeft.boundingBox();
    if (dragStart) {
      await page.mouse.move(dragStart.x + 40, dragStart.y + 14);
      await page.mouse.down();
      await page.mouse.move(dragStart.x + 200, dragStart.y + 120);
      await page.mouse.up();
    }
    const dragEnd = await floatingLeft.boundingBox();
    ok('panel drag works', Boolean(dragStart && dragEnd && Math.abs(dragEnd.x - dragStart.x) > 30));

    await floatingLeft.getByTitle('Minimize Panel').click({ force: true });
    const restoreButton = page.getByRole('button', { name: 'Restore Panel' }).first();
    const canRestore = await restoreButton.isVisible().catch(() => false);
    if (canRestore) {
      await restoreButton.click({ force: true });
      await page.locator('section[aria-label="Combat"]').last().getByTitle('Redock Panel').click({ force: true });
      ok('panel minimize restore redock works', true);
    } else {
      ok('panel minimize restore redock works', false, 'Restore Panel button not visible after minimizing panel.');
    }

    await page.getByLabel('Theme').selectOption('terminal');
    ok(
      'theme selector updates root theme',
      await page.evaluate(() => document.documentElement.dataset.theme === 'terminal')
    );
    await page.getByLabel('Theme').selectOption('dragon-glass');

    await page.getByTitle('Tactical Map').click();
    await page.getByTitle('List View').click();
    await page.getByTitle('Battlemaster — Map + Panels').click();
    ok('view switching works', true);

    await page.getByTitle('Rules Reference').click();
    await page.locator('text=Rules Grimoire').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    ok('rules opens', await page.locator('text=Rules Grimoire').isVisible());
    await page.keyboard.press('Escape');

    await page.getByTitle('Snapshots').click();
    await page.locator('aside:has-text("Chronological Archives") input[placeholder="Snapshot label..."]').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    const snapshotOpen = await page
      .locator('aside:has-text("Chronological Archives") input[placeholder="Snapshot label..."]')
      .isVisible()
      .catch(() => false);
    ok('snapshots opens', snapshotOpen);
    await page.keyboard.press('Escape');

    await page.locator('body').click({ position: { x: 12, y: 12 } });
    await page.evaluate(() => {
      document.body.focus();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    });

    let paletteOpen = await page.getByRole('textbox', { name: '' }).first().isVisible().catch(() => false);
    if (!paletteOpen) {
      await page.evaluate(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
      });
      paletteOpen = await page.locator('input[placeholder*="Search monsters, rules, and actions"]').isVisible().catch(() => false);
    }

    ok('command palette opens', paletteOpen);
    await page.keyboard.press('Escape');

    const quickVisible = await page.locator('text=Quick Strike').first().isVisible().catch(() => false);
    const awaitingVisible = await page.locator('text=Awaiting Combat').first().isVisible().catch(() => false);
    ok('quick damage heal represented', quickVisible || awaitingVisible);

    const areaVisible = await page.locator('text=Area Damage').first().isVisible().catch(() => false);
    const emptyBattlefield = await page.locator('text=The Battlefield is Empty').first().isVisible().catch(() => false);
    ok('group damage represented/reachable', areaVisible || emptyBattlefield);

    ok('next action visible', await page.locator('text=Next Action').first().isVisible());
    ok('no console errors', results.consoleErrors.length === 0, results.consoleErrors.join('\n'));
    ok('no page errors', results.pageErrors.length === 0, results.pageErrors.join('\n'));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'battlemaster-dockable.png'), fullPage: true });
  } finally {
    writeFileSync(path.join(OUTPUT_DIR, 'battlemaster-dockable-results.json'), JSON.stringify(results, null, 2));
    await context.close();
    await browser.close();
    preview.stop();
  }

  if (results.failed.length) {
    console.error('Smoke failures:', JSON.stringify(results.failed, null, 2));
    process.exit(1);
  }

  console.log(`Smoke pass: ${results.passed.length} checks`);
};

runSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
