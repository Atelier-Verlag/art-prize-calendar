import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function Disclaimer() {
  const navigate = useNavigate();
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      const { data } = await supabase
        .from('site_content' as any)
        .select('content')
        .eq('key', 'disclaimer')
        .maybeSingle();
      
      if (data && (data as any).content) {
        setContent((data as any).content);
      }
    };
    loadContent();
  }, []);

  return (
    <>
      <Helmet>
        <title>Disclaimer | Kunstpreiskalender</title>
        <meta name="description" content="Haftungsausschluss" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container py-16 md:py-24">
          <div className="max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={() => navigate('/#calendar')}
              className="mb-8"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zum Kalender
            </Button>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
              Disclaimer
            </h1>

            <div className="prose prose-lg dark:prose-invert">
              {content ? (
                <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
              ) : (
                <section className="mb-8">
                  <p className="text-muted-foreground leading-relaxed">
                    Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte (insbesondere Fristen und Preisgelder) können wir jedoch keine Gewähr übernehmen. Maßgeblich und rechtlich bindend sind ausschließlich die Angaben auf den Original-Webseiten der jeweiligen Ausschreiber. Wir übernehmen keine Haftung für Schäden, die durch die Nutzung der hier bereitgestellten Informationen entstehen.
                  </p>
                </section>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}