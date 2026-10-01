import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  applicationName: "Dayana Gestión",
  manifest: "/agenda.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Dayana Gestión",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      {
        url: "/agenda-icons/dayana-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/agenda-icons/dayana-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/agenda-icons/dayana-apple-touch.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#07110d",
};

export default function AgendaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
