import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryColor, formatDeadline, getDaysUntilDeadline } from '@/data/mockArtPrizes';
import type { ArtPrize } from '@/hooks/useArtPrizes';
import { formatCurrency } from '@/hooks/useArtPrizes';
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
  Banknote,
  MapPin,
  Users,
  ThumbsDown,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Lock,
  Crown,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import { AIConsultantDialog } from './AIConsultantDialog';
import { PricingModal } from './PricingModal';

interface PrizeDetailModalProps {
  prize: ArtPrize | null;
  isOpen: boolean;
  onClose: () => void;
  isProUser: boolean;
  trustStatus?: 'verified' | 'neutral' | 'warning';
}

export function PrizeDetailModal({ prize, isOpen, onClose, isProUser, trustStatus = 'verified' }: PrizeDetailModalProps) {
  const { t, language } = useLanguage();
  const { user, isAdmin } = useAuth();
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  if (!prize) return null;

  const categoryClass = getCategoryColor(prize.category);
  const daysLeft = getDaysUntilDeadline(prize.deadline);
  const isUrgent = daysLeft <= 7;

  // 7-DAY RULE: If deadline is within 7 days, show ALL details to EVERYONE (teaser)
  // If deadline is more than 7 days away, lock for free users
  const canAccess = isAdmin || isProUser || isUrgent;

  // Black Sheep warning check
  const isBlackSheep = trustStatus === 'warning';

  const handleUpgrade = () => {
    // Always open pricing modal - it will handle login redirect if needed
    setShowPricingModal(true);
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <Badge className={`${categoryClass} text-white border-0 shrink-0`}>
                {prize.category}
              </Badge>
              <DialogTitle className="font-display text-2xl text-left">
                {prize.name}
              </DialogTitle>
              {!canAccess && (
                <div className="shrink-0 bg-muted rounded-full p-1.5">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            {canAccess && (
              <p className="text-muted-foreground text-left">{prize.organizer}</p>
            )}
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Black Sheep Warning - ALWAYS VISIBLE for safety */}
            {isBlackSheep && (
              <div className="bg-destructive/20 border-2 border-destructive rounded-xl p-4">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-bold uppercase tracking-wide">
                    {language === 'de' ? 'Achtung: Mögliche Kostenfalle!' : 'Warning: Potential Scam!'}
                  </span>
                </div>
                <p className="text-sm text-destructive/90">
                  {language === 'de' 
                    ? 'Diese Ausschreibung wurde als potenziell unseriös gemeldet. Bitte prüfen Sie die Konditionen sorgfältig.'
                    : 'This call has been flagged as potentially dubious. Please review the conditions carefully.'}
                </p>
              </div>
            )}

            {/* Deadline and Fee highlight - always visible */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-muted/50 rounded-xl p-4 border border-border">
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
              
              {/* Fee warning - prominent */}
              {prize.fee !== null && prize.fee > 0 && (
                <div className="sm:w-auto bg-destructive/20 rounded-xl p-4 border-2 border-destructive">
                  <div className="flex items-center gap-2 text-sm text-destructive mb-1">
                    <ThumbsDown className="h-4 w-4" />
                    <span className="font-bold uppercase tracking-wide">
                      Achtung!
                    </span>
                  </div>
                  <div className="font-display text-2xl font-bold text-destructive">
                    👎 {prize.fee} € Gebühr!
                  </div>
                </div>
              )}
            </div>

            {/* Pro content or upgrade CTA */}
            {canAccess ? (
              <>
                {/* Key info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {prize.prizeAmount !== null && prize.prizeAmount > 0 && (
                    <div className="bg-accent/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Banknote className="h-4 w-4" />
                        <span>{t('calendar.prize')}</span>
                      </div>
                      <div className="font-display text-xl font-bold text-accent">
                        {formatCurrency(prize.prizeAmount, prize.currency, language)}
                      </div>
                    </div>
                  )}

                  {(prize.region || prize.country) && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <MapPin className="h-4 w-4" />
                        <span>{t('calendar.region')}</span>
                      </div>
                      <div className="font-semibold text-foreground">
                        {[prize.region, prize.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  )}

                  {((prize.ageMin !== null && prize.ageMin > 0) || (prize.ageMax !== null && prize.ageMax > 0)) && (
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
                {prize.requirements && prize.requirements.length > 0 && (
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
                )}

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
              </>
            ) : (
              /* Upgrade CTA for non-pro users */
              <>
                {/* Blurred description preview */}
                <div className="relative">
                  <p className="text-muted-foreground leading-relaxed blur-[4px] select-none">
                    {prize.description.substring(0, 200)}...
                  </p>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
                </div>

                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
                    <Lock className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    {t('premium.hiddenInfo')}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    {language === 'de' 
                      ? 'Erhalten Sie Zugang zu allen Details, Beschreibungen, Anforderungen und Links.'
                      : 'Get access to all details, descriptions, requirements and links.'}
                  </p>
                  <Button
                    size="lg"
                    className="gradient-gold text-primary font-semibold border-0"
                    onClick={handleUpgrade}
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    {language === 'de' ? 'Jetzt Pro werden' : 'Go Pro'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {canAccess && (
        <AIConsultantDialog
          prize={prize}
          isOpen={showAIDialog}
          onClose={() => setShowAIDialog(false)}
        />
      )}

      {/* Pricing Modal for upgrade */}
      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />
    </>
  );
}
