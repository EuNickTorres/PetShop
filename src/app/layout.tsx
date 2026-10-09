import type { Metadata } from "next";
import { Manrope, Outfit } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const title = "Dayana Peluquería | Peluquería canina y felina en Tarragona";
const description =
  "Baño, corte y cuidado para perros y gatos en Tarragona. Reserva tu cita en Dayana Peluquería por WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title,
  description,
  keywords: [
    "peluquería canina",
    "peluquería felina",
    "peluquería perros Tarragona",
    "baño y corte de perros",
    "grooming Tarragona",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: siteConfig.siteUrl,
    siteName: siteConfig.name,
    locale: "es_ES",
    type: "website",
    images: ["/images/dayana-com-pet.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/dayana-com-pet.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: siteConfig.name,
  description: siteConfig.heroDescription,
  url: siteConfig.siteUrl,
  telephone: siteConfig.phoneDisplay,
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.address.street,
    addressLocality: siteConfig.address.city,
    addressCountry: "ES",
  },
  sameAs: Object.values(siteConfig.social),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${outfit.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <a href="#main-content" className="skip-link">Saltar al contenido</a>
        {children}
      </body>
    </html>
  );
}
