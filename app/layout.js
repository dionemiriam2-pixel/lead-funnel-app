import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const serif = Fraunces({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-serif" });
const sans  = Inter({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-sans" });

export const metadata = {
  title: "LeadOS",
  description: "Deine Lead-Plattform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className={`${serif.variable} ${sans.variable}`}>
        {children}
      </body>
    </html>
  );
}
