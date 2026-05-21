/**
 * scraper.ts – Playwright scraper for baocao.ghn.vn Looker Studio
 * Runs server-side only (Next.js API routes / Node.js)
 */

import { chromium, type Page, type Browser } from 'playwright';

const GHN_REPORT_URL = 'https://baocao.ghn.vn/dashboards/63bd175cd4435a369fade8f5';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScrapeOptions {
  username: string;
  password: string;
  /** Date range in YYYY-MM-DD format */
  dateFrom: string;
  dateTo: string;
  headless?: boolean;
}

export interface ScrapedOpsRow {
  capQuanLy: string;
  chiTiet: string;
  loaiHang: string;
  time: string;
  volume: number;
  pctGan: number;
  pctGTC: number;
  pctChuyenTra: number;
  leadtime: number;
}

export interface ScrapeResult {
  success: boolean;
  rows: ScrapedOpsRow[];
  error?: string;
  scrapedAt: string;
  totalRows: number;
}

// ─── Login ────────────────────────────────────────────────────────────────────

async function loginGHN(page: Page, username: string, password: string): Promise<boolean> {
  console.log('[Scraper] Navigating to report URL...');
  await page.goto(GHN_REPORT_URL, { waitUntil: 'networkidle', timeout: 30000 });

  // Check if login form appears
  const loginForm = await page.locator('input[type="text"], input[name="username"], input[placeholder*="user"], input[placeholder*="email"]').first();
  const isLoginPage = await loginForm.isVisible({ timeout: 5000 }).catch(() => false);

  if (!isLoginPage) {
    console.log('[Scraper] Already logged in or no login required');
    return true;
  }

  console.log('[Scraper] Login form detected, filling credentials...');

  // Fill username
  await loginForm.fill(username);

  // Fill password
  const pwInput = page.locator('input[type="password"]').first();
  await pwInput.fill(password);

  // Submit
  const submitBtn = page.locator('button[type="submit"], button:has-text("Đăng nhập"), button:has-text("Login")').first();
  await submitBtn.click();

  // Wait for navigation after login
  await page.waitForLoadState('networkidle', { timeout: 20000 });
  console.log('[Scraper] Login completed, current URL:', page.url());

  return true;
}

// ─── Navigate to correct report page ─────────────────────────────────────────

async function navigateToOpsReport(page: Page): Promise<void> {
  console.log('[Scraper] Looking for "[VÙNG] BÁO CÁO XỬ LÝ THÀNH CÔNG TRONG NGÀY"...');

  // Try clicking on the report link in the table of contents
  const reportLink = page.locator('text=[VÙNG] BÁO CÁO XỬ LÝ THÀNH CÔNG TRONG NGÀY').first();
  const isVisible = await reportLink.isVisible({ timeout: 5000 }).catch(() => false);

  if (isVisible) {
    await reportLink.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    console.log('[Scraper] Navigated to ops report page');
  } else {
    console.log('[Scraper] Direct link not found, trying navigation arrow...');
    // Try next page button
    const nextBtn = page.locator('[aria-label="Next page"], .next-page, button:has-text("›")').first();
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(2000);
    }
  }
}

// ─── Apply date filter ────────────────────────────────────────────────────────

async function applyDateFilter(page: Page, dateFrom: string, dateTo: string): Promise<void> {
  console.log(`[Scraper] Applying date filter: ${dateFrom} → ${dateTo}`);

  // Looker Studio date picker – try multiple selectors
  const dateControl = page.locator('[data-testid="date-range-control"], .date-range-picker, [aria-label*="date"], [aria-label*="Date"]').first();
  const hasDateControl = await dateControl.isVisible({ timeout: 5000 }).catch(() => false);

  if (!hasDateControl) {
    console.log('[Scraper] No date control found, using default date range');
    return;
  }

  await dateControl.click();
  await page.waitForTimeout(1000);

  // Try to find "Custom" date range option
  const customOption = page.locator('text=Custom, text=Tùy chỉnh, [data-value="CUSTOM"]').first();
  if (await customOption.isVisible({ timeout: 3000 }).catch(() => false)) {
    await customOption.click();
    await page.waitForTimeout(500);
  }

  // Fill start date
  const startInput = page.locator('input[placeholder*="Start"], input[aria-label*="start"], input[aria-label*="Bắt đầu"]').first();
  if (await startInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startInput.fill(dateFrom);
  }

  // Fill end date
  const endInput = page.locator('input[placeholder*="End"], input[aria-label*="end"], input[aria-label*="Kết thúc"]').first();
  if (await endInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await endInput.fill(dateTo);
  }

  // Apply
  const applyBtn = page.locator('button:has-text("Apply"), button:has-text("Áp dụng"), button:has-text("OK")').first();
  if (await applyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await applyBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  }

  console.log('[Scraper] Date filter applied');
}

// ─── Extract table data ───────────────────────────────────────────────────────

async function extractTableData(page: Page): Promise<ScrapedOpsRow[]> {
  console.log('[Scraper] Extracting table data...');

  // Looker Studio embeds the actual dashboard in an iframe
  // We need to look in both main page and iframes
  const frames = page.frames();
  let tableFound = false;

  for (const frame of frames) {
    try {
      // Try to find table in this frame without failing
      const table = await frame.locator('table, [role="table"], .data-table, [role="rowgroup"]').first();
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        tableFound = true;
        break;
      }
    } catch (e) {
      // Ignore frame errors
    }
  }

  if (!tableFound) {
    console.warn('[Scraper] Table not found in any frame, trying evaluate anyway...');
  } else {
    await page.waitForTimeout(2000); // Let data fully render
  }

  const rows: ScrapedOpsRow[] = [];

  // Looker Studio renders tables in iframe or shadow DOM
  // Try multiple extraction strategies

  // Strategy 1: Direct table extraction
  const tableRows = await page.evaluate(() => {
    const results: string[][] = [];

    // Find all tables on page
    const tables = document.querySelectorAll('table');
    for (const table of tables) {
      const trs = table.querySelectorAll('tr');
      for (const tr of trs) {
        const cells = Array.from(tr.querySelectorAll('td, th')).map(td => td.textContent?.trim() || '');
        if (cells.length >= 5 && cells.some(c => c.length > 0)) {
          results.push(cells);
        }
      }
    }

    // Also try grid/flex table patterns used by Looker Studio
    const gridRows = document.querySelectorAll('[role="row"]');
    for (const row of gridRows) {
      const cells = Array.from(row.querySelectorAll('[role="gridcell"], [role="columnheader"]'))
        .map(c => c.textContent?.trim() || '');
      if (cells.length >= 5) {
        results.push(cells);
      }
    }

    // Now do the same for all iframes (Looker Studio uses iframes heavily)
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) continue;

        const iframeTables = doc.querySelectorAll('table');
        for (const table of iframeTables) {
          const trs = table.querySelectorAll('tr');
          for (const tr of trs) {
            const cells = Array.from(tr.querySelectorAll('td, th')).map(td => td.textContent?.trim() || '');
            if (cells.length >= 5 && cells.some(c => c.length > 0)) {
              results.push(cells);
            }
          }
        }

        const iframeGridRows = doc.querySelectorAll('[role="row"]');
        for (const row of iframeGridRows) {
          const cells = Array.from(row.querySelectorAll('[role="gridcell"], [role="columnheader"]'))
            .map(c => c.textContent?.trim() || '');
          if (cells.length >= 5) {
            results.push(cells);
          }
        }
      } catch (e) {
        // Cross-origin iframe, ignore
      }
    }

    return results;
  });

  console.log(`[Scraper] Found ${tableRows.length} raw rows`);

  // Parse rows into structured data
  // Expected columns: Cấp Quản Lý, Chi tiết, Loại Hàng, Time, Volume, % Gán, % GTC, % Chuyển trả, Leadtime
  let headerFound = false;
  let colMap: Record<string, number> = {};

  for (const cells of tableRows) {
    // Detect header row
    if (!headerFound) {
      const isHeader = cells.some(c =>
        c.includes('Quản Lý') || c.includes('Chi tiết') || c.includes('Loại Hàng') ||
        c.toLowerCase().includes('volume') || c.includes('GTC')
      );
      if (isHeader) {
        headerFound = true;
        cells.forEach((c, i) => {
          const norm = c.toLowerCase().trim();
          if (norm.includes('quản lý') || norm.includes('quan ly')) colMap['capQuanLy'] = i;
          else if (norm.includes('chi tiết') || norm.includes('chi tiet')) colMap['chiTiet'] = i;
          else if (norm.includes('loại hàng') || norm.includes('loai hang')) colMap['loaiHang'] = i;
          else if (norm.includes('time') || norm.includes('thời gian') || norm.includes('ngày')) colMap['time'] = i;
          else if (norm === 'volume' || norm.includes('sản lượng')) colMap['volume'] = i;
          else if (norm.includes('% gán') || norm.includes('% gan')) colMap['pctGan'] = i;
          else if (norm.includes('% gtc') || norm.includes('gtc')) colMap['pctGTC'] = i;
          else if (norm.includes('chuyển trả') || norm.includes('chuyen tra')) colMap['pctChuyenTra'] = i;
          else if (norm.includes('leadtime') || norm.includes('lead time')) colMap['leadtime'] = i;
        });
        console.log('[Scraper] Header mapped:', colMap);
        continue;
      }
    }

    if (!headerFound || cells.length < 5) continue;

    const get = (field: string) => cells[colMap[field]] || '';
    const parseRate = (s: string) => {
      const clean = s.replace('%', '').replace(',', '.').trim();
      const n = parseFloat(clean);
      return isFinite(n) ? (n > 1.5 ? n / 100 : n) : 0;
    };
    const parseNum = (s: string) => {
      const clean = s.replace(/[^0-9.,]/g, '').replace(',', '.');
      return parseFloat(clean) || 0;
    };

    const vol = parseNum(get('volume'));
    if (vol <= 0) continue; // skip summary/empty rows

    rows.push({
      capQuanLy: get('capQuanLy'),
      chiTiet: get('chiTiet'),
      loaiHang: get('loaiHang'),
      time: get('time'),
      volume: vol,
      pctGan: parseRate(get('pctGan')),
      pctGTC: parseRate(get('pctGTC')),
      pctChuyenTra: parseRate(get('pctChuyenTra')),
      leadtime: parseNum(get('leadtime')),
    });
  }

  console.log(`[Scraper] Parsed ${rows.length} data rows`);
  return rows;
}

// ─── Handle pagination ────────────────────────────────────────────────────────

async function extractAllPages(page: Page): Promise<ScrapedOpsRow[]> {
  const allRows: ScrapedOpsRow[] = [];

  let pageNum = 1;
  while (true) {
    console.log(`[Scraper] Extracting page ${pageNum}...`);
    const pageRows = await extractTableData(page);
    allRows.push(...pageRows);

    // Try to go to next page
    const nextBtn = page.locator(
      '[aria-label="Next page"], button:has-text("Next"), .pagination-next, [data-testid="next-page"]'
    ).first();

    const hasNext = await nextBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const isDisabled = hasNext ? await nextBtn.isDisabled().catch(() => true) : true;

    if (!hasNext || isDisabled) {
      console.log(`[Scraper] No more pages after page ${pageNum}`);
      break;
    }

    await nextBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(1500);
    pageNum++;

    if (pageNum > 50) {
      console.warn('[Scraper] Safety limit: stopped at page 50');
      break;
    }
  }

  return allRows;
}

// ─── Main scrape function ─────────────────────────────────────────────────────

export async function scrapeOpsData(options: ScrapeOptions): Promise<ScrapeResult> {
  const { username, password, dateFrom, dateTo, headless = true } = options;
  let browser: Browser | null = null;

  try {
    console.log('[Scraper] Launching browser...');
    browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      locale: 'vi-VN',
    });

    const page = await context.newPage();

    // Login
    await loginGHN(page, username, password);

    // Navigate to ops report
    await navigateToOpsReport(page);

    // Apply date filter
    await applyDateFilter(page, dateFrom, dateTo);

    // Wait for data to load
    await page.waitForTimeout(3000);

    // Extract all pages
    const rows = await extractAllPages(page);

    if (rows.length === 0) {
      console.warn('[Scraper] 0 rows extracted, saving debug screenshot...');
      await page.screenshot({ path: 'public/debug.png', fullPage: true }).catch(() => {});
      const html = await page.content().catch(() => '');
      const fs = require('fs');
      fs.writeFileSync('public/debug.html', html);
    }

    await browser.close();

    return {
      success: true,
      rows,
      scrapedAt: new Date().toISOString(),
      totalRows: rows.length,
    };
  } catch (error) {
    if (browser) {
      try {
        // Try to take a screenshot for debugging before closing
        const pages = await browser.contexts()[0]?.pages() || [];
        if (pages.length > 0) {
          await pages[0].screenshot({ path: 'public/debug.png', fullPage: true }).catch(() => {});
          console.log('[Scraper] Debug screenshot saved to public/debug.png');
        }
      } catch (e) {}
      await browser.close().catch(() => {});
    }
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Scraper] Error:', msg);
    return {
      success: false,
      rows: [],
      error: msg,
      scrapedAt: new Date().toISOString(),
      totalRows: 0,
    };
  }
}
