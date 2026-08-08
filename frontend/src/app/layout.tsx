import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans, Playfair_Display } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "PieAgency | Accompagnement etudiant France & Belgique",
    template: "%s | PieAgency",
  },
  description:
    "PieAgency accompagne les etudiants vers la France et la Belgique avec une methode claire, humaine et structuree.",
  applicationName: "PieAgency",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PieAgency",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/pieagency-logo.jpg",
    shortcut: "/pieagency-logo.jpg",
    apple: "/pieagency-logo.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1b38",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${dmSans.variable} ${playfair.variable} ${dmMono.variable}`}
      lang="fr"
    >
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
