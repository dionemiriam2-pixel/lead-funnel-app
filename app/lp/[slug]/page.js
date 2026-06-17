import { getLp } from "@/content/landingpages";
import LandingPage from "@/components/LandingPage";
import LandingTemplate from "@/components/LandingTemplate";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  try {
    const slug = params.slug;
    return { title: slug || "Landing Page" };
  } catch { return { title: "Landing Page" }; }
}

export default async function Page({ params }) {
  const slug = params.slug;

  // Statische LPs
  try {
    const staticLp = getLp(slug);
    if (staticLp) return <LandingPage lp={staticLp} />;
  } catch (e) {
    return <pre style={{padding:40,color:"red"}}>getLp Fehler: {e.message}</pre>;
  }

  // DB-Abruf
  let row = null;
  let dbError = null;
  try {
    const sb = supabaseAdmin();
    const result = await sb
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
    row = result.data;
    dbError = result.error;
  } catch (e) {
    return <pre style={{padding:40,color:"red"}}>supabaseAdmin() Fehler: {e.message}</pre>;
  }

  // Debug-Ausgabe statt notFound
  if (!row) {
    return (
      <pre style={{padding:40,background:"#f9f9f9",fontFamily:"monospace",fontSize:13}}>
        DEBUG /lp/{slug}{"\n"}
        slug: {slug}{"\n"}
        serviceKey: {!!process.env.SUPABASE_SERVICE_KEY ? "true" : "false"}{"\n"}
        dbError: {dbError?.message || "null"}{"\n"}
        row: null{"\n"}
        → Zeile existiert nicht oder Status != published
      </pre>
    );
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
