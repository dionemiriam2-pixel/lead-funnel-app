import "./globals.css";

export const metadata = {
  title: "LeadFlow",
  description: "Deine Lead-Plattform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body style={{ margin: 0, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif", background: "#f7f8fa" }}>
        {children}
      </body>
    </html>
  );
}
