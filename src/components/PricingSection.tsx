import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles } from 'lucide-react';

// Stripe Price IDs
const PRICE_IDS = {
  monthly: 'price_1RgtdgBthqKdl9mFCbDqMc7v',
  yearly: 'price_1RgtdgBthqKdl9mFCbDqMc7v', // Use the same for now, update when yearly price is created
};

export function PricingSection() {
  const { t } = useLanguage();
  const { user, isProUser, startCheckout } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (priceId: string | null) => {
    if (!priceId) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    await startCheckout(priceId);
  };

  const plans = [
    {
      name: t('pricing.free'),
      price: '0',
      period: '',
      description: t('pricing.free.desc'),
      features: [
        t('pricing.free.desc'),
      ],
      cta: t('hero.cta'),
      variant: 'outline' as const,
      popular: false,
      priceId: null,
    },
    {
      name: t('pricing.monthly'),
      price: '4',
      period: t('pricing.perMonth'),
      description: t('pricing.feature.all'),
      features: [
        t('pricing.feature.all'),
        t('pricing.feature.ai'),
        t('pricing.feature.archive'),
      ],
      cta: isProUser ? 'Aktiv' : t('pricing.subscribe'),
      variant: 'default' as const,
      popular: false,
      priceId: PRICE_IDS.monthly,
    },
    {
      name: t('pricing.yearly'),
      price: '39',
      period: t('pricing.perYear'),
      description: t('pricing.feature.all'),
      features: [
        t('pricing.feature.all'),
        t('pricing.feature.ai'),
        t('pricing.feature.archive'),
        t('pricing.yearly.save'),
      ],
      cta: isProUser ? 'Aktiv' : t('pricing.subscribe'),
      variant: 'default' as const,
      popular: true,
      priceId: PRICE_IDS.yearly,
    },
  ];

  return (
    <section id="pricing" className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('pricing.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`
                relative overflow-hidden transition-all duration-300
                ${plan.popular
                  ? 'border-accent shadow-elegant scale-105 z-10'
                  : 'hover:shadow-card-hover hover:-translate-y-1'
                }
              `}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 gradient-gold py-1.5 text-center">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Beliebteste Wahl
                  </span>
                </div>
              )}

              <CardHeader className={plan.popular ? 'pt-10' : ''}>
                <CardTitle className="font-display text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-6">
                  <span className="font-display text-5xl font-bold text-foreground">
                    €{plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-accent shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`
                    w-full
                    ${plan.popular
                      ? 'gradient-gold text-primary font-semibold border-0'
                      : ''
                    }
                  `}
                  variant={plan.popular ? 'default' : plan.variant}
                  onClick={() => handleSubscribe(plan.priceId)}
                  disabled={isProUser && plan.priceId !== null}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
