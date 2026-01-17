// Force redeploy - 2026-01-06
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const { t } = useLanguage();

  const links = [
    { key: 'footer.imprint', href: '/impressum' },
    { key: 'footer.privacy', href: '/datenschutz' },
    { key: 'footer.disclaimer', href: '/disclaimer' },
    { key: 'footer.terms', href: '/nutzungsbedingungen' },
  ];

  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-gold">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display text-lg font-semibold">
              Kunstpreis<span className="text-accent">kalender</span>
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            {links.map((link) => (
              <Link
                key={link.key}
                to={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t(link.key)}
              </Link>
            ))}
            <Link
              to="/auth"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Admin Login
            </Link>
          </nav>

          <div className="flex flex-col items-center gap-2 md:items-end">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Kunstpreiskalender.
            </p>
            <p className="text-xs text-muted-foreground">
              Ein Service der Atelier Verlag Ursula Fritzsche KG
            </p>
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Powered by Stripe.
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
