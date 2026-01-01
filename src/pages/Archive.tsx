import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useArtPrizes } from '@/hooks/useArtPrizes';
import { CalendarCard } from '@/components/CalendarCard';
import { PrizeDetailModal } from '@/components/PrizeDetailModal';
import { useState } from 'react';
import type { ArtPrize } from '@/hooks/useArtPrizes';
import { Archive as ArchiveIcon } from 'lucide-react';

export default function Archive() {
  const { t } = useLanguage();
  const { isProUser } = useAuth();
  const { data: prizes, isLoading } = useArtPrizes(true);
  const [selectedPrize, setSelectedPrize] = useState<ArtPrize | null>(null);

  return (
    <>
      <Helmet>
        <title>{t('nav.archive')} | Kunstpreiskalender</title>
        <meta name="description" content="Archiv vergangener Kunstpreise und Ausschreibungen" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container py-16 md:py-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <ArchiveIcon className="h-8 w-8 text-accent" />
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                {t('nav.archive')}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Vergangene Ausschreibungen und abgelaufene Kunstpreise.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : prizes && prizes.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {prizes.map((prize, index) => (
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
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                Noch keine archivierten Ausschreibungen vorhanden.
              </p>
            </div>
          )}
        </main>

        <Footer />
      </div>

      <PrizeDetailModal
        prize={selectedPrize}
        isOpen={!!selectedPrize}
        onClose={() => setSelectedPrize(null)}
        isProUser={isProUser}
      />
    </>
  );
}