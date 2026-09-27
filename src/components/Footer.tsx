import { siteConfig } from "@/lib/site-config";

export default function Footer() {
  return (
    <footer data-reveal className="border-t border-brand-dark/12 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-foreground/75 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
        </p>
        <div className="flex gap-4">
          <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-brand-dark">
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
