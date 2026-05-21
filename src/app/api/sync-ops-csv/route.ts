import { NextResponse } from 'next/server';
import { writeGenericCSVToSheet, SHEET_NAMES, hasCredentials } from '@/lib/sheets-writer';

export async function POST(req: Request) {
  try {
    if (!hasCredentials()) {
      return NextResponse.json({ success: false, error: 'Thiếu credentials.json' }, { status: 500 });
    }

    const { csvText } = await req.json();
    if (!csvText) {
      return NextResponse.json({ success: false, error: 'Missing csvText' }, { status: 400 });
    }

    const result = await writeGenericCSVToSheet(csvText, SHEET_NAMES.ops);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
