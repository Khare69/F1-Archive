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

    // 1. Home View
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    // 2. Seasons Archive
    await page.goto('/seasons');
    await expect(page.locator('.seasons-archive-page, .archive-layout').first()).toBeVisible();

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

    // Assert zero uncaught exceptions across all pages
    expect(pageErrors).toEqual([]);
  });
});
