import { getWhatsAppUrl } from "@/lib/whatsapp";
import WhatsAppIcon from "./icons/WhatsAppIcon";

export default function FloatingWhatsApp() {
  return (
    <aside aria-label="Contacto rápido" className="fixed bottom-5 right-5 z-40">
      <a
        href={getWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Reservar cita por WhatsApp"
        className="hidden size-14 place-items-center rounded-full bg-brand text-brand-light shadow-[0_14px_35px_rgba(23,76,61,0.3)] transition hover:-translate-y-1 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 sm:grid"
      >
        <WhatsAppIcon className="size-6 fill-current" />
      </a>
    </aside>
  );
}
