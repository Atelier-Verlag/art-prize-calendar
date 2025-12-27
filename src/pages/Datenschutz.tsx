import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Datenschutz() {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('footer.privacy')} | Kunstpreiskalender</title>
        <meta name="description" content="Datenschutzerklärung" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container py-16 md:py-24">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
              {t('footer.privacy')}
            </h1>

            <div className="prose prose-lg dark:prose-invert">
              <section className="mb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  1. Datenschutz auf einen Blick
                </h2>
                <h3 className="font-semibold text-foreground mt-4 mb-2">Allgemeine Hinweise</h3>
                <p className="text-muted-foreground">
                  Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  2. Datenerfassung auf dieser Website
                </h2>
                <h3 className="font-semibold text-foreground mt-4 mb-2">Wer ist verantwortlich?</h3>
                <p className="text-muted-foreground">
                  Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. 
                  Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  3. Ihre Rechte
                </h2>
                <p className="text-muted-foreground">
                  Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  4. Analyse-Tools und Tools von Drittanbietern
                </h2>
                <p className="text-muted-foreground">
                  [Hier können Sie Details zu verwendeten Analyse-Tools einfügen]
                </p>
              </section>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
