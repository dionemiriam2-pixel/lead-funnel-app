import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Einmaliger Endpoint zum Anlegen des ersten Nutzers.
// Löschen oder umbenennen sobald der erste Account existiert.
export async function POST(req) {
  const { email, password, secret } = await req.json();

  // Einfacher Schutz gegen ungewollte Nutzung
  if (secret !== process.env.SUPABASE_SERVICE_KEY?.slice(-8)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const sb = supabaseAdmin();

  // Kein zweiter Account wenn bereits einer existiert
  const { data: { users } } = await sb.auth.admin.listUsers();
  if (users.length > 0) {
    return NextResponse.json({ error: "Bereits eingerichtet. Endpoint löschen." }, { status: 400 });
  }

  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, email: data.user.email });
}
