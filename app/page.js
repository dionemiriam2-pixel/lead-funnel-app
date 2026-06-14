import Link from "next/link";
import { landingPages } from "@/content/landingpages";

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 40 }}>
      <h1 style={{ fontSize: 24, marginBottom: 6 }}>Deine Landing Pages</h1>
      <p style={{ color: "#6b7280", marginBottom: 20 }}>
        Alle LPs aus <code>content/landingpages.js</code>. Neue LP = neuer Eintrag dort.
      </p>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
        {landingPages.map((l) => (
          <li key={l.slug} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <Link href={`/lp/${l.slug}`} style={{ fontWeight: 700, color: "#2563eb" }}>/lp/{l.slug}</Link>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{l.client} · {l.industry}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
