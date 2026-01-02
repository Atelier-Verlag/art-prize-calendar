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
import { Check, Sparkles, Crown, LogIn } from 'lucide-react';

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
  const { t, language } = useLanguage();
  const { user, startCheckout } = useAuth();
  const navigate = useNavigate();

  const handleSelectPlan = async (priceId: string) => {
    if (!user) {
      // Pass priceId to auth page so checkout continues after login/signup
      onClose();
      navigate(`/auth?priceId=${encodeURIComponent(priceId)}&returnTo=/`);
      return;
    }
    
    await startCheckout(priceId);
    onClose();
  };

  const plans = [
    {
      id: 'monthly',
      name: language === 'de' ? 'Monatspass' : 'Monthly Pass',
      price: '4',
      period: language === 'de' ? '/Monat' : '/month',
      priceId: PRICE_IDS.monthly,
      popular: false,
    },
    {
      id: 'yearly',
      name: language === 'de' ? 'Jahrespass' : 'Yearly Pass',
      price: '39',
      period: language === 'de' ? '/Jahr' : '/year',
      priceId: PRICE_IDS.yearly,
      popular: true,
      savings: language === 'de' ? 'Spare 19%' : 'Save 19%',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Crown className="h-6 w-6 text-accent" />
            {language === 'de' ? 'Jetzt Pro werden' : 'Go Pro'}
          </DialogTitle>
          <DialogDescription>
            {language === 'de' 
              ? 'Schalten Sie alle Ausschreibungen frei und nutzen Sie den KI-Assistenten.'
              : 'Unlock all calls and use the AI assistant.'}
          </DialogDescription>
        </DialogHeader>

        {/* Login hint for non-authenticated users */}
        {!user && (
          <div className="bg-muted/50 rounded-lg p-4 mb-2 flex items-start gap-3">
            <LogIn className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {language === 'de' ? 'Konto erforderlich' : 'Account required'}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'de' 
                  ? 'Nach Auswahl werden Sie zur Anmeldung weitergeleitet.'
                  : 'After selecting, you will be redirected to sign in.'}
              </p>
            </div>
          </div>
        )}

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
                    {language === 'de' ? 'Beliebteste Wahl' : 'Most Popular'}
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
                    <span>{language === 'de' ? 'Alle Ausschreibungen' : 'All calls'}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    <span>{language === 'de' ? 'KI-Bewerbungsassistent' : 'AI Application Assistant'}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    <span>{language === 'de' ? 'Archiv-Zugang' : 'Archive access'}</span>
                  </li>
                </ul>
              </div>

              <Button 
                className={`w-full mt-4 ${plan.popular ? 'gradient-gold text-primary font-semibold border-0' : ''}`}
                variant={plan.popular ? 'default' : 'outline'}
              >
                {language === 'de' ? 'Auswählen' : 'Select'}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {language === 'de' 
            ? 'Jederzeit kündbar. Sichere Zahlung über Stripe.'
            : 'Cancel anytime. Secure payment via Stripe.'}
        </p>
      </DialogContent>
    </Dialog>
  );
}