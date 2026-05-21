import { NextResponse } from 'next/server';
import { readAllDataFromSheets, hasCredentials } from '@/lib/sheets-writer';

export async function GET() {
  try {
    if (!hasCredentials()) {
      return NextResponse.json({ success: false, error: 'Thiếu credentials.json' }, { status: 500 });
    }

    const data = await readAllDataFromSheets();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
