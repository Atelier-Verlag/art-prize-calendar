import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Crown } from 'lucide-react';

// Stripe Price IDs
const PRICE_IDS = {
  monthly: 'price_1RjZ68D70Qs4RhIVb39PiHqZ',
  yearly: 'price_1RjZAED70Qs4RhIVcKy6V8rP',
};

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { t } = useLanguage();
  const { user, startCheckout } = useAuth();
  const navigate = useNavigate();

  const handleSelectPlan = async (priceId: string) => {
    if (!user) {
      onClose();
      navigate('/auth');
      return;
    }
    
    await startCheckout(priceId);
    onClose();
  };

  const plans = [
    {
      id: 'monthly',
      name: t('pricing.monthly'),
      price: '4',
      period: t('pricing.perMonth'),
      priceId: PRICE_IDS.monthly,
      popular: false,
    },
    {
      id: 'yearly',
      name: t('pricing.yearly'),
      price: '39',
      period: t('pricing.perYear'),
      priceId: PRICE_IDS.yearly,
      popular: true,
      savings: t('pricing.yearly.save'),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Crown className="h-6 w-6 text-accent" />
            {t('premium.upgrade')}
          </DialogTitle>
          <DialogDescription>
            {t('pricing.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`
                relative rounded-xl border-2 p-4 cursor-pointer transition-all
                ${plan.popular 
                  ? 'border-accent bg-accent/5' 
                  : 'border-border hover:border-accent/50'
                }
              `}
              onClick={() => handleSelectPlan(plan.priceId)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-full gradient-gold">
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {t('pricing.popular') || 'Beliebteste Wahl'}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {plan.savings && <span className="text-accent font-medium">{plan.savings}</span>}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display text-3xl font-bold">€{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border/50">
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    <span>{t('pricing.feature.all')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    <span>{t('pricing.feature.ai')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    <span>{t('pricing.feature.archive')}</span>
                  </li>
                </ul>
              </div>

              <Button 
                className={`w-full mt-4 ${plan.popular ? 'gradient-gold text-primary font-semibold border-0' : ''}`}
                variant={plan.popular ? 'default' : 'outline'}
              >
                {t('pricing.selectPlan') || 'Auswählen'}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {t('pricing.cancelAnytime') || 'Jederzeit kündbar. Sichere Zahlung über Stripe.'}
        </p>
      </DialogContent>
    </Dialog>
  );
}
