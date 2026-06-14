import { getLp, landingPages } from "@/content/landingpages";
import LandingPage from "@/components/LandingPage";
import { notFound } from "next/navigation";

// erzeugt für jede LP in der Config automatisch eine Seite
export function generateStaticParams() {
  return landingPages.map((l) => ({ slug: l.slug }));
}

export function generateMetadata({ params }) {
  const lp = getLp(params.slug);
  return { title: lp ? lp.headline : "Landing Page" };
}

export default function Page({ params }) {
  const lp = getLp(params.slug);
  if (!lp) return notFound();
  return <LandingPage lp={lp} />;
}
