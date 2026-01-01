import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { CalendarGrid } from '@/components/CalendarGrid';
import { AIConsultant } from '@/components/AIConsultant';
import { PricingSection } from '@/components/PricingSection';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, isProUser } = useAuth();

  return (
    <>
      <Helmet>
        <title>Kunstpreiskalender – Der aktuelle Kunstpreiskalender für deutsche & internationale Ausschreibungen</title>
        <meta name="description" content="Der umfassende Ausschreibungskalender für Künstlerinnen und Künstler. Kunstpreise, Wettbewerbe, Kunstförderung, Residenzen, Ausstellungen und Stipendien — sorgfältig kuratiert." />
        <meta name="keywords" content="Kunstpreis, Kunstwettbewerb, Stipendium, Residenz, Künstler, Ausschreibung, Kunstförderung" />
        <link rel="canonical" href="https://kunstpreiskalender.de" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Hero />
          <CalendarGrid />
          <AIConsultant />
          {/* Hide pricing for logged-in Pro users */}
          {!(user && isProUser) && <PricingSection />}
        </main>
      </div>
    </>
  );
};

export default Index;
