import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Send, FileText, Route, Lock, Crown } from 'lucide-react';
import { PricingModal } from '@/components/PricingModal';
import { ComingSoonModal } from '@/components/ComingSoonModal';
import { ApplicationLetterDialog } from '@/components/ApplicationLetterDialog';

export function AIConsultant() {
  const { t } = useLanguage();
  const { user, isProUser, isAdmin } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showApplicationLetterDialog, setShowApplicationLetterDialog] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState('');

  // Check if user has access: must be logged in AND (Pro OR Admin)
  const hasAccess = user && (isProUser || isAdmin);

  const features = [
    {
      icon: FileText,
      titleKey: 'ai.feature1.title',
      descKey: 'ai.feature1.desc',
      isActive: true, // Bewerbungsschreiben is now active!
    },
    {
      icon: Route,
      titleKey: 'ai.feature2.title',
      descKey: 'ai.feature2.desc',
      isActive: false, // Bewerbungsfahrplan still under development
    },
  ];

  const handleUpgrade = () => {
    setShowPricingModal(true);
  };

  const handleFeatureClick = (featureTitle: string, isActive: boolean) => {
    if (!hasAccess) {
      setShowPricingModal(true);
      return;
    }
    
    if (isActive && featureTitle === t('ai.feature1.title')) {
      // Open the actual Application Letter Dialog
      setShowApplicationLetterDialog(true);
    } else {
      // Show "Coming Soon" for inactive features
      setSelectedFeature(featureTitle);
      setShowComingSoonModal(true);
    }
  };

  return (
    <section id="ai" className="py-16 md:py-24">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">{t('ai.badge')}</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('nav.ai')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('ai.description')}
            </p>
          </div>

          {/* Feature cards - clickable */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {features.map((feature) => (
              <Card 
                key={feature.titleKey} 
                className={`hover:shadow-card-hover transition-all duration-300 cursor-pointer ${
                  feature.isActive ? 'ring-2 ring-accent/20' : ''
                }`}
                onClick={() => handleFeatureClick(t(feature.titleKey), feature.isActive)}
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    {t(feature.titleKey)}
                    {!feature.isActive && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-normal">
                        Coming Soon
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{t(feature.descKey)}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* AI Input area */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="font-display">{t('ai.startTitle')}</CardTitle>
              <CardDescription>
                {t('ai.startDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder={t('ai.placeholder')}
                  className="min-h-[120px] resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={!hasAccess}
                />
                <div className="flex justify-end">
                  <Button
                    className="gradient-gold text-primary font-semibold border-0"
                    disabled={!hasAccess || !prompt.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {t('ai.generate')}
                  </Button>
                </div>
              </div>
            </CardContent>

            {/* Pro overlay - shown for non-logged-in users OR logged-in non-Pro users */}
            {!hasAccess && (
              <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center">
                <div className="text-center p-6 max-w-md">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-accent" />
                  <h3 className="font-display text-xl font-semibold mb-3 text-foreground">
                    Exklusiv für Pro-Mitglieder
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Dieses Feature ist exklusiv für Pro-Mitglieder. Erstellen Sie jetzt professionelle Bewerbungen mit unserem KI-Tool.
                  </p>
                  <Button 
                    className="gradient-gold text-primary font-semibold border-0"
                    onClick={handleUpgrade}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    {t('premium.upgrade')}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modals */}
      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
      />
      <ComingSoonModal 
        isOpen={showComingSoonModal} 
        onClose={() => setShowComingSoonModal(false)}
        featureName={selectedFeature}
      />
      <ApplicationLetterDialog
        isOpen={showApplicationLetterDialog}
        onClose={() => setShowApplicationLetterDialog(false)}
      />
    </section>
  );
}
