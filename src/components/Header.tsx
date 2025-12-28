import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, X, Calendar, Archive, Sparkles, CreditCard, LogOut, Crown } from 'lucide-react';

export function Header() {
  const { t } = useLanguage();
  const { user, isProUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { key: 'nav.calendar', icon: Calendar, href: '#calendar' },
    { key: 'nav.archive', icon: Archive, href: '#archive' },
    { key: 'nav.ai', icon: Sparkles, href: '#ai' },
    { key: 'nav.pricing', icon: CreditCard, href: '#pricing' },
  ];

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

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
          
          {user ? (
            <>
              {isProUser && (
                <Badge className="hidden sm:flex gradient-gold text-primary border-0 gap-1">
                  <Crown className="h-3 w-3" />
                  {t('premium.badge')}
                </Badge>
              )}
              <span className="hidden sm:inline text-sm text-muted-foreground max-w-[120px] truncate">
                {user.email}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:inline-flex"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-1" />
                {t('auth.logout')}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:inline-flex"
                onClick={() => navigate('/auth')}
              >
                {t('nav.login')}
              </Button>
              <Button 
                size="sm" 
                className="hidden sm:inline-flex gradient-gold text-primary font-semibold border-0"
                onClick={() => navigate('/auth')}
              >
                Pro
              </Button>
            </>
          )}

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
            <div className="flex flex-col gap-2 mt-2 px-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2 py-2">
                    {isProUser && (
                      <Badge className="gradient-gold text-primary border-0 gap-1">
                        <Crown className="h-3 w-3" />
                        Pro
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('auth.logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      navigate('/auth');
                      setIsMenuOpen(false);
                    }}
                  >
                    {t('nav.login')}
                  </Button>
                  <Button 
                    size="sm" 
                    className="w-full gradient-gold text-primary font-semibold border-0"
                    onClick={() => {
                      navigate('/auth');
                      setIsMenuOpen(false);
                    }}
                  >
                    Pro
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
