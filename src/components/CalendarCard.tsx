import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryColor, formatDeadline, getDaysUntilDeadline, isDeadlineSoon } from '@/data/mockArtPrizes';
import type { ArtPrize } from '@/hooks/useArtPrizes';
import { formatCurrency } from '@/hooks/useArtPrizes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, ThumbsDown, MapPin, Banknote, Users, ExternalLink, Calendar } from 'lucide-react';

interface CalendarCardProps {
  prize: ArtPrize;
  isProUser: boolean;
  onClick: () => void;
}

export function CalendarCard({ prize, isProUser, onClick }: CalendarCardProps) {
  const { t, language } = useLanguage();
  const { user, startCheckout } = useAuth();
  const navigate = useNavigate();
  
  const daysLeft = getDaysUntilDeadline(prize.deadline);
  const isSoon = isDeadlineSoon(prize.deadline);
  const categoryClass = getCategoryColor(prize.category);
  
  // Free users can see prizes with deadline within 14 days
  const isWithin14Days = daysLeft <= 14;
  const canAccess = isProUser || isWithin14Days;

  const handleUnlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
    } else {
      // Default to monthly price
      startCheckout('price_1SjMfs2MuRh0bb5poHynGcCg');
    }
  };

  const handleClick = () => {
    if (canAccess) {
      onClick();
    }
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
            {t('calendar.deadline')}
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
            {daysLeft} {language === 'de' ? 'Tage' : 'days'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 relative">
        {/* Category badge and fee warning - always visible */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className={`${categoryClass} text-white border-0 relative z-10 text-sm px-3 py-1`}>
            {prize.category}
          </Badge>
          
          {/* Fee warning - prominent at top */}
          {prize.fee !== null && prize.fee > 0 && (
            <Badge className="bg-destructive border-0 font-bold relative z-10 animate-pulse-soft text-sm px-3 py-1.5 flex items-center gap-1.5">
              <ThumbsDown className="w-6 h-6 text-black fill-black stroke-[2.5]" />
              <span className="text-destructive-foreground">{prize.fee} € Gebühr!</span>
            </Badge>
          )}
        </div>

        {/* Content wrapper with blur effect for non-pro */}
        <div className={`${!canAccess ? 'blur-[6px] select-none pointer-events-none' : ''}`}>
          {/* Title */}
          <h3 className="font-display text-base sm:text-lg font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-accent transition-colors">
            {prize.name}
          </h3>

          {/* Organizer */}
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 truncate">
            {prize.organizer}
          </p>

          {/* Info grid */}
          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            {/* Prize money */}
            {prize.prizeAmount !== null && prize.prizeAmount > 0 && (
              <div className="flex items-center gap-2 text-foreground">
                <Banknote className="h-4 w-4 text-accent shrink-0" />
                <span className="font-semibold truncate">
                  {formatCurrency(prize.prizeAmount, prize.currency, language)}
                </span>
              </div>
            )}

            {/* Region */}
            {(prize.region || prize.country) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {[prize.region, prize.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            {/* Age limit */}
            {((prize.ageMin !== null && prize.ageMin > 0) || (prize.ageMax !== null && prize.ageMax > 0)) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <span>
                  {prize.ageMin && prize.ageMax
                    ? `${prize.ageMin}-${prize.ageMax} ${language === 'de' ? 'Jahre' : 'years'}`
                    : prize.ageMax
                    ? `≤ ${prize.ageMax} ${language === 'de' ? 'Jahre' : 'years'}`
                    : `≥ ${prize.ageMin} ${language === 'de' ? 'Jahre' : 'years'}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Lock overlay for non-pro users */}
        {!canAccess && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-background/80 backdrop-blur-sm rounded-full p-4 shadow-lg">
              <Lock className="h-8 w-8 text-accent" />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        {canAccess ? (
          <Button
            variant="outline"
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('calendar.details')}
          </Button>
        ) : (
          <Button
            className="w-full gradient-gold text-primary font-semibold border-0"
            onClick={handleUnlock}
          >
            <Lock className="h-4 w-4 mr-2" />
            {t('premium.unlock')}
          </Button>
        )}
      </div>
    </div>
  );
}
