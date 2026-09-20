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

export const metadata: Metadata = {
  title: "Velocity Nexus | Browser Racing",
  description: "A focused browser racing game with readable circuits, responsive handling, and online rooms.",
  keywords: ["3D racing", "supercar", "multiplayer", "WebGL", "game", "racing", "three.js"],
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${rajdhani.variable} ${orbitron.variable} min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}


