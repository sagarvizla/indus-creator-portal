// src/app/api/submit/route.ts
import { NextResponse } from 'next/server';

// ← your Apps Script URL:
const WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbw8ITvPT16lrWemOj6NiXLL7s8aG8AxtPfQWir2GWPCjKbEq7WzQW_ia5mCs9jjIknL/exec';

export async function POST(request: Request) {
  const body = await request.json();   // { sheetName, entries }
  const resp = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();      // forward Apps Script JSON
  return NextResponse.json(data);
}
