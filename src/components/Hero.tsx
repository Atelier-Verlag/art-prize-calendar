import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

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

      {/* Hero content */}
      <div className="container py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Title */}
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in-up">
            {t('hero.title.part1')}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-accent to-[hsl(45,85%,65%)] bg-clip-text text-transparent">
                {t('hero.title.highlight')}
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-3 bg-accent/20 -rotate-1 rounded" />
            </span>
            {t('hero.title.part2')}
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg text-muted-foreground md:text-xl lg:text-2xl max-w-3xl mx-auto animate-fade-in-up delay-100 opacity-0">
            Der Kalender für Kunstausschreibungen für KünstlerInnen und Künstler – sorgfältig kuratiert, aktuell und laufend aktualisiert.
          </p>
        </div>
      </div>
    </section>
  );
}
