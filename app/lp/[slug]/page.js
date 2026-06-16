import { getLp } from "@/content/landingpages";
import LandingPage from "@/components/LandingPage";
import LandingTemplate from "@/components/LandingTemplate";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const staticLp = getLp(params.slug);
  if (staticLp) return { title: staticLp.headline };

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("landing_pages")
    .select("title")
    .eq("slug", params.slug)
    .single();
  return { title: data?.title || "Landing Page" };
}

export default async function Page({ params }) {
  // 1. Statische LPs haben Vorrang (Altbestand)
  const staticLp = getLp(params.slug);
  if (staticLp) return <LandingPage lp={staticLp} />;

  // 2. Dynamische LP aus DB (service-role, kein published-Filter nötig für Preview)
  const sb = supabaseAdmin();
  const { data: row, error } = await sb
    .from("landing_pages")
    .select(`
      id, client_id, name, slug, title, status,
      content, impressum, datenschutz, leads_count,
      clients (
        id, name, website, region, description, industry,
        brand_color, accent_color, logo_url,
        mobile, phone, email
      )
    `)
    .eq("slug", params.slug)
    .single();

  if (error || !row) return notFound();

  // Nur veröffentlichte LPs sind öffentlich sichtbar (Draft = 404 für Besucher)
  if (row.status !== "published") return notFound();

  const client = row.clients || {};

  // data-Objekt: clients-Felder + LP-Felder, content bleibt als jsonb
  const data = {
    // Kundenprofil
    name:         client.name        || "",
    industry:     client.industry    || "",
    brand_color:  client.brand_color || null,
    accent_color: client.accent_color || null,
    logo_url:     client.logo_url    || null,
    mobile:       client.mobile      || null,
    phone:        client.phone       || null,
    email:        client.email       || null,
    // LP-Daten
    id:           row.id,
    client_id:    row.client_id,
    slug:         row.slug,
    title:        row.title          || "",
    content:      row.content        || {},
    impressum:    row.impressum      || "",
    datenschutz:  row.datenschutz    || "",
    leads_count:  row.leads_count    || 0,
  };

  return <LandingTemplate data={data} />;
}
