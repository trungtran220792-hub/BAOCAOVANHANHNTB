/**
 * POST /api/sync-ops
 * Triggers Playwright scraping of baocao.ghn.vn → writes to Google Sheet
 *
 * Body: { username, password, dateFrom, dateTo, headless? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeOpsData } from '@/lib/scraper';
import { writeOpsToSheet, hasCredentials } from '@/lib/sheets-writer';

export const runtime = 'nodejs'; // Required for Playwright

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, dateFrom, dateTo, headless = true } = body;

    // Validate
    if (!username || !password) {
      return NextResponse.json({ error: 'username và password là bắt buộc' }, { status: 400 });
    }
    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: 'dateFrom và dateTo là bắt buộc' }, { status: 400 });
    }
    if (!hasCredentials()) {
      return NextResponse.json({
        error: 'credentials.json chưa có. Vui lòng đặt file Service Account vào thư mục gốc của project.',
        hint: 'Xem hướng dẫn tại README.md',
      }, { status: 503 });
    }

    console.log(`[API] sync-ops: ${dateFrom} → ${dateTo}`);

    // Step 1: Scrape
    const scrapeResult = await scrapeOpsData({ username, password, dateFrom, dateTo, headless });

    if (!scrapeResult.success) {
      return NextResponse.json({
        success: false,
        step: 'scrape',
        error: scrapeResult.error,
        scrapedAt: scrapeResult.scrapedAt,
      }, { status: 500 });
    }

    if (scrapeResult.totalRows === 0) {
      return NextResponse.json({
        success: false,
        step: 'scrape',
        error: 'Không lấy được dữ liệu. Kiểm tra lại date range hoặc login credentials.',
        scrapedAt: scrapeResult.scrapedAt,
      }, { status: 422 });
    }

    // Step 2: Write to Google Sheets
    const writeResult = await writeOpsToSheet(scrapeResult.rows, { dateFrom, dateTo });

    if (!writeResult.success) {
      return NextResponse.json({
        success: false,
        step: 'write',
        error: writeResult.error,
        scrapedRows: scrapeResult.totalRows,
        scrapedAt: scrapeResult.scrapedAt,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      scrapedRows: scrapeResult.totalRows,
      writtenRows: writeResult.rowsWritten,
      scrapedAt: scrapeResult.scrapedAt,
      dateFrom,
      dateTo,
      sheetUrl: `https://docs.google.com/spreadsheets/d/1QkcZHSrqLYVqcUYdpX-UYwHMcPktjaVIiEjKK79pflc`,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[API] sync-ops error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
