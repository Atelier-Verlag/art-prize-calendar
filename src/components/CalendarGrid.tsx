import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useArtPrizes, type ArtPrize } from '@/hooks/useArtPrizes';
import { CalendarCard } from './CalendarCard';
import { PrizeDetailModal } from './PrizeDetailModal';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import type { Category } from '@/data/mockArtPrizes';

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
  'exhibition',
  'public_art',
];

export function CalendarGrid() {
  const { t } = useLanguage();
  const { isProUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedPrize, setSelectedPrize] = useState<ArtPrize | null>(null);

  const { data: prizes, isLoading } = useArtPrizes(false);

  const filteredPrizes = (prizes || []).filter((prize) => {
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

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        )}

        {/* Cards grid */}
        {!isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedPrizes.map((prize, index) => (
              <div
                key={prize.id}
                className="animate-fade-in-up opacity-0"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CalendarCard
                  prize={prize}
                  isProUser={isProUser}
                  onClick={() => setSelectedPrize(prize)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && sortedPrizes.length === 0 && (
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
        isProUser={isProUser}
      />
    </section>
  );
}
