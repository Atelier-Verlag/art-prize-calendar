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
import { Save, Shield, ArrowLeft, RefreshCw, Bot, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type ContentKey = 'impressum' | 'datenschutz' | 'disclaimer';

interface ScraperLog {
  id: string;
  created_at: string;
  status: 'success' | 'error' | 'running';
  message: string;
  items_found: number;
}

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
  const [scraperRunning, setScraperRunning] = useState(false);
  const [scraperLogs, setScraperLogs] = useState<ScraperLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

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

  // Load scraper logs
  const loadScraperLogs = async () => {
    setLoadingLogs(true);
    const { data, error } = await supabase
      .from('scraper_logs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error loading scraper logs:', error);
    } else if (data) {
      setScraperLogs(data as unknown as ScraperLog[]);
    }
    setLoadingLogs(false);
  };

  useEffect(() => {
    if (user && isAdmin) {
      loadScraperLogs();
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

  const handleStartScraper = async () => {
    setScraperRunning(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-prizes');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Roboter gestartet',
        description: data?.message || 'Der Kunstpreis-Roboter wurde erfolgreich gestartet.',
      });
      
      // Logs neu laden
      await loadScraperLogs();
    } catch (error) {
      console.error('Error starting scraper:', error);
      toast({
        title: 'Fehler',
        description: 'Der Roboter konnte nicht gestartet werden.',
        variant: 'destructive',
      });
    } finally {
      setScraperRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'running':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
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

            {/* Scraper Section */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Kunstpreis-Roboter</CardTitle>
                      <CardDescription>Automatische Aktualisierung der Kunstpreise</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadScraperLogs}
                      disabled={loadingLogs}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingLogs ? 'animate-spin' : ''}`} />
                      Aktualisieren
                    </Button>
                    <Button
                      onClick={handleStartScraper}
                      disabled={scraperRunning}
                      className="gradient-gold text-primary font-semibold border-0"
                    >
                      {scraperRunning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Läuft...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          🔄 Kunstpreis-Roboter starten
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Letzte Aktivitäten</h4>
                  {loadingLogs ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : scraperLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Noch keine Aktivitäten. Starten Sie den Roboter, um zu beginnen.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {scraperLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                        >
                          {getStatusIcon(log.status)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBadgeClass(log.status)}`}>
                                {log.status === 'success' ? 'Erfolgreich' : log.status === 'error' ? 'Fehler' : 'Läuft'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                              </span>
                              {log.items_found > 0 && (
                                <span className="text-xs text-primary font-medium">
                                  {log.items_found} gefunden
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-foreground mt-1 break-words">
                              {log.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
