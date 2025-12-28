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
                <>
                  <section className="mb-8">
                    <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                      Haftungsausschluss
                    </h2>
                    <p className="text-muted-foreground">
                      [Hier können Sie Ihren Haftungsausschluss einfügen]
                    </p>
                  </section>

                  <section className="mb-8">
                    <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                      Haftung für Inhalte
                    </h2>
                    <p className="text-muted-foreground">
                      Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. 
                      Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
                    </p>
                  </section>

                  <section className="mb-8">
                    <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                      Haftung für Links
                    </h2>
                    <p className="text-muted-foreground">
                      Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. 
                      Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
                    </p>
                  </section>
                </>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}