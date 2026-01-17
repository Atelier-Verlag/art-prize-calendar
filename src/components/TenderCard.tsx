import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDeadline, getDaysUntilDeadline } from '@/data/mockArtPrizes';
import type { Tender } from '@/hooks/useTenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Lock, Crown, ThumbsDown, Banknote, Users } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { PricingModal } from '@/components/PricingModal';
import { SeminarWaitlistForm } from '@/components/SeminarWaitlistForm';

interface TenderCardProps {
  tender: Tender;
  onClick: () => void;
  isProUser: boolean;
}

export function TenderCard({ tender, onClick, isProUser }: TenderCardProps) {
  const { t, language } = useLanguage();
  const { user, isAdmin } = useAuth();
  const [showPricingModal, setShowPricingModal] = useState(false);

  const daysLeft = tender.deadline ? getDaysUntilDeadline(tender.deadline) : 999;
  const isUrgent = daysLeft <= 3;

  // 3-DAY RULE: If deadline is within 3 days, show ALL details to EVERYONE (teaser)
  const hasAccess = isAdmin || isProUser || isUrgent;
  const isLocked = !hasAccess;

  // Black Sheep warning check - tenders with entry fees are flagged
  const hasEntryFee = tender.entry_fee !== null && tender.entry_fee !== undefined && tender.entry_fee > 0;

  // Artist fee highlight - organizer pays artists
  const hasArtistFee = tender.artist_fee === true;

  // Get geo scope display with emoji
  const getGeoScopeDisplay = () => {
    const scopeMap: Record<string, { emoji: string; label: string }> = {
      local: { emoji: '📍', label: language === 'de' ? 'Lokal' : 'Local' },
      regional: { emoji: '🗺️', label: language === 'de' ? 'Regional' : 'Regional' },
      national: { emoji: '🇩🇪', label: language === 'de' ? 'National' : 'National' },
      international: { emoji: '🌍', label: 'International' },
    };
    return scopeMap[tender.geo_scope || 'national'] || scopeMap.national;
  };

  // Format entry fee for display
  const formatEntryFee = (amount: number) => {
    return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const handleUnlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPricingModal(true);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tender.application_link) {
      window.open(tender.application_link, '_blank', 'noopener,noreferrer');
    } else {
      onClick();
    }
  };

  return (
    <article
      className={`group relative bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer border ${
        hasEntryFee ? 'border-destructive border-2' : 'border-border'
      }`}
      onClick={isLocked ? undefined : onClick}
    >
      {/* Black Sheep Warning Banner - Entry Fee Warning */}
      {hasEntryFee && (
        <HoverCard openDelay={0} closeDelay={300}>
          <HoverCardTrigger asChild>
            <div className="bg-destructive text-destructive-foreground px-4 py-3 flex items-center justify-between gap-2 cursor-help hover:bg-destructive/90 transition-colors">
              <div className="flex items-center gap-2">
                <ThumbsDown className="h-5 w-5" />
                <span className="text-sm font-bold">
                  {t('blacksheep.warning')}
                </span>
              </div>
              <Badge 
                variant="destructive" 
                className="bg-red-900 text-white font-bold px-3 py-1"
              >
                {formatEntryFee(tender.entry_fee!)}
              </Badge>
            </div>
          </HoverCardTrigger>
          <HoverCardContent 
            className="w-[420px] p-5 z-[100]" 
            side="top" 
            align="center"
            sideOffset={12}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-destructive font-bold text-lg">
                <ThumbsDown className="h-6 w-6" />
                <span>Achtung: Teilnahmegebühren!</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                Weitere Informationen zur Grauzone erfahren Sie regelmäßig aktuell in der Zeitschrift{' '}
                <a 
                  href="https://www.atelier-verlag.de" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80 font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  'ateliery' (www.atelier-verlag.de)
                </a>{' '}
                in der Rubrik 'Grauzone'.
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                Eine Liste behandelter Fälle finden Sie unter:{' '}
                <a 
                  href="https://www.atelier-verlag.de/grauzone-archiv" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80 font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  Grauzone Archiv
                </a>
              </p>
              
              <Separator className="my-4" />
              <SeminarWaitlistForm />
            </div>
          </HoverCardContent>
        </HoverCard>
      )}

      {/* Artist Fee Highlight Banner */}
      {hasArtistFee && !hasEntryFee && (
        <div className="bg-emerald-600 text-white px-4 py-2 flex items-center gap-2">
          <Banknote className="h-4 w-4" />
          <span className="text-sm font-semibold">
            {language === 'de' ? 'Künstlerhonorar wird gezahlt' : 'Artist Fee Paid'}
          </span>
        </div>
      )}

      {/* Header Bar - Color based on urgency */}
      <div className={`${isUrgent ? 'bg-destructive' : 'bg-primary'} px-4 py-3 flex justify-between items-center`}>
        <span className="text-primary-foreground text-sm font-semibold uppercase tracking-wide">
          {tender.category || (language === 'de' ? 'Ausschreibung' : 'Open Call')}
        </span>
        <div className="text-right">
          <span className="text-primary-foreground/80 text-xs uppercase tracking-wider block">{t('calendar.deadline')}</span>
          <span className="text-primary-foreground font-extrabold text-lg">
            {tender.deadline ? formatDeadline(tender.deadline, language) : '—'}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 md:p-5 relative min-h-[220px]">
        {/* All content rendered but blurred when locked - "milk glass" effect */}
        <div className={`${isLocked ? 'blur-[6px] select-none pointer-events-none' : ''}`}>
          {/* Title */}
          <h3 className="font-display text-lg md:text-xl font-bold text-foreground line-clamp-2 break-words hyphens-auto mb-2">
            {tender.title}
          </h3>

          {/* Organizer */}
          {tender.organizer && (
            <p className="text-sm text-muted-foreground mb-3">
              {tender.organizer}
            </p>
          )}

          {/* Description */}
          {tender.description && (
            <p className="text-sm text-foreground/80 line-clamp-3 mb-4">
              {tender.description}
            </p>
          )}

          {/* Disciplines Tags - Font size increased by 2pt */}
          {tender.disciplines && tender.disciplines.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tender.disciplines.slice(0, 4).map((discipline, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {discipline}
                </Badge>
              ))}
              {tender.disciplines.length > 4 && (
                <Badge variant="outline" className="text-sm">
                  +{tender.disciplines.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Age Limit - Font size increased by 2pt */}
          <div className="flex items-center gap-1.5 text-base text-muted-foreground mb-4">
            <Users className="h-4 w-4" />
            <span>
              {language === 'de' ? 'Altersbegrenzung: ' : 'Age Limit: '}
              {!tender.age_limit || tender.age_limit === '' || tender.age_limit.toLowerCase() === 'none' 
                ? (language === 'de' ? 'Keine' : 'None')
                : tender.age_limit
              }
            </span>
          </div>

          {/* Prize Detail Highlight - Font size increased by 2pt */}
          {tender.prize_detail && (
            <div className="bg-accent/10 rounded-lg p-3 mb-4">
              <span className="text-base font-semibold text-foreground">{t('card.prizeLabel')}:</span>
              <div className="font-display text-lg font-bold text-foreground line-clamp-2">
                {tender.prize_detail}
              </div>
            </div>
          )}
        </div>

        {/* LOCK OVERLAY - Positioned on top of blurred content */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3 p-4 bg-background/40 rounded-xl backdrop-blur-[2px]">
              <div className="bg-primary rounded-full p-4 shadow-lg">
                <Lock className="h-8 w-8 text-primary-foreground" />
              </div>
              <p className="text-base font-bold text-foreground text-center">
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
            {/* Location */}
            {tender.location && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {tender.location}
              </span>
            )}
            {/* Geo Scope Badge */}
            <Badge variant="secondary" className="text-xs">
              {getGeoScopeDisplay().emoji} {getGeoScopeDisplay().label}
            </Badge>
          </div>

          {/* CTA Button - hidden when locked since overlay has button */}
          {!isLocked && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary font-semibold h-8 md:h-9 px-3 md:px-4 min-h-[44px]"
              onClick={handleDetailsClick}
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
