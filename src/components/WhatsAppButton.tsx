import { getWhatsAppUrl } from "@/lib/whatsapp";
import WhatsAppIcon from "./icons/WhatsAppIcon";

export default function WhatsAppButton({
  label = "Reservar por WhatsApp",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={getWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full border border-brand-dark bg-brand-dark px-6 py-3.5 text-sm font-bold text-brand-light shadow-sm transition hover:-translate-y-0.5 hover:bg-brand active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 sm:w-auto ${className}`}
    >
      <WhatsAppIcon className="size-4 fill-current" />
      {label}
    </a>
  );
}
