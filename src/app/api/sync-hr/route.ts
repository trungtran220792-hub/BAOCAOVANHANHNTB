/**
 * POST /api/sync-hr
 * Receives HR CSV text and writes directly to Google Sheet (NhanSu tab)
 * No scraping needed - user manually uploads CSV
 *
 * Body: { csvText: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeHRCSVToSheet, hasCredentials } from '@/lib/sheets-writer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { csvText } = body;

    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json({ error: 'csvText là bắt buộc' }, { status: 400 });
    }

    if (!hasCredentials()) {
      return NextResponse.json({
        error: 'credentials.json chưa có. Vui lòng đặt file Service Account vào thư mục gốc của project.',
      }, { status: 503 });
    }

    console.log('[API] sync-hr: writing CSV data...');
    const result = await writeHRCSVToSheet(csvText);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      writtenRows: result.rowsWritten,
      syncedAt: new Date().toISOString(),
      sheetUrl: `https://docs.google.com/spreadsheets/d/1QkcZHSrqLYVqcUYdpX-UYwHMcPktjaVIiEjKK79pflc`,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[API] sync-hr error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
