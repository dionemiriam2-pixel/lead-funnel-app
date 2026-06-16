import { getLp } from "@/content/landingpages";
import LandingPage from "@/components/LandingPage";
import LandingTemplate from "@/components/LandingTemplate";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params; // Next.js 15: params ist ein Promise
  const staticLp = getLp(slug);
  if (staticLp) return { title: staticLp.headline };

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("landing_pages")
    .select("title")
    .eq("slug", slug)
    .single();
  return { title: data?.title || "Landing Page" };
}

export default async function Page({ params }) {
  const { slug } = await params; // Next.js 15: params ist ein Promise

  // 1. Statische LPs haben Vorrang (Altbestand)
  const staticLp = getLp(slug);
  if (staticLp) return <LandingPage lp={staticLp} />;

  // 2. Dynamische LP aus DB
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
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  // Diagnose-Log (erscheint im Vercel-Function-Log)
  console.log("[lp/page]", {
    slug,
    found:      !!row,
    status:     row?.status ?? null,
    client:     row?.clients?.name ?? "(kein Join-Ergebnis)",
    supaErr:    error?.message ?? null,
    serviceKey: !!process.env.SUPABASE_SERVICE_KEY,
  });

  if (error || !row) {
    console.error("[lp/page] notFound — slug:", slug, "error:", error?.message);
    return notFound();
  }

  const client = row.clients || {};

  const data = {
    name:         client.name         || "",
    industry:     client.industry     || "",
    brand_color:  client.brand_color  || null,
    accent_color: client.accent_color || null,
    logo_url:     client.logo_url     || null,
    mobile:       client.mobile       || null,
    phone:        client.phone        || null,
    email:        client.email        || null,
    id:           row.id,
    client_id:    row.client_id,
    slug:         row.slug,
    title:        row.title           || "",
    content:      row.content         || {},
    impressum:    row.impressum       || "",
    datenschutz:  row.datenschutz     || "",
    leads_count:  row.leads_count     || 0,
  };

  return <LandingTemplate data={data} />;
}
