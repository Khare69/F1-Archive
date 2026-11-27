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

  test('Navigation: renders 5 hubs, redirects legacy routes, and eliminates visual noise', async ({ page }) => {
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

  test('Navigation: deep links render immediately with zero splash overlay', async ({ page }) => {
    await page.goto('/drivers/VER');
    await expect(page.locator('#main-content')).toBeVisible();

    // Verify zero welcome splash
    const splash = page.locator('.welcome-experience, .welcome-splash, .welcome-overlay');
    await expect(splash).toHaveCount(0);
  });

  test('Navigation: command palette search and keyboard shortcuts dialog', async ({ page }) => {
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

  test('Storage: persists queries in IndexedDB with zero localStorage bloat', async ({ page }) => {
    await page.goto('/standings');
    await expect(page.locator('.standings-container, .live-standings-page').first()).toBeVisible({ timeout: 15000 });

    const f1Cache = await page.evaluate(() => window.localStorage.getItem('F1_QUERY_CACHE'));
    const offlineCache = await page.evaluate(() => window.localStorage.getItem('REACT_QUERY_OFFLINE_CACHE'));

    expect(f1Cache).toBeNull();
    expect(offlineCache).toBeNull();
  });

  test('3D Lab: preserves WebGL canvas DOM element identity across sub-route parameter changes', async ({ page }) => {
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
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });

    // Test Play/Pause transport toggle
    const playBtn = page.locator('button[aria-label*="Ghost Lap"]');
    await expect(playBtn).toBeVisible({ timeout: 10000 });
    await playBtn.click();
    await expect(playBtn).toHaveAttribute('aria-label', /Pause Ghost Lap/, { timeout: 10000 });
    await playBtn.click();

    // Test Strategy & Stint Degradation Tab
    const strategyTabBtn = page.locator('button', { hasText: 'STRATEGY' });
    await strategyTabBtn.click({ force: true });
    const fuelBtn = page.locator('button', { hasText: /FUEL-CORRECTED|RAW LAP/ });
    await expect(fuelBtn).toBeVisible({ timeout: 10000 });
    await fuelBtn.click({ force: true });

    // Test 20-Car Timing Tower Tab
    const towerTabBtn = page.locator('button', { hasText: 'TIMING TOWER' });
    await towerTabBtn.click({ force: true });
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });

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
    await expect(page.locator('h1', { hasText: /Race Strategy/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[aria-label*="Monte Carlo"], [aria-label*="Stint Pace"]').first()).toBeVisible({ timeout: 10000 });

    // Assert zero uncaught exceptions across all pages
    expect(pageErrors).toEqual([]);
  });

  test('Drivers: shareable head-to-head comparison deep link', async ({ page }) => {
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

  test('Drivers: virtualized driver directory and filter navigation', async ({ page }) => {
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

  test('Standings: handles upstream API outages with archive recovery fallback', async ({ page }) => {
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

  test('Constructors: 2026 grid and historic constructor archives', async ({ page }) => {
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

  test('Circuits: switches between 2D SVG and 3D elevation views with keyboard shortcuts', async ({ page }) => {
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

  test('Circuits: corner telemetry deep links and filter inspection', async ({ page }) => {
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

  test('Circuits: maintains WebGL context stability across rapid route transitions', async ({ page }) => {
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

  test('Telemetry: telemetry provenance badges and experimental simulation quarantine', async ({ page }) => {
    await page.goto('/telemetry');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    // 1. Confirm historical packs are visible and madrid-2026-sim is hidden by default
    await expect(page.locator('button', { hasText: 'HAM vs VER' }).first()).toBeVisible({ timeout: 10000 });
    const simPill = page.locator('button', { hasText: 'ALO vs SAI' });
    await expect(simPill).toHaveCount(0);

    // 2. Click "Include Experimental Labs" toggle
    const labsToggle = page.locator('button', { hasText: /INCLUDE EXPERIMENTAL LABS/i });
    await labsToggle.click();

    // 3. Select the 2026 Madrid simulation pack
    const madridPill = page.locator('button', { hasText: 'ALO vs SAI' }).first();
    await expect(madridPill).toBeVisible({ timeout: 10000 });
    await madridPill.click();

    // 4. Assert EXPERIMENTAL // SIMULATION badge and disclaimer banner render
    await expect(page.locator('text=EXPERIMENTAL // SIMULATION').first()).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('text=Theoretical 2026 active aero & manual override simulation').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('Telemetry: synchronized multi-channel traces and spacebar playback', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/telemetry');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    // Assert stacked uPlot charts mount
    const uplotEl = page.locator('.uplot, [aria-label="Multi-channel telemetry comparison chart"]').first();
    await expect(uplotEl).toBeVisible({ timeout: 15000 });

    // Press Space to toggle Ghost Lap playback
    const playPauseBtn = page.locator('button[aria-label*="Ghost Lap"]');
    await expect(playPauseBtn).toBeVisible({ timeout: 10000 });
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    // Verify deep link hydrates cleanly with 0 uncaught errors
    await page.goto('/telemetry?pack=silverstone-2024-ham-vs-ver&speed=2');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Hamilton vs. Verstappen').first()).toBeVisible({ timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('Seasons: focus-plus-context season progression chart', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/seasons/2021?view=chart');
    await expect(page.locator('h1', { hasText: '2021' })).toBeVisible({ timeout: 10000 });

    // Assert ECharts progression canvas/wrapper mounts
    const progressionChart = page.locator('[aria-label*="Progression"]').first();
    await expect(progressionChart).toBeVisible({ timeout: 15000 });

    // Toggle a driver focus pill (e.g. VER)
    const verPill = page.locator('button', { hasText: 'VER' }).first();
    await expect(verPill).toBeVisible({ timeout: 10000 });
    await verPill.click();

    expect(pageErrors).toEqual([]);
  });

  test('Pit Wall: strategy simulator parameter editing and URL state hydration', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/pitwall?pitLoss=24.5&seed=42');
    await expect(page.locator('h1', { hasText: /Race Strategy/i })).toBeVisible({ timeout: 10000 });

    // 1. Assert EXPERIMENTAL // SIMULATION badge renders
    await expect(page.locator('text=EXPERIMENTAL // SIMULATION').first()).toBeVisible({ timeout: 10000 });

    // 2. Confirm Pit Loss input hydrates to 24.5
    const pitLossInput = page.locator('#pit-loss-input');
    await expect(pitLossInput).toHaveValue('24.5');

    // 3. Adjust Safety Car probability
    const scInput = page.locator('#sc-prob-input');
    await scInput.fill('75');

    // 4. Confirm Monte Carlo ECharts analytics update
    const analyticsPanel = page.locator('[aria-label*="Monte Carlo"], [aria-label*="Stint Pace"]').first();
    await expect(analyticsPanel).toBeVisible({ timeout: 15000 });

    // Assert 0 uncaught runtime errors
    expect(pageErrors).toEqual([]);
  });

  test('3D Lab: switches between 5 historical technical eras with URL synchronization', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/lab/ferrari');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    // 1. Confirm 5 era buttons exist
    const era1950Btn = page.locator('button', { hasText: '1950s' });
    const era2004Btn = page.locator('button', { hasText: '2004' });
    await expect(era1950Btn).toBeVisible();
    await expect(era2004Btn).toBeVisible();

    // 2. Switch to 1950s Front-Engine Era
    await era1950Btn.click();
    await expect(page).toHaveURL(/era=1950s_front_engine/);
    await expect(page.locator('text=Front-Engine Grand Prix Era').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=N/A (Unregulated)').first()).toBeVisible({ timeout: 10000 });

    // 3. Switch to 2004 V10 Pinnacle Era
    await era2004Btn.click();
    await expect(page).toHaveURL(/era=2004_v10/);
    await expect(page.locator('text=3.0L V10 High-Downforce Pinnacle').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=605 KG').first()).toBeVisible({ timeout: 10000 });

    // 4. Switch Constructor to McLaren while preserving era in URL query
    const mclarenBtn = page.locator('button[aria-label*="McLaren"], button[aria-label*="mclaren"]').first();
    await mclarenBtn.click();
    await expect(page).toHaveURL(/\/lab\/mclaren\?era=2004_v10/);
    await expect(page.locator('h1', { hasText: /McLaren/i })).toBeVisible({ timeout: 10000 });

    expect(pageErrors).toEqual([]);
  });

  test('3D Lab: 2026 technical regulations simulation and active aerodynamics articulation', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/lab/redbull?era=2026_active_aero');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    // 1. Verify 2026 Experimental simulation badge & disclaimer
    await expect(page.locator('text=2026 REGULATION SIMULATION').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Active Aero & 50/50 Hybrid Concept').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=768 KG').first()).toBeVisible({ timeout: 10000 });

    // 2. Locate Active Aero Mode Toggle in viewport controls dock
    const aeroModeBtn = page.locator('button[aria-label*="Active Aero Mode"], button[aria-label*="Active Wing Mode"]').first();
    await expect(aeroModeBtn).toBeVisible({ timeout: 10000 });

    // Click to toggle between Corner (Z-Mode) and Straight (X-Mode)
    await aeroModeBtn.click();
    await page.waitForTimeout(300);

    expect(pageErrors).toEqual([]);
  });

  test('3D Lab: interactive car anatomy hotspots and two-tab inspection panel', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/lab/ferrari?era=2024_ground_effect');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    // 1. Find and click an interactive anatomy hotspot button
    const hotspotBtn = page.locator('button[aria-label*="Inspect"]').first();
    await expect(hotspotBtn).toBeVisible({ timeout: 15000 });
    await hotspotBtn.click({ force: true });

    // 2. Assert CarAnatomyPanel opens
    const panel = page.locator('div[role="region"][aria-label*="Anatomy Inspector"]').first();
    await expect(panel).toBeVisible({ timeout: 10000 });

    // 3. Confirm Plain English tab is default
    await expect(page.locator('button[role="tab"][aria-selected="true"]', { hasText: /PLAIN ENGLISH/i })).toBeVisible();

    // 4. Switch to Technical Spec tab
    const specTab = page.locator('button[role="tab"]', { hasText: /TECHNICAL SPEC/i });
    await specTab.click();
    await expect(page.locator('button[role="tab"][aria-selected="true"]', { hasText: /TECHNICAL SPEC/i })).toBeVisible();

    // 5. Close panel
    const closeBtn = page.locator('button[aria-label="Close anatomy panel"]');
    await closeBtn.click();
    await expect(panel).not.toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('3D Lab: WebGL canvas DOM element identity and shader stability across era switches', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/lab/ferrari');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Record DOM canvas element reference
    const canvasHandle = await canvas.elementHandle();

    // Switch team to Mercedes
    const mercBtn = page.locator('button[aria-label*="Mercedes"], button[aria-label*="mercedes"]').first();
    await mercBtn.click();
    await page.waitForTimeout(400);

    // Assert same canvas DOM element is still mounted and attached
    const isStillAttached = await canvasHandle?.evaluate((el) => el.isConnected);
    expect(isStillAttached).toBe(true);

    // Switch era to 1988
    const era1988Btn = page.locator('button', { hasText: '1988' });
    await era1988Btn.click();
    await page.waitForTimeout(400);

    const isStillAttachedAfterEra = await canvasHandle?.evaluate((el) => el.isConnected);
    expect(isStillAttachedAfterEra).toBe(true);

    expect(pageErrors).toEqual([]);
  });

  test('Audience Depth: persists Learn, Pro, Dev preference and renders contextual glossary tooltips', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await expect(page.locator('#main-content')).toBeVisible();

    // Default mode is 'enthusiast' (Pro)
    const initialMode = await page.evaluate(() => localStorage.getItem('f1_archive_experience_mode') || 'enthusiast');
    expect(initialMode).toBe('enthusiast');

    // Switch to Learn (beginner) mode via direct button
    const learnBtn = page.getByTestId('mode-btn-beginner');
    await expect(learnBtn).toBeVisible();
    await learnBtn.click();

    // Assert persistence
    const savedLearnMode = await page.evaluate(() => localStorage.getItem('f1_archive_experience_mode'));
    expect(savedLearnMode).toBe('beginner');

    // Verify insight banner is rendered in Learn mode
    await expect(page.getByText(/WHY THIS MATTERS/i)).toBeVisible();

    // Switch to Dev mode
    const devBtn = page.getByTestId('mode-btn-developer');
    await devBtn.click();

    const savedDevMode = await page.evaluate(() => localStorage.getItem('f1_archive_experience_mode'));
    expect(savedDevMode).toBe('developer');

    // Reload page and ensure Dev mode persists
    await page.reload();
    await expect(page.locator('#main-content')).toBeVisible();
    const reloadedMode = await page.evaluate(() => localStorage.getItem('f1_archive_experience_mode'));
    expect(reloadedMode).toBe('developer');

    expect(pageErrors).toEqual([]);
  });

  test('Dev Mode: slide-over SQL query inspector with CodeMirror 6 drawer', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('f1_archive_experience_mode', 'developer'));
    await page.reload();

    // Find Inspect Query button
    const inspectBtn = page.getByRole('button', { name: /Inspect Query/i }).first();
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();

    // Assert CodeMirror 6 drawer opens
    await expect(page.getByTestId('inspect-query-drawer')).toBeVisible();
    await expect(page.getByText(/SQL INSPECTOR/i)).toBeVisible();
    await expect(page.locator('.cm-editor')).toBeVisible();

    // Click Run Query
    const runBtn = page.getByRole('button', { name: /Run Query|EXECUTE/i });
    await runBtn.click();

    // Close drawer via Escape key
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('inspect-query-drawer')).not.toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('Architecture & Docs: interactive Architecture Explorer and live SQLite schema inspector', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/docs');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/ARCHITECTURE/i);

    // Tab 1: Data Pipeline
    await expect(page.getByText(/01 \/\/ SOURCES/i)).toBeVisible();

    // Tab 2: SQLite Schema
    const schemaTab = page.getByRole('tab', { name: /SQLite Schema/i });
    await schemaTab.click();
    await expect(page.getByText('driver', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('circuit', { exact: true }).first()).toBeVisible();

    // Click Query Table on driver
    const queryDriverBtn = page.locator('button', { hasText: 'Query Table' }).first();
    await queryDriverBtn.click();
    await expect(page.getByTestId('inspect-query-drawer')).toBeVisible();
    await expect(page.getByText(/SQL INSPECTOR/i)).toBeVisible();

    // Close drawer
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('inspect-query-drawer')).not.toBeVisible();

    // Tab 4: ADRs & Legal
    const adrTab = page.getByRole('tab', { name: /ADRs & Legal/i });
    await adrTab.click();
    await expect(page.getByText('ADR-0001')).toBeVisible();
    await expect(page.getByText('ADR-0005')).toBeVisible();
    await expect(page.getByText(/Formula One Licensing B\.V\./i).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('Home: Bento dashboard grid, On This Day in F1, and starter story navigation', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await expect(page.locator('#main-content')).toBeVisible();

    // 1. Verify Header badge in hero
    await expect(page.getByText(/HISTORICAL TELEMETRY VAULT \/\/ 1950–2026/i)).toBeVisible();

    // 2. Verify Bento grid widgets: Live Standings, Favorites, On This Day
    await expect(page.getByText(/CHAMPIONSHIP STANDINGS/i)).toBeVisible();
    await expect(page.getByText(/Paddock Favorites/i)).toBeVisible();
    await expect(page.locator('.on-this-day-panel')).toBeVisible();

    // 3. Verify Discovery / Starter Story cards
    const starterStory = page.getByRole('link', { name: /1988 McLaren MP4\/4/i });
    await expect(starterStory).toBeVisible();
    await starterStory.click();
    await expect(page).toHaveURL(/\/seasons/);

    expect(pageErrors).toEqual([]);
  });
});
