import "./globals.css";

export const metadata = {
  title: "Lead Funnel",
  description: "Landing Pages für Leadgenerierung",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
