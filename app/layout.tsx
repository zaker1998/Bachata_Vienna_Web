import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HideOnAdmin } from "@/components/layout/hide-on-admin";
import {
  CITY,
  COUNTRY,
  INSTAGRAM_URL,
  PUBLIC_CONTACT_EMAIL,
  SITE_NAME,
  YOUTUBE_URL,
} from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bachata Vienna — Dance Classes & Private Lessons",
    template: "%s · Bachata Vienna",
  },
  description:
    "Master Bachata in Vienna with expert-led group classes and private lessons. Practise with hand-picked video tutorials and book your next session.",
  keywords: [
    "Bachata",
    "Vienna",
    "dance classes",
    "private lessons",
    "Wien",
    "Tanzkurs",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Bachata Vienna",
    title: "Bachata Vienna — Dance Classes & Private Lessons",
    description:
      "Master Bachata in Vienna with expert-led group classes and private lessons.",
    locale: "en_AT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bachata Vienna — Dance Classes & Private Lessons",
    description:
      "Master Bachata in Vienna with expert-led group classes and private lessons.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "/",
  },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: SITE_NAME,
  description: `Bachata dance classes and private lessons in ${CITY}, ${COUNTRY}.`,
  url: siteUrl,
  image: `${siteUrl}/opengraph-image.png`,
  email: PUBLIC_CONTACT_EMAIL,
  address: {
    "@type": "PostalAddress",
    addressLocality: CITY,
    addressCountry: "AT",
  },
  areaServed: `${CITY}, ${COUNTRY}`,
  sameAs: [INSTAGRAM_URL, YOUTUBE_URL],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" className="flex-1">{children}</main>
        <HideOnAdmin>
          <Footer />
        </HideOnAdmin>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd),
          }}
        />
      </body>
    </html>
  );
}
