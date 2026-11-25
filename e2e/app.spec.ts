import { test, expect } from '@playwright/test';
import {
  mockDriverStandingsResponse2026,
  mockConstructorStandingsResponse2026,
  mockRaceScheduleResponse2026
} from '../src/test/mocks/fixtures';

test.describe('F1 Archive — Full Application E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // 100% Offline-deterministic: intercept all Jolpica REST API requests
    await page.route('https://api.jolpi.ca/**', async (route) => {
      const url = route.request().url();
      if (url.includes('driverStandings.json')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockDriverStandingsResponse2026)
        });
      } else if (url.includes('constructorStandings.json')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockConstructorStandingsResponse2026)
        });
      } else if (url.endsWith('.json')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockRaceScheduleResponse2026)
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ MRData: {} })
        });
      }
    });
  });

  test('navigates through all core archive sections with zero uncaught runtime page errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    // 1. Home View with On This Day & Favorites Widgets
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('.on-this-day-panel, .otd-header').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.favorites-widget, .fav-widget-header').first()).toBeVisible({ timeout: 10000 });

    // 2. Seasons Archive with Progression & What-If Simulator Tabs
    await page.goto('/seasons/2021');
    await expect(page.locator('.seasons-archive-page, .archive-layout').first()).toBeVisible();
    const whatIfTab = page.locator('.season-tab-btn', { hasText: 'WHAT-IF' });
    if (await whatIfTab.count() > 0) {
      await whatIfTab.first().click();
      await expect(page.locator('.what-if-simulator, .what-if-controls').first()).toBeVisible({ timeout: 10000 });
    }

    // 2b. Driver Comparison & Mutual Teammate H2H
    await page.goto('/drivers/compare?a=HAM&b=VER');
    await expect(page.locator('.driver-comparison-page, h1').first()).toBeVisible();
    await expect(page.locator('.comparison-matrix-panel')).toBeVisible();

    // 3. Teams Archive
    await page.goto('/teams');
    await expect(page.locator('.teams-archive-page, .archive-layout').first()).toBeVisible();

    // 4. Drivers Archive & Helmet Avatars
    await page.goto('/drivers');
    await expect(page.locator('.drivers-archive-page, .archive-layout').first()).toBeVisible();

    // 5. Circuits Archive
    await page.goto('/circuits');
    await expect(page.locator('.circuits-archive-page, .archive-layout').first()).toBeVisible();

    // 6. Garage / Paddock Telemetry Bay
    await page.goto('/garage');
    await expect(page.locator('.garage-container, .garage-page').first()).toBeVisible();
    await expect(page.locator('#team-select')).toBeVisible();
    await expect(page.locator('.sim-stats-grid')).toBeVisible();

    // 7. Live Standings & Calendar
    await page.goto('/standings');
    await expect(page.locator('.standings-container, .live-standings-page').first()).toBeVisible();

    // 8. 3D Cars Lab (SwiftShader WebGL rendering verification)
    await page.goto('/cars?debug=perf');
    await expect(page.locator('.cars-archive-container, h1').first()).toBeVisible();
    // Allow canvas initialization time under software rasterization
    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible({ timeout: 15000 });

    // Verify GPU Profiler overlay in ?debug=perf mode
    await expect(page.locator('.perf-debug-box')).toBeVisible({ timeout: 10000 });

    // Test camera recenter button
    const recenterBtn = page.locator('.camera-reset-btn');
    await expect(recenterBtn).toBeVisible();
    await recenterBtn.click();

    // Test aero toggle
    const aeroBtn = page.locator('.aero-toggle-btn');
    await expect(aeroBtn).toBeVisible();
    await aeroBtn.click();

    // Test 2026 Regulation Inspector toggle
    const regBtn = page.locator('.reg-2026-toggle-btn');
    if (await regBtn.count() > 0) {
      await expect(regBtn).toBeVisible();
      await regBtn.click();
      await expect(page.locator('.reg-2026-panel, .aero-mode-btn').first()).toBeVisible({ timeout: 10000 });
    }

    // 9. 3D Telemetry Ghost-Lap Replay & Strategy Analytics
    await page.goto('/telemetry');
    await expect(page.locator('.telemetry-hub-page, h1').first()).toBeVisible();
    await expect(page.locator('.ghost-canvas-container canvas').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.transport-play-btn')).toBeVisible();

    // Test Play/Pause transport toggle
    const playBtn = page.locator('.transport-play-btn');
    await expect(playBtn).toBeVisible({ timeout: 10000 });
    await playBtn.click();
    await expect(playBtn).toHaveClass(/playing/, { timeout: 10000 });
    await playBtn.click();

    // Test Strategy & Stint Degradation Tab
    const strategyTabBtn = page.locator('.tab-btn', { hasText: 'STRATEGY' });
    await strategyTabBtn.click({ force: true });
    await expect(page.locator('.strategy-analytics-card')).toBeVisible({ timeout: 10000 });
    const fuelBtn = page.locator('.fuel-toggle-btn');
    await expect(fuelBtn).toBeVisible();
    await fuelBtn.click({ force: true });

    // Test 20-Car Timing Tower Tab
    const towerTabBtn = page.locator('.tab-btn', { hasText: 'TIMING TOWER' });
    await towerTabBtn.click({ force: true });
    await expect(page.locator('.timing-tower-card')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.timing-row').first()).toBeVisible();

    // 10. Explainable AI Race Historian & SQL Lab (Offline SQLite-WASM)
    await page.goto('/historian');
    await expect(page.locator('.historian-page-root, h1').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.sql-inspector-card')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.copy-sql-btn').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.engine-status-pill')).toBeVisible({ timeout: 10000 });

    // Test Temple of Speed (Monza) Masters preset (real SQLite-WASM execution)
    const monzaPresetBtn = page.locator('.preset-chip', { hasText: 'Monza' });
    await expect(monzaPresetBtn).toBeVisible({ timeout: 15000 });
    await monzaPresetBtn.click();

    // Verify all-time records: Michael Schumacher with 5 wins
    const resultsTable = page.locator('.historian-table');
    await expect(resultsTable).toContainText('Michael Schumacher', { timeout: 15000 });
    await expect(resultsTable).toContainText('5');

    // Test custom CodeMirror SQL editing and live execution
    const cmContent = page.locator('.cm-content[role="textbox"]');
    await cmContent.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type("SELECT name FROM circuit WHERE id = 'monza';", { delay: 10 });

    const runSqlBtn = page.locator('.sql-run-btn');
    await runSqlBtn.click();
    await expect(resultsTable).toContainText('Monza', { timeout: 15000 });

    // Test toggling view mode
    const chartToggleBtn = page.locator('.view-toggle-btn', { hasText: 'BAR CHART' });
    await chartToggleBtn.click();
    await expect(page.locator('.results-chart-wrapper')).toBeVisible();

    // 11. Monte Carlo Pit-Wall Strategy & Undercut Simulator
    await page.goto('/pitwall');
    await expect(page.locator('.pitwall-page-root, h1').first()).toBeVisible();
    await expect(page.locator('.strategy-result-card').first()).toBeVisible({ timeout: 10000 });
    const exportPosterBtn = page.locator('.export-poster-btn');
    await expect(exportPosterBtn).toBeVisible();

    // Assert zero uncaught exceptions across all pages
    expect(pageErrors).toEqual([]);
  });
});
