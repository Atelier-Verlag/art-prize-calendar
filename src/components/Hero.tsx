import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles } from 'lucide-react';

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--accent)/0.15),transparent)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Banner */}
      <div className="gradient-gold py-3 text-center">
        <p className="text-base font-bold text-primary flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5" />
          {t('hero.banner')}
          <Sparkles className="h-5 w-5" />
        </p>
      </div>

      {/* Hero content - 3 line title design */}
      <div className="container py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Title - 3 Lines */}
          <div className="animate-fade-in-up">
            {/* Line 1 - Larger */}
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground font-medium mb-2">
              {t('hero.title.part1')}
            </p>
            
            {/* Line 2 - Main/Large with Dark Blue and straight underline */}
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-3">
              <span className="relative inline-block">
                <span className="relative z-10 text-[hsl(220,60%,35%)]">
                  {t('hero.title.highlight')}
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-[hsl(220,60%,35%,0.2)] rounded" />
              </span>
            </h1>
            
            {/* Line 3 - Larger */}
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground font-medium">
              {t('hero.title.part2')}
            </p>
          </div>

          {/* Subtitle */}
          <p className="mt-8 text-base text-muted-foreground md:text-lg max-w-2xl mx-auto animate-fade-in-up delay-100 opacity-0">
            {t('hero.subtitle')} — {t('hero.subtitleSuffix')}
          </p>
        </div>
      </div>
    </section>
  );
}
