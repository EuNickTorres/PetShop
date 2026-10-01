import type { MetadataRoute } from "next";

const agendaManifest: MetadataRoute.Manifest = {
  id: "/agenda",
  name: "Dayana Gestión",
  short_name: "Dayana",
  description: "Agenda privada y gestión diaria de Dayana Peluquería.",
  lang: "es",
  start_url: "/agenda",
  scope: "/agenda",
  display: "standalone",
  background_color: "#07110d",
  theme_color: "#07110d",
  orientation: "portrait",
  categories: ["business", "productivity"],
  icons: [
    {
      src: "/agenda-icons/dayana-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/agenda-icons/dayana-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/agenda-icons/dayana-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};

export function GET() {
  return Response.json(agendaManifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
