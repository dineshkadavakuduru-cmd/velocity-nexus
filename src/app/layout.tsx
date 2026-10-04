import type { Metadata } from "next";
import { Rajdhani, Orbitron } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
});

const SITE_URL = "https://gt-umber-alpha.vercel.app";

export const metadata: Metadata = {
  title: "Velocity Nexus | Browser Racing",
  description: "A focused browser racing game with readable circuits, responsive handling, and online rooms.",
  keywords: ["3D racing", "supercar", "multiplayer", "WebGL", "game", "racing", "three.js"],
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Velocity Nexus | Browser Racing",
    description: "Pick a car, learn the circuit, and chase a better lap. 6 cars, 3 tracks, online rooms for up to 8 racers.",
    url: SITE_URL,
    siteName: "Velocity Nexus",
    images: [{ url: "/tracks/neon-tokyo.jpg", width: 1200, height: 630, alt: "Velocity Nexus — browser racing" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Velocity Nexus | Browser Racing",
    description: "A focused browser racer built around clean handling, readable tracks, and real competition.",
    images: ["/tracks/neon-tokyo.jpg"],
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/vercel.svg" />
      </head>
      <body
        className={`${rajdhani.variable} ${orbitron.variable} min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}


