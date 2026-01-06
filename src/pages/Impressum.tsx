import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';

export default function Impressum() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      const { data } = await supabase
        .from('site_content' as any)
        .select('content')
        .eq('key', 'impressum')
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
        <title>{t('footer.imprint')} | Kunstpreiskalender</title>
        <meta name="description" content="Impressum und rechtliche Informationen" />
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
              {t('footer.imprint')}
            </h1>

            <div className="prose prose-lg dark:prose-invert">
              {content ? (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.replace(/\n/g, '<br />')) }} />
              ) : (
                <>
                  <section className="mb-8">
                    <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                      Angaben gemäß § 5 TMG
                    </h2>
                    <p className="text-muted-foreground">
                      [Ihr Name oder Firmenname]<br />
                      [Straße und Hausnummer]<br />
                      [PLZ und Ort]<br />
                      Deutschland
                    </p>
                  </section>

                  <section className="mb-8">
                    <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                      Kontakt
                    </h2>
                    <p className="text-muted-foreground">
                      Telefon: [Ihre Telefonnummer]<br />
                      E-Mail: [Ihre E-Mail-Adresse]
                    </p>
                  </section>

                  <section className="mb-8">
                    <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                      Umsatzsteuer-ID
                    </h2>
                    <p className="text-muted-foreground">
                      Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
                      [Ihre USt-IdNr.]
                    </p>
                  </section>

                  <section className="mb-8">
                    <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                      Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
                    </h2>
                    <p className="text-muted-foreground">
                      [Name des Verantwortlichen]<br />
                      [Adresse]
                    </p>
                  </section>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
