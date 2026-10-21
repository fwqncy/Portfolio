import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import Background from "./components/Background";
import CodeHeader from "./components/CodeHeader";
import SiteFooter from "./components/SiteFooter";
import "./globals.css";

// Type after the Noctra reference: italic display serif for headings, uppercase mono for statements,
// a plain sans for small body copy.
const display = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-display" });
const mono = IBM_Plex_Mono({ weight: ["300", "400", "500"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Sayef Khan, software engineer",
  description:
    "Sayef Khan, a computer science graduate who spent six years managing restaurants and now builds software for the problems he actually lived.",
};

export const viewport: Viewport = {
  themeColor: "#05050a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${display.variable} ${mono.variable}`}>
      <body>
        <Background />
        <CodeHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
