import { useLanguage } from '@/contexts/LanguageContext';
import { ArtPrize, getCategoryColor, formatDeadline, getDaysUntilDeadline, isDeadlineSoon } from '@/data/mockArtPrizes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, ThumbsDown, MapPin, Euro, Users, ExternalLink, Calendar } from 'lucide-react';

interface CalendarCardProps {
  prize: ArtPrize;
  isLocked?: boolean;
  onClick: () => void;
}

export function CalendarCard({ prize, isLocked = false, onClick }: CalendarCardProps) {
  const { t, language } = useLanguage();
  const daysLeft = getDaysUntilDeadline(prize.deadline);
  const isSoon = isDeadlineSoon(prize.deadline);
  const categoryClass = getCategoryColor(prize.category);

  return (
    <div
      className={`
        relative group cursor-pointer
        bg-card rounded-xl overflow-hidden
        shadow-card hover:shadow-card-hover
        transition-all duration-300 ease-out
        hover:-translate-y-1
        ${isLocked ? 'opacity-75' : ''}
      `}
      onClick={onClick}
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
        ${isSoon ? 'bg-destructive/10' : 'bg-muted/50'}
      `}>
        <div className="flex items-center justify-center gap-2">
          <Calendar className={`h-4 w-4 ${isSoon ? 'text-destructive' : 'text-muted-foreground'}`} />
          <span className={`
            text-xs font-bold uppercase tracking-wider
            ${isSoon ? 'text-destructive animate-pulse-soft' : 'text-muted-foreground'}
          `}>
            {t('calendar.deadline')}
          </span>
        </div>
        <div className={`
          font-display text-2xl font-bold mt-1
          ${isSoon ? 'text-destructive' : 'text-foreground'}
        `}>
          {formatDeadline(prize.deadline, language)}
        </div>
        {daysLeft > 0 && (
          <div className={`
            text-sm mt-1
            ${isSoon ? 'text-destructive font-semibold' : 'text-muted-foreground'}
          `}>
            {daysLeft} {language === 'de' ? 'Tage' : 'days'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category badge */}
        <Badge className={`${categoryClass} text-white border-0 mb-3`}>
          {t(`category.${prize.category}`)}
        </Badge>

        {/* Title */}
        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-accent transition-colors">
          {prize.name}
        </h3>

        {/* Organizer */}
        <p className="text-sm text-muted-foreground mb-4">
          {prize.organizer}
        </p>

        {/* Info grid */}
        <div className="space-y-2 text-sm">
          {/* Prize money */}
          {prize.prizeAmount && (
            <div className="flex items-center gap-2 text-foreground">
              <Euro className="h-4 w-4 text-accent" />
              <span className="font-semibold">
                {prize.prizeAmount.toLocaleString(language === 'de' ? 'de-DE' : 'en-US')} €
              </span>
            </div>
          )}

          {/* Region */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{prize.region}, {prize.country}</span>
          </div>

          {/* Age limit */}
          {(prize.ageMin || prize.ageMax) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {prize.ageMin && prize.ageMax
                  ? `${prize.ageMin}-${prize.ageMax} ${language === 'de' ? 'Jahre' : 'years'}`
                  : prize.ageMax
                  ? `≤ ${prize.ageMax} ${language === 'de' ? 'Jahre' : 'years'}`
                  : `≥ ${prize.ageMin} ${language === 'de' ? 'Jahre' : 'years'}`}
              </span>
            </div>
          )}

          {/* Fee warning */}
          {prize.fee && (
            <div className="flex items-center gap-2 text-destructive font-medium bg-destructive/10 rounded-lg px-2 py-1.5 -mx-2">
              <ThumbsDown className="h-4 w-4" />
              <span>{t('calendar.fee')}: {prize.fee} €</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <Button
          variant="outline"
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          disabled={isLocked}
        >
          {isLocked ? (
            <>
              <Lock className="h-4 w-4 mr-2" />
              {t('calendar.locked')}
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('calendar.details')}
            </>
          )}
        </Button>
      </div>

      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
          <div className="text-center p-4">
            <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium text-foreground">{t('calendar.locked')}</p>
            <Button size="sm" className="mt-3 gradient-gold text-primary border-0">
              Upgrade to Pro
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
