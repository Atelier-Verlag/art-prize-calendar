import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryColor, formatDeadline, getDaysUntilDeadline, isDeadlineSoon } from '@/data/mockArtPrizes';
import type { ArtPrize } from '@/hooks/useArtPrizes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, ThumbsDown, ExternalLink, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

interface CalendarCardProps {
  prize: ArtPrize;
  isProUser: boolean;
  onDetailsClick: () => void;
}

// Map country to allowed display values
function getCountryBadge(country: string): string {
  const normalizedCountry = country?.toLowerCase() || '';
  
  if (normalizedCountry.includes('schweiz') || normalizedCountry === 'ch' || normalizedCountry.includes('switzerland')) {
    return 'Schweiz';
  }
  if (normalizedCountry.includes('österreich') || normalizedCountry === 'at' || normalizedCountry.includes('austria')) {
    return 'Österreich';
  }
  if (normalizedCountry.includes('deutschland') || normalizedCountry === 'de' || normalizedCountry.includes('germany')) {
    return 'Deutschland';
  }
  return 'International';
}

// Derive precise location from region (for footer display)
function getPreciseLocation(region: string): string | null {
  const r = region?.toLowerCase() || '';
  
  // Check for specific regions/cities - return exact location
  if (r.includes('berlin')) return 'Berlin';
  if (r.includes('nrw') || r.includes('nordrhein')) return 'NRW';
  if (r.includes('bayern')) return 'Bayern';
  if (r.includes('hamburg')) return 'Hamburg';
  if (r.includes('köln')) return 'Stadt Köln';
  if (r.includes('münchen')) return 'München';
  if (r.includes('tirol')) return 'Region Tirol';
  if (r.includes('kärnten')) return 'Kärnten';
  if (r.includes('wien')) return 'Wien';
  if (r.includes('zürich')) return 'Zürich';
  
  // No specific restriction - return null
  return null;
}

// Get requirement from requirements array
function getRequirement(requirements: string[] | null): string {
  if (!requirements || requirements.length === 0) return 'Keine';
  // Return first requirement as main display
  return requirements[0];
}

// Check if prize is older than 5 days (using deadline > 60 days as proxy)
function isOlderThan5Days(deadline: string): boolean {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 60;
}

export function CalendarCard({ prize, isProUser, onDetailsClick }: CalendarCardProps) {
  const { language } = useLanguage();
  const { user, startCheckout } = useAuth();
  const navigate = useNavigate();
  
  const deadlineDate = new Date(prize.deadline);
  const daysUntilDeadline = differenceInDays(deadlineDate, new Date());
  const isDeadlineUrgent = daysUntilDeadline >= 0 && daysUntilDeadline < 7;
  const categoryColorClass = getCategoryColor(prize.category);
  
  // Paywall logic
  const isOld = isOlderThan5Days(prize.deadline);
  const canAccess = isProUser || !isOld;

  const handleUnlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
    } else {
      startCheckout('price_1SjMfs2MuRh0bb5poHynGcCg');
    }
  };

  const countryBadge = getCountryBadge(prize.country);

  // Format age display
  const getAgeDisplay = () => {
    if ((prize.ageMin === null || prize.ageMin === 0) && (prize.ageMax === null || prize.ageMax === 0)) {
      return 'Keine Begrenzung';
    }
    if (prize.ageMax && (!prize.ageMin || prize.ageMin === 0)) {
      return `bis ${prize.ageMax}`;
    }
    if (prize.ageMin && (!prize.ageMax || prize.ageMax === 0)) {
      return `ab ${prize.ageMin}`;
    }
    return `${prize.ageMin}-${prize.ageMax}`;
  };

  // Determine header bar color based on deadline
  const headerBarColorClass = isDeadlineUrgent 
    ? 'bg-destructive' 
    : 'bg-primary';

  return (
    <div
      className={`
        relative group
        bg-card rounded-xl overflow-hidden
        shadow-[0_4px_20px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]
        hover:shadow-[0_8px_30px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.06)]
        transition-all duration-300 ease-out
        ${!canAccess ? 'opacity-90' : ''}
      `}
    >
      {/* COLORED HEADER BAR - FINAL DESIGN */}
      <div className={`${headerBarColorClass} px-3 md:px-4 py-2.5 md:py-3 flex items-center justify-between`}>
        <span className="text-white text-xs md:text-sm font-semibold">
          {prize.category}
        </span>
        <div className="text-white text-right">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide block leading-tight">
            Deadline
          </span>
          <span className="text-sm md:text-base font-extrabold leading-tight">
            {format(deadlineDate, 'dd.MM.yyyy', { locale: de })}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 md:p-4 relative">
        {/* Fee warning - always visible */}
        {prize.fee !== null && prize.fee > 0 && (
          <div className="mb-3">
            <Badge className="bg-destructive border-0 font-bold animate-pulse-soft text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5 flex items-center gap-1 md:gap-1.5 w-fit">
              <ThumbsDown className="w-3 h-3 md:w-4 md:h-4 text-black fill-black stroke-[2.5]" />
              <span className="text-destructive-foreground">{prize.fee} € Gebühr!</span>
            </Badge>
          </div>
        )}

        {/* Content wrapper with blur effect for non-pro */}
        <div className={`${!canAccess ? 'blur-[6px] select-none pointer-events-none' : ''}`}>

          {/* TITLE - with proper word break for mobile */}
          <h3 className="font-display text-base md:text-lg font-bold text-foreground mb-3 break-words hyphens-auto">
            {prize.name}
          </h3>

          {/* META BLOCK - flex wrap for mobile */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs md:text-sm text-muted-foreground mb-4">
            {/* Sparte */}
            <div className="min-w-fit">
              Sparte: <span className="text-foreground">{prize.sparte || 'Alle Bereiche'}</span>
            </div>
            
            {/* Alter */}
            <div className="min-w-fit">
              Alter: <span className="text-foreground">{getAgeDisplay()}</span>
            </div>
            
            {/* Voraussetzung (NEW - replaces Örtliche Begrenzung) */}
            <div className="w-full">
              Voraussetzung: <span className="text-foreground">{getRequirement(prize.requirements)}</span>
            </div>
          </div>

          {/* HIGHLIGHT: Dotierung/Leistung (REQUIRED) */}
          <div className="bg-accent/10 rounded-lg px-2.5 md:px-3 py-2 md:py-2.5 mb-4">
            <span className="font-bold text-foreground text-sm md:text-base break-words">
              {prize.benefitDetails || 'Auf Anfrage'}
            </span>
          </div>

          {/* FOOTER: Precise Location + Country Badge (left) + Details Button (right) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Precise location text (if available) */}
              {getPreciseLocation(prize.region) && (
                <span className="text-xs text-muted-foreground font-medium">
                  {getPreciseLocation(prize.region)}
                </span>
              )}
              {/* Country Badge */}
              <Badge variant="outline" className="text-xs px-2 md:px-2.5 py-0.5 md:py-1 bg-muted/50 font-medium">
                {countryBadge}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDetailsClick();
              }}
              className="text-xs h-8 md:h-9 px-3 md:px-4 min-h-[44px] md:min-h-0"
            >
              <ExternalLink className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
              Details ansehen
            </Button>
          </div>
        </div>

        {/* Lock overlay for non-pro users */}
        {!canAccess && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none bg-background/40">
            <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3 md:p-4 shadow-lg flex flex-col items-center gap-2">
              <Lock className="h-6 w-6 md:h-8 md:w-8 text-accent" />
              <span className="text-xs md:text-sm font-semibold text-foreground">Nur für Mitglieder</span>
            </div>
          </div>
        )}
      </div>

      {/* Unlock Button for locked cards */}
      {!canAccess && (
        <div className="px-3 md:px-4 pb-3 md:pb-4">
          <Button
            className="w-full gradient-gold text-primary font-semibold border-0 text-xs md:text-sm h-8 md:h-10"
            onClick={handleUnlock}
          >
            <Lock className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Freischalten
          </Button>
        </div>
      )}
    </div>
  );
}
