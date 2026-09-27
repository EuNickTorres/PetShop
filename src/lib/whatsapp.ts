import { siteConfig } from "@/lib/site-config";

export function getWhatsAppUrl(message?: string) {
  const text = encodeURIComponent(
    message ?? `Hola ${siteConfig.name}, me gustaría reservar una cita para mi mascota.`
  );
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${text}`;
}
