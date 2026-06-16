import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/supabase";

export async function POST(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const owner    = process.env.GITHUB_OWNER;
  const repo     = process.env.GITHUB_REPO;
  const token    = process.env.GITHUB_TOKEN;
  const workflow = process.env.GITHUB_WORKFLOW || "scrape.yml";

  if (!owner || !repo || !token) {
    return NextResponse.json({ error: "GITHUB_OWNER, GITHUB_REPO und GITHUB_TOKEN müssen in Vercel gesetzt sein." }, { status: 500 });
  }

  const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`, {
    method: "POST",
    headers: { Authorization: "token " + token, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
    body: JSON.stringify({ ref: "master" }),
  });

  if (r.status === 204) return NextResponse.json({ ok: true });
  const text = await r.text();
  return NextResponse.json({ error: text }, { status: r.status });
}
