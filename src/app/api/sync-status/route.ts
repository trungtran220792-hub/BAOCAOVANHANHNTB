/**
 * GET /api/sync-status
 * Returns current status of credentials and sheet configuration
 */

import { NextResponse } from 'next/server';
import { hasCredentials, getSheetUrl, SHEET_NAMES } from '@/lib/sheets-writer';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    hasCredentials: hasCredentials(),
    sheetId: '1QkcZHSrqLYVqcUYdpX-UYwHMcPktjaVIiEjKK79pflc',
    sheetUrl: getSheetUrl(),
    sheets: Object.values(SHEET_NAMES),
    serverTime: new Date().toISOString(),
  });
}
