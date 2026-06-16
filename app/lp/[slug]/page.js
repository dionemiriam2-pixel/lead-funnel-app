import { getLp, landingPages } from "@/content/landingpages";
import LandingPage from "@/components/LandingPage";
import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const lp = getLp(params.slug);
  if (lp) return { title: lp.headline };
  const sb = supabasePublic();
  const { data } = await sb.from("landing_pages").select("title").eq("slug", params.slug).eq("status", "published").single();
  return { title: data?.title || "Landing Page" };
}

export default async function Page({ params }) {
  // 1. Statische LPs haben Vorrang
  const staticLp = getLp(params.slug);
  if (staticLp) return <LandingPage lp={staticLp} />;

  // 2. Dynamische LP aus DB (nur published)
  const sb = supabasePublic();
  const { data: row } = await sb
    .from("landing_pages")
    .select("*, clients(name, website, region, description)")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!row) return notFound();

  const c = row.content || {};
  const client = row.clients || {};

  const lp = {
    slug:         row.slug,
    brand:        client.name || "",
    badge:        c.hero?.badge || "",
    headline:     c.hero?.headline || row.title || "",
    subline:      c.hero?.subline || "",
    bullets:      c.hero?.bullets || [],
    cta:          c.hero?.cta_text || "Jetzt anfragen",
    benefits:     (c.usp_blocks || []).map(b => ({ icon: b.icon, title: b.title, text: b.text })),
    formTitle:    c.cta?.title || "Jetzt anfragen",
    formSub:      c.cta?.sub || "",
    ctaTitle:     c.cta?.title || "",
    ctaSub:       c.cta?.sub || "",
    footerText:   [
      client.name,
      row.impressum   ? `<a href="#impressum">Impressum</a>`   : null,
      row.datenschutz ? `<a href="#datenschutz">Datenschutz</a>` : null,
    ].filter(Boolean).join(" · "),
    impressum:    row.impressum || "",
    datenschutz:  row.datenschutz || "",
  };

  return <LandingPage lp={lp} />;
}
