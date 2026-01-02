import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryColor, formatDeadline, getDaysUntilDeadline } from '@/data/mockArtPrizes';
import type { ArtPrize } from '@/hooks/useArtPrizes';
import { formatCurrency } from '@/hooks/useArtPrizes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Lock, Crown, AlertTriangle } from 'lucide-react';
import { PricingModal } from '@/components/PricingModal';

interface CalendarCardProps {
  prize: ArtPrize;
  onClick: () => void;
  isProUser: boolean;
  trustStatus?: 'verified' | 'neutral' | 'warning';
}

export function CalendarCard({ prize, onClick, isProUser, trustStatus = 'verified' }: CalendarCardProps) {
  const { t, language } = useLanguage();
  const { user, isAdmin } = useAuth();
  const [showPricingModal, setShowPricingModal] = useState(false);

  const categoryClass = getCategoryColor(prize.category);
  const daysLeft = getDaysUntilDeadline(prize.deadline);
  const isUrgent = daysLeft <= 7;

  // 7-DAY RULE: If deadline is within 7 days, show ALL details to EVERYONE (teaser)
  // If deadline is more than 7 days away, lock for free users
  const hasAccess = isAdmin || isProUser || isUrgent;
  const isLocked = !hasAccess;

  // Black Sheep warning check
  const isBlackSheep = trustStatus === 'warning';

  // Get country flag emoji based on country code
  const getCountryFlag = (country: string) => {
    const countryMap: Record<string, string> = {
      Deutschland: '🇩🇪',
      Germany: '🇩🇪',
      Österreich: '🇦🇹',
      Austria: '🇦🇹',
      Schweiz: '🇨🇭',
      Switzerland: '🇨🇭',
      International: '🌍',
    };
    return countryMap[country] || '🌍';
  };

  // Get display value for "Sparte" (discipline) - use sparte field, NOT category
  const getDiscipline = () => {
    return prize.sparte || 'Alle Bereiche';
  };

  // Get age display
  const getAgeDisplay = () => {
    if (prize.ageMin && prize.ageMax) {
      return `${prize.ageMin}-${prize.ageMax} ${language === 'de' ? 'Jahre' : 'years'}`;
    }
    if (prize.ageMax) {
      return `≤ ${prize.ageMax} ${language === 'de' ? 'Jahre' : 'years'}`;
    }
    if (prize.ageMin) {
      return `≥ ${prize.ageMin} ${language === 'de' ? 'Jahre' : 'years'}`;
    }
    return t('card.noRestriction');
  };

  // Get requirement display
  const getRequirement = () => {
    if (prize.requirements && prize.requirements.length > 0) {
      return prize.requirements[0];
    }
    return t('card.none');
  };

  // Get precise location (specific region restriction)
  const getPreciseLocation = () => {
    if (prize.region && prize.region !== prize.country) {
      return prize.region;
    }
    return null;
  };

  const handleUnlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Always open pricing modal - no redirect to login
    setShowPricingModal(true);
  };

  return (
    <article
      className={`group relative bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer border ${
        isBlackSheep ? 'border-destructive border-2' : 'border-border'
      }`}
      onClick={isLocked ? undefined : onClick}
    >
      {/* Black Sheep Warning Banner - ALWAYS VISIBLE for safety */}
      {isBlackSheep && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-bold">
            {language === 'de' ? 'Achtung: Mögliche Kostenfalle!' : 'Warning: Potential Scam!'}
          </span>
        </div>
      )}

      {/* Header Bar - Color based on urgency */}
      <div className={`${isUrgent ? 'bg-destructive' : 'bg-primary'} px-4 py-3 flex justify-between items-center`}>
        <span className="text-primary-foreground text-sm font-semibold uppercase tracking-wide">
          {prize.category}
        </span>
        <div className="text-right">
          <span className="text-primary-foreground/80 text-xs uppercase tracking-wider block">{t('calendar.deadline')}</span>
          <span className="text-primary-foreground font-extrabold text-lg">
            {formatDeadline(prize.deadline, language)}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 md:p-5 relative">
        {/* Title - ALWAYS visible as teaser */}
        <h3 className="font-display text-lg md:text-xl font-bold text-foreground line-clamp-2 break-words hyphens-auto mb-4">
          {prize.name}
        </h3>

        {/* Meta Info - blurred if locked */}
        <div
          className={`space-y-2 mb-4 text-sm transition-all ${
            isLocked ? 'blur-md select-none pointer-events-none' : ''
          }`}
          aria-hidden={isLocked}
        >
          <div className="flex flex-wrap gap-x-2">
            <span className="text-muted-foreground">{t('card.sparte')}:</span>
            <span className="font-medium text-foreground">{getDiscipline()}</span>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <span className="text-muted-foreground">{t('card.age')}:</span>
            <span className="font-medium text-foreground">{getAgeDisplay()}</span>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <span className="text-muted-foreground">{t('card.requirement')}:</span>
            <span className="font-medium text-foreground">{getRequirement()}</span>
          </div>
        </div>

        {/* Prize Amount Highlight - blurred if locked */}
        <div
          className={`bg-accent/10 rounded-lg p-3 mb-4 transition-all ${
            isLocked ? 'blur-md select-none pointer-events-none' : ''
          }`}
          aria-hidden={isLocked}
        >
          <span className="text-sm font-semibold text-foreground">{t('card.prizeLabel')}:</span>
          <div className="font-display text-xl font-bold text-foreground">
            {prize.prizeAmount && prize.prizeAmount > 0
              ? formatCurrency(prize.prizeAmount, prize.currency, language)
              : prize.benefitDetails || t('card.noInfo')}
          </div>
        </div>

        {/* LOCK OVERLAY - Centered on top of blurred content */}
        {isLocked && (
          <div className="absolute inset-0 top-[60px] flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3 p-4">
              <div className="bg-muted rounded-full p-4 shadow-lg">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-medium text-center">
                {language === 'de' ? 'Premium-Inhalt' : 'Premium Content'}
              </p>
              <Button
                size="sm"
                className="gradient-gold text-primary font-semibold border-0 min-h-[44px] px-6"
                onClick={handleUnlock}
              >
                <Crown className="h-4 w-4 mr-2" />
                {language === 'de' ? 'Jetzt freischalten' : 'Unlock Now'}
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center justify-between pt-3 border-t border-border ${isLocked ? 'blur-md' : ''}`}>
          <div className="flex items-center gap-2">
            {/* Precise Location */}
            {getPreciseLocation() && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {getPreciseLocation()}
              </span>
            )}
            {/* Country Badge */}
            <Badge variant="secondary" className="text-xs">
              {getCountryFlag(prize.country)} {prize.country}
            </Badge>
          </div>

          {/* CTA Button - hidden when locked since overlay has button */}
          {!isLocked && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary font-semibold h-8 md:h-9 px-3 md:px-4 min-h-[44px]"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              {t('card.details')}
            </Button>
          )}
        </div>
      </div>

      {/* Pricing Modal */}
      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />
    </article>
  );
}
