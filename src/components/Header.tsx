import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Menu, X, Calendar, Archive, Sparkles, CreditCard } from 'lucide-react';

export function Header() {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { key: 'nav.calendar', icon: Calendar, href: '#calendar' },
    { key: 'nav.archive', icon: Archive, href: '#archive' },
    { key: 'nav.ai', icon: Sparkles, href: '#ai' },
    { key: 'nav.pricing', icon: CreditCard, href: '#pricing' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-gold">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">
            Kunstpreis<span className="text-accent">kalender</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {t(item.key)}
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            {t('nav.login')}
          </Button>
          <Button size="sm" className="hidden sm:inline-flex gradient-gold text-primary font-semibold border-0">
            Pro
          </Button>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {t(item.key)}
              </a>
            ))}
            <div className="flex gap-2 mt-2 px-4">
              <Button variant="outline" size="sm" className="flex-1">
                {t('nav.login')}
              </Button>
              <Button size="sm" className="flex-1 gradient-gold text-primary font-semibold border-0">
                Pro
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
