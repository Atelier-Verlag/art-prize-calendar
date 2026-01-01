import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryColor, formatDeadline, getDaysUntilDeadline } from '@/data/mockArtPrizes';
import type { ArtPrize } from '@/hooks/useArtPrizes';
import { formatCurrency } from '@/hooks/useArtPrizes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Lock, Crown } from 'lucide-react';
import { PricingModal } from '@/components/PricingModal';

interface CalendarCardProps {
  prize: ArtPrize;
  onClick: () => void;
  isProUser: boolean;
}

export function CalendarCard({ prize, onClick, isProUser }: CalendarCardProps) {
  const { t, language } = useLanguage();
  const [showPricingModal, setShowPricingModal] = useState(false);
  
  const categoryClass = getCategoryColor(prize.category);
  const daysLeft = getDaysUntilDeadline(prize.deadline);
  const isUrgent = daysLeft <= 7;
  
  // Paywall: Content is locked if deadline > 7 days away and user is not Pro
  const isLocked = daysLeft > 7 && !isProUser;
  
  // Get country flag emoji based on country code
  const getCountryFlag = (country: string) => {
    const countryMap: Record<string, string> = {
      'Deutschland': '🇩🇪',
      'Germany': '🇩🇪',
      'Österreich': '🇦🇹',
      'Austria': '🇦🇹',
      'Schweiz': '🇨🇭',
      'Switzerland': '🇨🇭',
      'International': '🌍',
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
    setShowPricingModal(true);
  };

  return (
    <article 
      className="group relative bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer border border-border"
      onClick={isLocked ? undefined : onClick}
    >
      {/* Header Bar - Color based on urgency */}
      <div className={`${isUrgent ? 'bg-destructive' : 'bg-[hsl(220,60%,45%)]'} px-4 py-3 flex justify-between items-center`}>
        <span className="text-white text-sm font-semibold uppercase tracking-wide">
          {prize.category}
        </span>
        <div className="text-right">
          <span className="text-white/80 text-xs uppercase tracking-wider block">{t('calendar.deadline')}</span>
          <span className="text-white font-extrabold text-lg">
            {formatDeadline(prize.deadline, language)}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 md:p-5">
        {/* Title */}
        <h3 className="font-display text-lg md:text-xl font-bold text-foreground mb-4 line-clamp-2 break-words hyphens-auto">
          {prize.name}
        </h3>

        {/* Meta Info - 3 separate lines */}
        <div className="space-y-2 mb-4 text-sm">
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

        {/* Prize Amount Highlight */}
        <div className="bg-accent/10 rounded-lg p-3 mb-4">
          <span className="text-sm font-semibold text-foreground">{t('card.prizeLabel')}:</span>
          <div className="font-display text-xl font-bold text-[#000000] dark:text-foreground">
            {prize.prizeAmount && prize.prizeAmount > 0 
              ? formatCurrency(prize.prizeAmount, prize.currency, language)
              : (prize.benefitDetails || t('card.noInfo'))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
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
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary font-semibold h-8 md:h-9 px-3 md:px-4 min-h-[44px]"
            onClick={(e) => {
              e.stopPropagation();
              if (!isLocked) onClick();
            }}
          >
            {t('card.details')}
          </Button>
        </div>
      </div>

      {/* Lock Overlay for non-Pro users when deadline > 7 days */}
      {isLocked && (
        <div 
          className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <Lock className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-semibold text-foreground mb-3">{t('card.proOnly')}</p>
          <Button 
            size="sm" 
            className="gradient-gold text-primary font-semibold border-0"
            onClick={handleUnlock}
          >
            <Crown className="h-4 w-4 mr-2" />
            {t('card.unlock')}
          </Button>
        </div>
      )}

      {/* Pricing Modal */}
      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
      />
    </article>
  );
}
