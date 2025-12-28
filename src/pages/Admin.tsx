import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Save, Shield, ArrowLeft } from 'lucide-react';

type ContentKey = 'impressum' | 'datenschutz' | 'disclaimer';

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contents, setContents] = useState<Record<ContentKey, string>>({
    impressum: '',
    datenschutz: '',
    disclaimer: '',
  });
  const [saving, setSaving] = useState(false);
  const [loadingContent, setLoadingContent] = useState(true);

  // Redirect non-admins
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  // Load existing content
  useEffect(() => {
    const loadContent = async () => {
      const { data, error } = await supabase
        .from('site_content' as any)
        .select('key, content');
      
      if (error) {
        console.error('Error loading content:', error);
        return;
      }
      
      if (data) {
        const contentMap: Record<ContentKey, string> = {
          impressum: '',
          datenschutz: '',
          disclaimer: '',
        };
        (data as any[]).forEach((item: { key: string; content: string }) => {
          if (item.key in contentMap) {
            contentMap[item.key as ContentKey] = item.content || '';
          }
        });
        setContents(contentMap);
      }
      setLoadingContent(false);
    };
    
    if (user && isAdmin) {
      loadContent();
    }
  }, [user, isAdmin]);

  const handleSave = async (key: ContentKey) => {
    setSaving(true);
    
    const { error } = await supabase
      .from('site_content' as any)
      .update({ content: contents[key] })
      .eq('key', key);
    
    if (error) {
      console.error('Error saving content:', error);
      toast({
        title: 'Fehler',
        description: 'Inhalt konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Gespeichert',
        description: `${key.charAt(0).toUpperCase() + key.slice(1)} wurde aktualisiert.`,
      });
    }
    
    setSaving(false);
  };

  if (loading || loadingContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const contentSections: { key: ContentKey; title: string; description: string }[] = [
    { key: 'impressum', title: 'Impressum', description: 'Rechtliche Angaben gemäß § 5 TMG' },
    { key: 'datenschutz', title: 'Datenschutz', description: 'Datenschutzerklärung nach DSGVO' },
    { key: 'disclaimer', title: 'Disclaimer', description: 'Haftungsausschluss' },
  ];

  return (
    <>
      <Helmet>
        <title>Admin | Kunstpreiskalender</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="mb-8"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Startseite
            </Button>

            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">
                  Admin-Bereich
                </h1>
                <p className="text-muted-foreground">
                  Verwalten Sie die Inhalte Ihrer Website
                </p>
              </div>
            </div>

            <Tabs defaultValue="impressum" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                {contentSections.map((section) => (
                  <TabsTrigger key={section.key} value={section.key}>
                    {section.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {contentSections.map((section) => (
                <TabsContent key={section.key} value={section.key}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{section.title} bearbeiten</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={contents[section.key]}
                        onChange={(e) => setContents(prev => ({ 
                          ...prev, 
                          [section.key]: e.target.value 
                        }))}
                        placeholder={`Geben Sie hier den Inhalt für ${section.title} ein...`}
                        className="min-h-[400px] font-mono text-sm"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleSave(section.key)}
                          disabled={saving}
                          className="gradient-gold text-primary font-semibold border-0"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Speichern...' : 'Speichern'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}