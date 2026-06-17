import { getLp } from "@/content/landingpages";
import LandingPage from "@/components/LandingPage";
import LandingTemplate from "@/components/LandingTemplate";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const slug = params.slug;
  const staticLp = getLp(slug);
  if (staticLp) return { title: staticLp.headline };

  try {
    const sb = supabaseAdmin();
    const { data } = await sb
      .from("landing_pages")
      .select("title")
      .eq("slug", slug)
      .single();
    return { title: data?.title || "Landing Page" };
  } catch { return { title: "Landing Page" }; }
}

export default async function Page({ params }) {
  const slug = params.slug;

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
        mobile, phone, email, whatsapp_number
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !row) return notFound();

  const client = row.clients || {};
  const data = {
    name:         client.name         || "",
    industry:     client.industry     || "",
    brand_color:  client.brand_color  || null,
    accent_color: client.accent_color || null,
    logo_url:     client.logo_url     || null,
    mobile:           client.mobile           || null,
    phone:            client.phone            || null,
    email:            client.email            || null,
    whatsapp_number:  client.whatsapp_number  || null,
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
