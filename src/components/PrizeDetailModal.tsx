import { useLanguage } from '@/contexts/LanguageContext';
import { getCategoryColor, formatDeadline } from '@/data/mockArtPrizes';
import type { ArtPrize } from '@/hooks/useArtPrizes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Euro,
  MapPin,
  Users,
  ThumbsDown,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { AIConsultantDialog } from './AIConsultantDialog';

interface PrizeDetailModalProps {
  prize: ArtPrize | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PrizeDetailModal({ prize, isOpen, onClose }: PrizeDetailModalProps) {
  const { t, language } = useLanguage();
  const [showAIDialog, setShowAIDialog] = useState(false);

  if (!prize) return null;

  const categoryClass = getCategoryColor(prize.category);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <Badge className={`${categoryClass} text-white border-0 shrink-0`}>
                {t(`category.${prize.category}`)}
              </Badge>
              <DialogTitle className="font-display text-2xl text-left">
                {prize.name}
              </DialogTitle>
            </div>
            <p className="text-muted-foreground text-left">{prize.organizer}</p>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Deadline highlight */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold uppercase tracking-wide">
                  {t('calendar.deadline')}
                </span>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">
                {formatDeadline(prize.deadline, language)}
              </div>
            </div>

            {/* Key info grid */}
            <div className="grid grid-cols-2 gap-4">
              {prize.prizeAmount && (
                <div className="bg-accent/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Euro className="h-4 w-4" />
                    <span>{t('calendar.prize')}</span>
                  </div>
                  <div className="font-display text-xl font-bold text-accent">
                    {prize.prizeAmount.toLocaleString(language === 'de' ? 'de-DE' : 'en-US')} €
                  </div>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MapPin className="h-4 w-4" />
                  <span>{t('calendar.region')}</span>
                </div>
                <div className="font-semibold text-foreground">
                  {prize.region}, {prize.country}
                </div>
              </div>

              {(prize.ageMin || prize.ageMax) && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span>{t('calendar.age')}</span>
                  </div>
                  <div className="font-semibold text-foreground">
                    {prize.ageMin && prize.ageMax
                      ? `${prize.ageMin}-${prize.ageMax} ${language === 'de' ? 'Jahre' : 'years'}`
                      : prize.ageMax
                      ? `≤ ${prize.ageMax} ${language === 'de' ? 'Jahre' : 'years'}`
                      : `≥ ${prize.ageMin} ${language === 'de' ? 'Jahre' : 'years'}`}
                  </div>
                </div>
              )}

              {prize.fee && (
                <div className="bg-destructive/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-destructive mb-1">
                    <ThumbsDown className="h-4 w-4" />
                    <span>{t('calendar.fee')}</span>
                  </div>
                  <div className="font-semibold text-destructive">
                    {prize.fee} €
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h4 className="font-display text-lg font-semibold mb-2">Beschreibung</h4>
              <p className="text-muted-foreground leading-relaxed">
                {prize.description}
              </p>
            </div>

            {/* Requirements */}
            <div>
              <h4 className="font-display text-lg font-semibold mb-3">Anforderungen</h4>
              <ul className="space-y-2">
                {prize.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 gradient-gold text-primary font-semibold border-0"
                onClick={() => window.open(prize.website, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Zur Website des Veranstalters
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowAIDialog(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t('nav.ai')} nutzen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AIConsultantDialog
        prize={prize}
        isOpen={showAIDialog}
        onClose={() => setShowAIDialog(false)}
      />
    </>
  );
}
