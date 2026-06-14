import { NextResponse } from "next/server";

export async function POST(req) {
  const { pw } = await req.json();
  if (pw === process.env.DASHBOARD_PASSWORD) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false }, { status: 401 });
}
