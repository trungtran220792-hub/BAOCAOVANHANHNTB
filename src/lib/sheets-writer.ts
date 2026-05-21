/**
 * sheets-writer.ts – Google Sheets integration
 * Writes scraped data to Google Sheet ID: 1QkcZHSrqLYVqcUYdpX-UYwHMcPktjaVIiEjKK79pflc
 *
 * Requires: credentials.json (Service Account) placed at project root
 * Service account must have Editor access to the sheet.
 */

import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import type { ScrapedOpsRow } from './scraper';

const SHEET_ID = '1QkcZHSrqLYVqcUYdpX-UYwHMcPktjaVIiEjKK79pflc';
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// Sheet tab names
export const SHEET_NAMES = {
  ops: 'NangSuat_BuuCuc',
  hr: 'NhanSu',
  historical: 'LichSu',
} as const;

// ─── Auth ──────────────────────────────────────────────────────────────────────

function getAuth() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      `credentials.json not found at ${CREDENTIALS_PATH}. ` +
      'Please place your Google Service Account JSON file there.'
    );
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

// ─── Clear sheet ───────────────────────────────────────────────────────────────

async function clearSheet(sheets: ReturnType<typeof google.sheets>, sheetName: string) {
  console.log(`[Sheets] Clearing sheet: ${sheetName}`);
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  console.log(`[Sheets] Sheet "${sheetName}" cleared`);
}

// ─── Write ops data ────────────────────────────────────────────────────────────

export async function writeOpsToSheet(rows: ScrapedOpsRow[], syncInfo?: { dateFrom: string; dateTo: string }): Promise<{ success: boolean; rowsWritten: number; error?: string }> {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Clear existing data
    await clearSheet(sheets, SHEET_NAMES.ops);

    // Build header row
    const header = [
      'Cấp Quản Lý',
      'Chi tiết (Bưu cục)',
      'Loại Hàng',
      'Time',
      'Volume',
      '% Gán',
      '% GTC',
      '% Chuyển trả',
      'Leadtime',
      'Ngày sync',
    ];

    const syncDate = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    // Build data rows
    const dataRows = rows.map(r => [
      r.capQuanLy,
      r.chiTiet,
      r.loaiHang,
      r.time,
      r.volume,
      r.pctGan,
      r.pctGTC,
      r.pctChuyenTra,
      r.leadtime,
      syncDate,
    ]);

    const allRows = [header, ...dataRows];

    // Write to sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAMES.ops}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: allRows },
    });

    // Format header row (bold + background)
    await formatHeaderRow(sheets, SHEET_NAMES.ops);

    console.log(`[Sheets] Written ${dataRows.length} rows to "${SHEET_NAMES.ops}"`);
    return { success: true, rowsWritten: dataRows.length };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Sheets] Write error:', msg);
    return { success: false, rowsWritten: 0, error: msg };
  }
}

// ─── Write HR data from CSV text ───────────────────────────────────────────────

export async function writeHRCSVToSheet(csvText: string): Promise<{ success: boolean; rowsWritten: number; error?: string }> {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Parse CSV
    const lines = csvText.split('\n').filter(l => l.trim());
    if (lines.length < 2) throw new Error('CSV file is empty or has no data rows');

    // Clear existing
    await clearSheet(sheets, SHEET_NAMES.hr);

    // Parse into rows
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; continue; }
        if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
        current += char;
      }
      result.push(current.trim());
      return result;
    };

    const rows = lines.map(l => parseCSVLine(l));
    const syncDate = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    // Add sync date column to header
    const header = [...(rows[0] || []), 'Ngày sync'];
    const dataRows = rows.slice(1).map(r => [...r, syncDate]);

    const allRows = [header, ...dataRows];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAMES.hr}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: allRows },
    });

    await formatHeaderRow(sheets, SHEET_NAMES.hr);

    console.log(`[Sheets] Written ${dataRows.length} HR rows to "${SHEET_NAMES.hr}"`);
    return { success: true, rowsWritten: dataRows.length };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Sheets] HR write error:', msg);
    return { success: false, rowsWritten: 0, error: msg };
  }
}

// ─── Format header row ─────────────────────────────────────────────────────────

async function formatHeaderRow(sheets: ReturnType<typeof google.sheets>, sheetName: string) {
  try {
    // Get sheet ID (numeric) from sheet name
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const sheetMeta = meta.data.sheets?.find(s => s.properties?.title === sheetName);
    const sheetId = sheetMeta?.properties?.sheetId;

    if (sheetId === undefined) return;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.067, green: 0.149, blue: 0.267 }, // dark navy
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          {
            updateSheetProperties: {
              properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
              fields: 'gridProperties.frozenRowCount',
            },
          },
        ],
      },
    });
  } catch (e) {
    // Non-critical: just skip formatting if it fails
    console.warn('[Sheets] Header formatting skipped:', e instanceof Error ? e.message : e);
  }
}

// ─── Check credentials availability ───────────────────────────────────────────

export function hasCredentials(): boolean {
  return fs.existsSync(CREDENTIALS_PATH);
}

export function getSheetUrl(): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;
}

// ─── Generic Write CSV to Sheet ───────────────────────────────────────────────

export async function writeGenericCSVToSheet(csvText: string, sheetName: string): Promise<{ success: boolean; rowsWritten: number; error?: string }> {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Parse CSV
    const lines = csvText.split('\n').filter(l => l.trim());
    if (lines.length < 2) throw new Error('CSV file is empty or has no data rows');

    // Clear existing
    await clearSheet(sheets, sheetName);

    // Parse into rows
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; continue; }
        if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
        current += char;
      }
      result.push(current.trim());
      return result;
    };

    const rows = lines.map(l => parseCSVLine(l));
    const syncDate = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    // Add sync date column to header
    const header = [...(rows[0] || []), 'Ngày sync'];
    const dataRows = rows.slice(1).map(r => [...r, syncDate]);

    const allRows = [header, ...dataRows];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: allRows },
    });

    await formatHeaderRow(sheets, sheetName);

    console.log(`[Sheets] Written ${dataRows.length} rows to "${sheetName}"`);
    return { success: true, rowsWritten: dataRows.length };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Sheets] ${sheetName} write error:`, msg);
    return { success: false, rowsWritten: 0, error: msg };
  }
}

// ─── Read All Data ─────────────────────────────────────────────────────────────

export async function readAllDataFromSheets(): Promise<{
  opsCSV: string;
  hrCSV: string;
  historicalCSV: string;
}> {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SHEET_ID,
      ranges: [
        `${SHEET_NAMES.ops}!A:Z`,
        `${SHEET_NAMES.hr}!A:Z`,
        `${SHEET_NAMES.historical}!A:Z`
      ]
    });

    const valOps = response.data.valueRanges?.[0]?.values || [];
    const valHr = response.data.valueRanges?.[1]?.values || [];
    const valHist = response.data.valueRanges?.[2]?.values || [];

    const toCSV = (rows: any[][]) => rows.map(r => r.map(c => {
      const cell = String(c || '');
      return cell.includes(',') || cell.includes('"') ? `"${cell.replace(/"/g, '""')}"` : cell;
    }).join(',')).join('\n');

    return {
      opsCSV: toCSV(valOps),
      hrCSV: toCSV(valHr),
      historicalCSV: toCSV(valHist)
    };
  } catch (error) {
    console.error('[Sheets] Read error:', error);
    throw error;
  }
}
