import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryColor, formatDeadline } from '@/data/mockArtPrizes';
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
} from 'lucide-react';
import { useState } from 'react';
import { AIConsultantDialog } from './AIConsultantDialog';

interface PrizeDetailModalProps {
  prize: ArtPrize | null;
  isOpen: boolean;
  onClose: () => void;
  isProUser: boolean;
}

export function PrizeDetailModal({ prize, isOpen, onClose, isProUser }: PrizeDetailModalProps) {
  const { t, language } = useLanguage();
  const { user, isAdmin, startCheckout } = useAuth();
  const navigate = useNavigate();
  const [showAIDialog, setShowAIDialog] = useState(false);

  if (!prize) return null;

  const categoryClass = getCategoryColor(prize.category);

  // Paid access: only admins/pro users can see tender details.
  const canAccess = isAdmin || (user && isProUser);

  const handleUpgrade = () => {
    if (!user) {
      onClose();
      navigate('/auth');
    } else {
      startCheckout('price_1RjZ68D70Qs4RhIVb39PiHqZ');
    }
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
                {canAccess ? prize.name : t('premium.lockedTitle')}
              </DialogTitle>
            </div>
            {canAccess && (
              <p className="text-muted-foreground text-left">{prize.organizer}</p>
            )}
          </DialogHeader>

          <div className="space-y-6 mt-4">
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
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
                  <Lock className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  {t('premium.hiddenInfo')}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Erhalten Sie Zugang zu allen Details, Beschreibungen, Anforderungen und Links.
                </p>
                <Button
                  size="lg"
                  className="gradient-gold text-primary font-semibold border-0"
                  onClick={handleUpgrade}
                >
                  <Crown className="h-5 w-5 mr-2" />
                  {t('premium.upgrade')}
                </Button>
              </div>
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
    </>
  );
}
