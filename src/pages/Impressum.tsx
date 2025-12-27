import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Impressum() {
  const { t } = useLanguage();

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
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
              {t('footer.imprint')}
            </h1>

            <div className="prose prose-lg dark:prose-invert">
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
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
