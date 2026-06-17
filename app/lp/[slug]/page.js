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
      .select("title, clients(name, description, logo_url, region)")
      .eq("slug", slug)
      .single();
    const cl = data?.clients || {};
    const title = data?.title || cl.name || "Landing Page";
    const desc  = cl.description?.slice(0, 155) || title;
    return {
      title,
      description: desc,
      openGraph: {
        title,
        description: desc,
        images: cl.logo_url ? [{ url: cl.logo_url }] : [],
        type: "website",
      },
      twitter: { card: "summary", title, description: desc },
    };
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
        brand_color, accent_color, logo_url, brand_font,
        mobile, phone, email, whatsapp_number,
        testimonials, reference_images, lead_magnet, garantie
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !row) return notFound();

  // Seitenaufruf tracken (fire-and-forget, kein await nötig)
  supabaseAdmin().rpc("increment_lp_page_views", { p_id: row.id });

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
    brand_font:       client.brand_font       || null,
    testimonials:     client.testimonials     || [],
    reference_images: client.reference_images || [],
    lead_magnet:      client.lead_magnet      || null,
    garantie:         client.garantie         || null,
    id:           row.id,
    client_id:    row.client_id,
    slug:         row.slug,
    title:        row.title           || "",
    content:      row.content         || {},
    impressum:    row.impressum       || "",
    datenschutz:  row.datenschutz     || "",
    leads_count:  row.leads_count     || 0,
  };

  // Schema.org JSON-LD
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name":        client.name      || "",
    "description": client.description || "",
    "url":         client.website   || "",
    "telephone":   client.phone     || client.mobile || "",
    "email":       client.email     || "",
    "address": client.region ? {
      "@type": "PostalAddress",
      "addressLocality": client.region,
      "addressCountry":  "DE",
    } : undefined,
    "image": client.logo_url || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <LandingTemplate data={data} />
    </>
  );
}
