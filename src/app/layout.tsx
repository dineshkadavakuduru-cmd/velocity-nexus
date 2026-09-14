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
  title: "Velocity Nexus | 3D Multiplayer Exotic Car Racing",
  description: "Race exotic supercars in a browser-based 3D racing game with real-time multiplayer, stunning visuals, and cinematic audio.",
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


