import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar } from 'lucide-react';

export function Footer() {
  const { t } = useLanguage();

  const links = [
    { key: 'footer.imprint', href: '/impressum' },
    { key: 'footer.privacy', href: '/datenschutz' },
    { key: 'footer.disclaimer', href: '/disclaimer' },
    { key: 'footer.sitemap', href: '/sitemap' },
  ];

  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-gold">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display text-lg font-semibold">
              Kunstpreis<span className="text-accent">kalender</span>
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {links.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t(link.key)}
              </a>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Kunstpreiskalender
          </p>
        </div>
      </div>
    </footer>
  );
}
