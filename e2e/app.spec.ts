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

  test('Phase 3: 5-hub navigation, legacy redirects, and zero texture noise', async ({ page }) => {
    await page.goto('/');

    // 1. Assert exactly 5 desktop navigation hub links
    const hubItems = page.locator('[data-testid="hub-nav-item"]');
    await expect(hubItems).toHaveCount(5);

    // 2. Assert /garage redirects cleanly to /lab
    await page.goto('/garage');
    await expect(page).toHaveURL(/\/lab/);

    // 3. Assert /cars/ferrari redirects cleanly to /lab/ferrari
    await page.goto('/cars/ferrari');
    await expect(page).toHaveURL(/\/lab\/ferrari/);

    // 4. Assert 0 elements match legacy carbon or grid overlays
    const noiseElements = page.locator('.carbon-texture, .bg-grid-overlay');
    await expect(noiseElements).toHaveCount(0);
  });

  test('Phase 3: Deep link renders immediately with zero splash overlay', async ({ page }) => {
    await page.goto('/drivers/VER');
    await expect(page.locator('#main-content')).toBeVisible();

    // Verify zero welcome splash
    const splash = page.locator('.welcome-experience, .welcome-splash, .welcome-overlay');
    await expect(splash).toHaveCount(0);
  });

  test('Phase 3: cmdk + Fuse.js command palette & "?" shortcuts dialog', async ({ page }) => {
    await page.goto('/');

    // 1. Press Ctrl+K to open search palette
    await page.keyboard.press('ControlOrMeta+k');
    const searchDialog = page.locator('[data-testid="search-palette-dialog"]');
    await expect(searchDialog).toBeVisible({ timeout: 10000 });

    // 2. Search for "verstap" and verify Max Verstappen appears
    await page.keyboard.type('verstap', { delay: 50 });
    await expect(page.locator('text=Max Verstappen').first()).toBeVisible({ timeout: 10000 });

    // 3. Press Escape to close
    await page.keyboard.press('Escape');
    await expect(searchDialog).not.toBeVisible();

    // 4. Press ? to open keyboard shortcuts modal
    await page.keyboard.press('?');
    const shortcutsDialog = page.locator('[data-testid="keyboard-shortcuts-dialog"]');
    await expect(shortcutsDialog).toBeVisible({ timeout: 10000 });

    // 5. Press Escape to close
    await page.keyboard.press('Escape');
    await expect(shortcutsDialog).not.toBeVisible();
  });

  test('Phase 3: IndexedDB query persistence with zero localStorage bloat', async ({ page }) => {
    await page.goto('/standings');
    await expect(page.locator('.standings-container, .live-standings-page').first()).toBeVisible();

    const f1Cache = await page.evaluate(() => window.localStorage.getItem('F1_QUERY_CACHE'));
    const offlineCache = await page.evaluate(() => window.localStorage.getItem('REACT_QUERY_OFFLINE_CACHE'));

    expect(f1Cache).toBeNull();
    expect(offlineCache).toBeNull();
  });

  test('Phase 3: WebGL canvas DOM element identity preserved across sub-route parameter changes', async ({ page }) => {
    await page.goto('/lab/ferrari');
    await expect(page.locator('.cars-archive-container, h1').first()).toBeVisible();

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Attach marker to the canvas element
    await page.evaluate(() => {
      const el = document.querySelector('canvas');
      if (el) (window as any).__testCanvasMarker = el;
    });

    // In-app parameter navigation to /lab/mclaren
    await page.evaluate(() => {
      window.history.pushState({}, '', '/lab/mclaren');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Assert same canvas DOM element instance is preserved
    const isSameCanvas = await page.evaluate(() => {
      const current = document.querySelector('canvas');
      return current !== null && current === (window as any).__testCanvasMarker;
    });

    expect(isSameCanvas).toBe(true);
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

    // 6. Garage / Paddock Telemetry Bay (redirects cleanly to /lab)
    await page.goto('/garage');
    await expect(page).toHaveURL(/\/lab/);
    await expect(page.locator('.cars-archive-container, h1').first()).toBeVisible();

    // 7. Live Standings & Calendar
    await page.goto('/standings');
    await expect(page.locator('.standings-container, .live-standings-page').first()).toBeVisible();

    // 8. 3D Cars Lab (SwiftShader WebGL rendering verification)
    await page.goto('/lab?debug=perf');
    await expect(page.locator('.cars-archive-container, h1').first()).toBeVisible();
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

  test('Phase 4: Shareable Comparison Deep Link (C-22, C-25)', async ({ page }) => {
    await page.goto('/drivers/compare?d1=SEN&d2=PRO&mode=normalized');
    await expect(page.locator('#main-content')).toBeVisible();

    // Assert Ayrton Senna and Alain Prost render
    await expect(page.locator('h2', { hasText: 'Ayrton Senna' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2', { hasText: 'Alain Prost' })).toBeVisible({ timeout: 10000 });

    // Assert Teammate H2H section displays McLaren partnership
    await expect(page.locator('text=TEAMMATE HEAD-TO-HEAD BATTLE').first()).toBeVisible({ timeout: 10000 });

    // Assert zero NaN strings appear anywhere in document body
    const bodyText = await page.innerText('body');
    expect(bodyText).not.toContain('NaN');
  });

  test('Phase 4: Virtualized Drivers Table & URL Filter (C-23, C-25)', async ({ page }) => {
    await page.goto('/drivers?filter=champions');
    await expect(page.locator('#main-content')).toBeVisible();

    // Verify champions filter tab is active
    const championsTab = page.locator('button', { hasText: 'CHAMPIONS' });
    await expect(championsTab).toHaveClass(/active/);

    // Verify World Champions render inside the virtualized timing-tower table
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Click WINS sort header to toggle sort
    const winsHeader = page.locator('th', { hasText: 'WINS' });
    await winsHeader.click();

    // Verify rows rendered and bounded by virtualizer
    const rowCount = await page.locator('tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBeLessThanOrEqual(50);
  });

  test('Phase 4: Live Standings API Outage Fallback (C-24, F-10)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Intercept Jolpica with 429
    await page.route('https://api.jolpi.ca/**', (route) =>
      route.fulfill({ status: 429, contentType: 'application/json', body: '{"error":"Too Many Requests"}' })
    );

    await page.goto('/standings');
    await expect(page.locator('#main-content')).toBeVisible();

    // Verify recovery alert banner renders
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText('ARCHIVE RECOVERY MODE');
    await expect(page.locator('button', { hasText: 'RETRY FEED' })).toBeVisible();

    // Zero uncaught runtime page errors
    expect(pageErrors).toEqual([]);
  });

  test('Phase 4: 2026 Constructors Grid & Trademark-Safe Badges (C-26)', async ({ page }) => {
    await page.goto('/teams');
    await expect(page.locator('#main-content')).toBeVisible();

    // Verify Audi and Cadillac exist on 2026 grid
    await expect(page.locator('text=Audi').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Cadillac').first()).toBeVisible({ timeout: 10000 });

    // Switch to Historic Constructors
    const historicTab = page.locator('button', { hasText: 'HISTORIC' });
    await historicTab.click();
    await expect(page).toHaveURL(/\?grid=historic/);

    // Click on Brawn GP or inspect Brawn GP
    const brawnRow = page.locator('tbody tr', { hasText: 'Brawn' }).first();
    await expect(brawnRow).toBeVisible({ timeout: 10000 });
    await brawnRow.click();

    // Verify Brawn GP shows 2009 (not 1950)
    await expect(page.locator('text=2009').first()).toBeVisible({ timeout: 10000 });
  });

  test('Phase 5: 2D SVG vs. 3D Elevation Mode & Keyboard Shortcuts (C-28, C-29)', async ({ page }) => {
    await page.goto('/circuits/spa-francorchamps');
    await expect(page.locator('.circuits-archive-page')).toBeVisible({ timeout: 10000 });

    // Assert real elevation delta and HUD control render
    await expect(page.locator('text=ELEVATION CHANGE')).toBeVisible();
    await expect(page.locator('text=103m').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=ELEVATION SCALE:')).toBeVisible();

    // Switch to 2D SVG by pressing '2'
    await page.keyboard.press('2');
    const svgMap = page.locator('[data-testid="track-2d-svg"]');
    await expect(svgMap).toBeVisible({ timeout: 10000 });

    // Assert 0 canvas elements mounted in 2D mode
    const canvasCount = await page.locator('.circuits-archive-page canvas').count();
    expect(canvasCount).toBe(0);

    // Switch ribbon color mode to Elevation
    const elevColorBtn = page.getByRole('button', { name: 'Elevation', exact: true });
    await elevColorBtn.click();

    // Press '3' to return to 3D elevation mode
    await page.keyboard.press('3');
    const canvas = page.locator('.circuits-archive-page canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('Phase 5: Corner DNA Deep Link & Filter Inspection (C-30, C-31)', async ({ page }) => {
    // Navigate straight to Turn 3 (Eau Rouge) in 2D mode
    await page.goto('/circuits/spa-francorchamps?view=2d&corner=3');
    await expect(page.locator('.circuits-archive-page')).toBeVisible({ timeout: 10000 });

    // Assert Turn 3 telemetry renders immediately
    await expect(page.locator('text=305 km/h').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=G8').first()).toBeVisible();
    await expect(page.locator('text=4.8 G').first()).toBeVisible();

    // Toggle Overtake filter
    const overtakeFilter = page.locator('button', { hasText: /Overtake/i });
    await overtakeFilter.click();

    // Select Turn 1 (La Source)
    const turn1Btn = page.locator('button', { hasText: 'La Source' }).first();
    await expect(turn1Btn).toBeVisible({ timeout: 10000 });
    await turn1Btn.click({ force: true });

    // Assert Turn 1 metrics render with zero NaN or null text
    await expect(page.locator('text=68 km/h').first()).toBeVisible();
    await expect(page.locator('text=5.2 G').first()).toBeVisible();

    const bodyText = await page.locator('.circuits-archive-page').textContent();
    expect(bodyText).not.toContain('null km');
    expect(bodyText).not.toContain('NaN');
  });

  test('Phase 5: 10x Rapid Circuit & Hub Route-Switch WebGL Stability (C-32, F-38)', async ({ page }) => {
    const webglErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('THREE.WebGLRenderer: Context Lost') || text.includes('CONTEXT_LOST_WEBGL')) {
        webglErrors.push(text);
      }
    });
    page.on('pageerror', (err) => webglErrors.push(err.message));

    const routes = [
      '/circuits/spa-francorchamps',
      '/circuits/monza',
      '/circuits/monaco',
      '/circuits/silverstone',
      '/circuits/suzuka',
      '/lab',
      '/circuits/interlagos',
      '/telemetry',
      '/circuits/austin',
      '/circuits/spa-francorchamps'
    ];

    for (const r of routes) {
      await page.goto(r);
      await expect(page.locator('#main-content, .circuits-archive-page, .telemetry-hub-page, .cars-archive-page').first()).toBeVisible({ timeout: 10000 });
    }

    expect(webglErrors).toEqual([]);
  });
});
