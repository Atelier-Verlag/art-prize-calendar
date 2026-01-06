import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';

export default function Nutzungsbedingungen() {
  const navigate = useNavigate();
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      const { data } = await supabase
        .from('site_content' as any)
        .select('content')
        .eq('key', 'terms')
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
        <title>Nutzungsbedingungen | Kunstpreiskalender</title>
        <meta name="description" content="Allgemeine Geschäftsbedingungen und Nutzungsbedingungen" />
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
              Nutzungsbedingungen
            </h1>

            <div className="prose prose-lg dark:prose-invert">
              {content ? (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.replace(/\n/g, '<br />')) }} />
              ) : (
                <section className="space-y-6">
                  <p className="text-muted-foreground leading-relaxed">
                    Mit der Nutzung dieser Website erklären Sie sich mit den folgenden Bedingungen einverstanden.
                  </p>
                  <h2 className="text-xl font-semibold text-foreground">§ 1 Geltungsbereich</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Diese Nutzungsbedingungen gelten für die Nutzung des Kunstpreiskalenders und aller damit verbundenen Dienste.
                  </p>
                  <h2 className="text-xl font-semibold text-foreground">§ 2 Leistungen</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Der Kunstpreiskalender bietet eine Übersicht über Kunstausschreibungen und -preise. Die Inhalte werden nach bestem Wissen und Gewissen erstellt, jedoch ohne Gewähr auf Vollständigkeit oder Aktualität.
                  </p>
                  <h2 className="text-xl font-semibold text-foreground">§ 3 Nutzungsrechte</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Die Inhalte dieser Website sind urheberrechtlich geschützt. Eine Vervielfältigung oder Verwendung ohne ausdrückliche Genehmigung ist nicht gestattet.
                  </p>
                </section>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}