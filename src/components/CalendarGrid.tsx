import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockArtPrizes, Category } from '@/data/mockArtPrizes';
import { CalendarCard } from './CalendarCard';
import { PrizeDetailModal } from './PrizeDetailModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import type { ArtPrize } from '@/data/mockArtPrizes';

const categories: (Category | 'all')[] = [
  'all',
  'painting',
  'sculpture',
  'media',
  'photography',
  'performance',
  'mixed',
  'residency',
  'grant',
];

export function CalendarGrid() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedPrize, setSelectedPrize] = useState<ArtPrize | null>(null);
  const [isProUser] = useState(false); // This would come from auth context

  const filteredPrizes = mockArtPrizes.filter((prize) => {
    if (selectedCategory === 'all') return true;
    return prize.category === selectedCategory;
  });

  // Sort by deadline (soonest first)
  const sortedPrizes = [...filteredPrizes].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  return (
    <section id="calendar" className="py-16 md:py-24">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('nav.calendar')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>

        {/* Filter bar */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {t('calendar.filter')}:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? 'gradient-gold text-primary border-0'
                    : ''
                }
              >
                {category === 'all' ? t('calendar.all') : t(`category.${category}`)}
              </Button>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedPrizes.map((prize, index) => (
            <div
              key={prize.id}
              className="animate-fade-in-up opacity-0"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CalendarCard
                prize={prize}
                isLocked={!isProUser && !prize.isShortTerm}
                onClick={() => {
                  if (isProUser || prize.isShortTerm) {
                    setSelectedPrize(prize);
                  }
                }}
              />
            </div>
          ))}
        </div>

        {/* Empty state */}
        {sortedPrizes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              Keine Ausschreibungen in dieser Kategorie gefunden.
            </p>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <PrizeDetailModal
        prize={selectedPrize}
        isOpen={!!selectedPrize}
        onClose={() => setSelectedPrize(null)}
      />
    </section>
  );
}
