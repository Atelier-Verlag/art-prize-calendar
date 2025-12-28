import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Send, FileText, Route, Lock } from 'lucide-react';

export function AIConsultant() {
  const { t } = useLanguage();
  const { isProUser } = useAuth();
  const [prompt, setPrompt] = useState('');

  const features = [
    {
      icon: FileText,
      title: 'Bewerbungsschreiben',
      description: 'Lassen Sie sich ein professionelles Anschreiben für Ihre Kunstbewerbung erstellen.',
    },
    {
      icon: Route,
      title: 'Bewerbungsfahrplan',
      description: 'Erhalten Sie einen detaillierten Zeitplan für Ihre Bewerbungsstrategie.',
    },
  ];

  return (
    <section id="ai" className="py-16 md:py-24">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">KI-gestützt</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('nav.ai')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Nutzen Sie unsere KI, um überzeugende Bewerbungsschreiben zu erstellen und Ihren Bewerbungsprozess zu optimieren.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-card-hover transition-all duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="font-display text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* AI Input area */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="font-display">Starten Sie Ihre Anfrage</CardTitle>
              <CardDescription>
                Beschreiben Sie die Ausschreibung und was Sie benötigen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="z.B. Ich möchte mich für den Kunstpreis der Stadt München bewerben. Ich arbeite hauptsächlich mit Ölmalerei und mein Werk beschäftigt sich mit urbanen Landschaften..."
                  className="min-h-[120px] resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={!isProUser}
                />
                <div className="flex justify-end">
                  <Button
                    className="gradient-gold text-primary font-semibold border-0"
                    disabled={!isProUser || !prompt.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Generieren
                  </Button>
                </div>
              </div>
            </CardContent>

            {/* Pro overlay */}
            {!isProUser && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center p-6">
                  <Lock className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="font-display text-xl font-semibold mb-2">Pro-Feature</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    Upgraden Sie auf Pro, um den KI-Berater zu nutzen.
                  </p>
                  <Button className="gradient-gold text-primary font-semibold border-0">
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
