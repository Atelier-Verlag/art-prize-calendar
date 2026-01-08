import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTenders, type Tender } from '@/hooks/useTenders';
import { TenderCard } from './TenderCard';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { addMonths, isBefore } from 'date-fns';

// Static navigation filters in exact order
const awardTypeFilters: { value: string; labelKey: string }[] = [
  { value: 'all', labelKey: 'filter.all' },
  { value: 'Kunstpreis', labelKey: 'filter.Kunstpreis' },
  { value: 'Wettbewerb', labelKey: 'filter.Wettbewerb' },
  { value: 'Stipendium', labelKey: 'filter.Stipendium' },
  { value: 'Förderung', labelKey: 'filter.Förderung' },
  { value: 'Residenz', labelKey: 'filter.Residenz' },
  { value: 'Ausstellung', labelKey: 'filter.Ausstellung' },
  { value: 'Kunst am Bau', labelKey: 'filter.Kunst am Bau' },
];

// Filter button color helper
function getCategoryFilterColor(category: string, isActive: boolean): string {
  if (!isActive) return '';
  if (category === 'all') {
    return 'bg-foreground text-background hover:bg-foreground/90';
  }
  return 'bg-[hsl(220,60%,45%)] text-white hover:bg-[hsl(220,60%,40%)]';
}

export function CalendarGrid() {
  const { t } = useLanguage();
  const { isProUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);

  const { data: tenders, isLoading } = useTenders();

  // Filter: only show deadlines within next 6 months
  const sixMonthsFromNow = addMonths(new Date(), 6);
  
  const filteredTenders = (tenders || []).filter((tender) => {
    // Filter by deadline within 6 months
    if (!tender.deadline) return false;
    const deadlineDate = new Date(tender.deadline);
    if (!isBefore(deadlineDate, sixMonthsFromNow)) return false;
    
    // Filter by category
    if (selectedCategory === 'all') return true;
    return tender.category === selectedCategory;
  });

  // Sort by deadline (soonest first)
  const sortedTenders = [...filteredTenders].sort(
    (a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
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
            {awardTypeFilters.map((filter) => {
              const isActive = selectedCategory === filter.value;
              const activeColorClass = getCategoryFilterColor(filter.value, isActive);
              
              return (
                <Button
                  key={filter.value}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(filter.value)}
                  className={`${isActive ? activeColorClass : 'hover:bg-[hsl(220,60%,45%)] hover:text-white hover:border-[hsl(220,60%,45%)]'}`}
                >
                  {t(filter.labelKey)}
                </Button>
              );
            })}
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
            {sortedTenders.map((tender, index) => (
              <div
                key={tender.id}
                className="animate-fade-in-up opacity-0"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TenderCard
                  tender={tender}
                  isProUser={isProUser}
                  onClick={() => setSelectedTender(tender)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && sortedTenders.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              Keine Ausschreibungen in dieser Kategorie gefunden.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
