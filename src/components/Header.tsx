import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, X, Calendar, Archive, Sparkles, CreditCard, LogOut, Crown, Shield, User } from 'lucide-react';
import { PricingModal } from '@/components/PricingModal';

export function Header() {
  const { t } = useLanguage();
  const { user, isProUser, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const isOnIndexPage = location.pathname === '/';

  const navItems = [
    { key: 'nav.calendar', icon: Calendar, href: isOnIndexPage ? '#calendar' : '/#calendar' },
    { key: 'nav.archive', icon: Archive, href: '/archiv' },
    { key: 'nav.ai', icon: Sparkles, href: isOnIndexPage ? '#ai' : '/#ai' },
    { key: 'nav.subscriptions', icon: CreditCard, href: isOnIndexPage ? '#pricing' : '/#pricing' },
  ];

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg gradient-gold">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl md:text-3xl font-bold tracking-tight leading-tight">
              Kunstpreis<span className="text-accent">kalender</span>
            </span>
            <span className="text-[10px] md:text-xs text-muted-foreground leading-tight">
              powered by Zeitschrift atelier
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <item.icon className="h-5 w-5" />
              {t(item.key)}
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          
          {user ? (
            <>
              {/* FORCED ADMIN BUTTON - Always visible, prominent styling, NO hidden classes */}
              <Button
                size="sm"
                className="inline-flex bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                onClick={() => navigate('/admin')}
              >
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => navigate('/profile')}
              >
                <User className="h-4 w-4 mr-1" />
                Profil
              </Button>
              {isProUser && (
                <Badge className="hidden sm:flex gradient-gold text-primary border-0 gap-1">
                  <Crown className="h-3 w-3" />
                  {t('premium.badge')}
                </Badge>
              )}
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
                onClick={() => setShowPricingModal(true)}
              >
                <Crown className="h-4 w-4 mr-1" />
                {t('premium.upgrade')}
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
                  <div className="flex items-center gap-2 py-2 flex-wrap">
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
                  {/* FORCED: Admin button for ANY logged-in user on mobile */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      navigate('/admin');
                      setIsMenuOpen(false);
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      navigate('/profile');
                      setIsMenuOpen(false);
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Mein Profil
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
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
                      setShowPricingModal(true);
                      setIsMenuOpen(false);
                    }}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    {t('premium.upgrade')}
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Pricing Modal */}
      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
      />
    </header>
  );
}
