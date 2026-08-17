import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans, Playfair_Display } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import { SITE_URL, siteKeywords } from "@/lib/seo";
import "./globals.css";
import "./auth-central.css";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PieAgency | Accompagnement Campus France, Visa étudiant & Belgique",
    template: "%s | PieAgency",
  },
  description:
    "PieAgency accompagne les étudiants africains vers la France et la Belgique : Campus France, visa étudiant, documents, entretien, logement, budget et suivi personnalisé.",
  keywords: siteKeywords,
  applicationName: "PieAgency",
  authors: [{ name: "PieAgency" }],
  creator: "PieAgency",
  publisher: "PieAgency",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "PieAgency",
    title: "PieAgency | Campus France, Visa étudiant & Belgique",
    description:
      "Diagnostic, documents, entretien, visa et suivi étudiant pour avancer vers la France ou la Belgique avec méthode.",
    images: [
      {
        url: "/pieagency-logo.jpg",
        width: 1200,
        height: 630,
        alt: "PieAgency - accompagnement étudiant France et Belgique",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PieAgency | Campus France, Visa étudiant & Belgique",
    description:
      "Accompagnement étudiant : diagnostic, Campus France, visa, Belgique, documents et suivi personnalisé.",
    images: ["/pieagency-logo.jpg"],
  },
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "EducationalOrganization", "LocalBusiness"],
  "@id": `${SITE_URL}/#organization`,
  name: "PieAgency",
  alternateName: ["PIE Agency", "Pie Agency", "PieAgency France Belgique", "PieAgency Campus France"],
  legalName: "PieAgency",
  url: SITE_URL,
  logo: `${SITE_URL}/pieagency-logo.jpg`,
  image: `${SITE_URL}/pieagency-logo.jpg`,
  description:
    "PieAgency est une agence d’accompagnement étudiant spécialisée dans Campus France, le visa étudiant France, la Belgique, les documents, l’entretien, le logement, le budget et le suivi de dossier.",
  slogan: "Étudier en France ou en Belgique avec méthode.",
  areaServed: ["France", "Belgique", "Togo", "Afrique francophone"],
  knowsAbout: siteKeywords,
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "student support",
      areaServed: ["France", "Togo", "Afrique francophone"],
      availableLanguage: ["fr"],
      url: `${SITE_URL}/contact`,
    },
  ],
  sameAs: [
    "https://web.facebook.com/profile.php?id=61564375512991",
    "https://web.facebook.com/groups/8418722288154510/",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "PieAgency",
  alternateName: ["PIE Agency", "Pie Agency"],
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "fr-FR",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
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
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
          type="application/ld+json"
        />
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
          type="application/ld+json"
        />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
