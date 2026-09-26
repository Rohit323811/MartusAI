import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  Inter,
  Source_Serif_4,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SkipLink } from "@/components/SkipLink";
import { ModulesSidebar } from "@/components/ModulesSidebar";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MartusAI — Know your rights. Before the deadline does.",
  description:
    "Upload any legal document. Get plain-language answers, cited sources, and a draft response — in under 30 seconds.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${inter.variable} ${sourceSerif.variable} ${jetbrains.variable}`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SkipLink />
          <ModulesSidebar />
          <div className="lg:pl-64">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
