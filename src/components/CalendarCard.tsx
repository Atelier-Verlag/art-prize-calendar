import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryColor, formatDeadline, getDaysUntilDeadline, isDeadlineSoon } from '@/data/mockArtPrizes';
import type { ArtPrize } from '@/hooks/useArtPrizes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, ThumbsDown, ExternalLink, Calendar } from 'lucide-react';

interface CalendarCardProps {
  prize: ArtPrize;
  isProUser: boolean;
  onClick: () => void;
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

// Check if prize is older than 5 days (using deadline > 60 days as proxy)
function isOlderThan5Days(deadline: string): boolean {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 60;
}

export function CalendarCard({ prize, isProUser, onClick }: CalendarCardProps) {
  const { language } = useLanguage();
  const { user, startCheckout } = useAuth();
  const navigate = useNavigate();
  
  const daysLeft = getDaysUntilDeadline(prize.deadline);
  const isSoon = isDeadlineSoon(prize.deadline);
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

  const handleClick = () => {
    if (canAccess) {
      onClick();
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

  return (
    <div
      className={`
        relative group cursor-pointer
        bg-card rounded-xl overflow-hidden
        shadow-[0_8px_30px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.06)]
        hover:shadow-[0_20px_50px_rgba(0,0,0,0.2),0_10px_20px_rgba(0,0,0,0.1)]
        transition-all duration-300 ease-out
        hover:-translate-y-2
        ${!canAccess ? 'opacity-90' : ''}
      `}
      onClick={handleClick}
    >
      {/* Calendar tear effect top */}
      <div className="h-3 bg-muted border-b border-border flex items-end justify-center gap-1.5 pb-0.5">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-border" />
        ))}
      </div>

      {/* Deadline header */}
      <div className={`
        px-4 py-3 text-center border-b border-border
        ${isSoon ? 'bg-destructive/10' : 'bg-sky-100 dark:bg-sky-900/30'}
      `}>
        <div className="flex items-center justify-center gap-2">
          <Calendar className={`h-4 w-4 ${isSoon ? 'text-destructive' : 'text-sky-700 dark:text-sky-300'}`} />
          <span className={`
            text-xs font-bold uppercase tracking-wider
            ${isSoon ? 'text-destructive animate-pulse-soft' : 'text-sky-700 dark:text-sky-300'}
          `}>
            Deadline
          </span>
        </div>
        <div className={`
          font-display text-2xl font-bold mt-1
          ${isSoon ? 'text-destructive' : 'text-sky-900 dark:text-sky-100'}
        `}>
          {formatDeadline(prize.deadline, language)}
        </div>
        {daysLeft > 0 && (
          <div className={`
            text-sm mt-1
            ${isSoon ? 'text-destructive font-semibold' : 'text-sky-700 dark:text-sky-300'}
          `}>
            {daysLeft} Tage
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 relative">
        {/* Fee warning - always visible */}
        {prize.fee !== null && prize.fee > 0 && (
          <div className="mb-3">
            <Badge className="bg-destructive border-0 font-bold animate-pulse-soft text-sm px-3 py-1.5 flex items-center gap-1.5 w-fit">
              <ThumbsDown className="w-4 h-4 text-black fill-black stroke-[2.5]" />
              <span className="text-destructive-foreground">{prize.fee} € Gebühr!</span>
            </Badge>
          </div>
        )}

        {/* Content wrapper with blur effect for non-pro */}
        <div className={`${!canAccess ? 'blur-[6px] select-none pointer-events-none' : ''}`}>
          
          {/* TOP ROW: Category Badge */}
          <div className="mb-3">
            <Badge className={`${categoryColorClass} border-0 text-xs font-semibold px-2.5 py-1`}>
              {prize.category}
            </Badge>
          </div>

          {/* TITLE */}
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground line-clamp-2 mb-3 group-hover:text-accent transition-colors">
            {prize.name}
          </h3>

          {/* META BLOCK */}
          <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
            {/* Line 1: Sparte */}
            <div>
              Sparte: <span className="text-foreground">{prize.sparte || 'Alle Bereiche'}</span>
            </div>
            
            {/* Line 2: Alter */}
            <div>
              Alter: <span className="text-foreground">{getAgeDisplay()}</span>
            </div>
            
            {/* Line 3: Region Detail */}
            <div>
              Region: <span className="text-foreground">{prize.region || 'International'}</span>
            </div>
          </div>

          {/* HIGHLIGHT: Dotierung/Leistung (REQUIRED) */}
          <div className="bg-accent/10 rounded-lg px-3 py-2.5 mb-4">
            <span className="font-bold text-foreground">
              {prize.benefitDetails || 'Auf Anfrage'}
            </span>
          </div>

          {/* FOOTER: Country Badge - bottom left */}
          <div className="flex justify-start">
            <Badge variant="outline" className="text-xs px-2.5 py-1 bg-muted/50 font-medium">
              {countryBadge}
            </Badge>
          </div>
        </div>

        {/* Lock overlay for non-pro users */}
        {!canAccess && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none bg-background/40">
            <div className="bg-background/90 backdrop-blur-sm rounded-lg p-4 shadow-lg flex flex-col items-center gap-2">
              <Lock className="h-8 w-8 text-accent" />
              <span className="text-sm font-semibold text-foreground">Nur für Mitglieder</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-4 pb-4">
        {canAccess ? (
          <Button
            variant="outline"
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Details
          </Button>
        ) : (
          <Button
            className="w-full gradient-gold text-primary font-semibold border-0"
            onClick={handleUnlock}
          >
            <Lock className="h-4 w-4 mr-2" />
            Freischalten
          </Button>
        )}
      </div>
    </div>
  );
}
