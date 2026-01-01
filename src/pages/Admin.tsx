import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Save, Shield, ArrowLeft, RefreshCw, Bot, CheckCircle, XCircle, Loader2, Plus, Trash2, Link, Globe, LogOut } from 'lucide-react';
import { ArtPrizesManager } from '@/components/admin/ArtPrizesManager';
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

interface ScraperSource {
  id: string;
  created_at: string;
  url: string;
  name: string;
  active: boolean;
}

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    navigate('/');
  };
  
  const [contents, setContents] = useState<Record<ContentKey, string>>({
    impressum: '',
    datenschutz: '',
    disclaimer: '',
  });
  const [activeContentKey, setActiveContentKey] = useState<ContentKey>('impressum');
  const [saving, setSaving] = useState(false);
  const [loadingContent, setLoadingContent] = useState(true);
  const [scraperRunning, setScraperRunning] = useState(false);
  const [scraperLogs, setScraperLogs] = useState<ScraperLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  
  // Scraper Sources
  const [scraperSources, setScraperSources] = useState<ScraperSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [addingSource, setAddingSource] = useState(false);

  const canUseBackend = !!user && isAdmin;

  // NOTE: We intentionally do NOT redirect here so the UI stays accessible for debugging.


  // Load existing content - always load for viewing, saving requires admin
  useEffect(() => {
    const loadContent = async () => {
      try {
        const contentMap: Record<ContentKey, string> = {
          impressum: '',
          datenschutz: '',
          disclaimer: '',
        };

        // Fetch each content key separately to ensure correct mapping
        for (const key of ['impressum', 'datenschutz', 'disclaimer'] as ContentKey[]) {
          const { data, error } = await supabase
            .from('site_content' as any)
            .select('content')
            .eq('key', key)
            .maybeSingle();

          if (error) {
            console.error(`Error loading ${key}:`, error);
            continue;
          }

          if (data && (data as any).content) {
            contentMap[key] = (data as any).content;
            console.log(`Loaded ${key}:`, contentMap[key].substring(0, 50) + '...');
          }
        }

        setContents(contentMap);
        console.log('All content loaded:', Object.keys(contentMap).map(k => `${k}: ${contentMap[k as ContentKey].substring(0, 30)}...`));
      } catch (err) {
        console.error('Error loading content:', err);
      } finally {
        setLoadingContent(false);
      }
    };

    loadContent();
  }, []);

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

  // Load scraper sources
  const loadScraperSources = async () => {
    setLoadingSources(true);
    const { data, error } = await supabase
      .from('scraper_sources' as any)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading scraper sources:', error);
    } else if (data) {
      setScraperSources(data as unknown as ScraperSource[]);
    }
    setLoadingSources(false);
  };

  useEffect(() => {
    if (!canUseBackend) {
      setLoadingLogs(false);
      setLoadingSources(false);
      return;
    }

    loadScraperLogs();
    loadScraperSources();
  }, [canUseBackend]);

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
        description: 'Inhalt konnte nicht gespeichert werden: ' + error.message,
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

  const handleAddSource = async () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte Name und URL eingeben.',
        variant: 'destructive',
      });
      return;
    }

    // If backend access is blocked (not logged in / not admin), still allow UI testing locally.
    if (!canUseBackend) {
      const id = crypto.randomUUID();
      setScraperSources((prev) => [
        {
          id,
          created_at: new Date().toISOString(),
          name: newSourceName.trim(),
          url: newSourceUrl.trim(),
          active: true,
        },
        ...prev,
      ]);
      setNewSourceName('');
      setNewSourceUrl('');
      setLoadingSources(false);
      toast({
        title: 'Nur lokal gespeichert',
        description: 'Du bist nicht eingeloggt – die Quelle wurde nur im UI hinzugefügt.',
      });
      return;
    }

    setAddingSource(true);

    const { error } = await supabase
      .from('scraper_sources' as any)
      .insert({
        name: newSourceName.trim(),
        url: newSourceUrl.trim(),
        active: true,
      });

    if (error) {
      console.error('Error adding source:', error);
      toast({
        title: 'Fehler',
        description: 'Quelle konnte nicht hinzugefügt werden.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Quelle hinzugefügt',
        description: `${newSourceName} wurde erfolgreich hinzugefügt.`,
      });
      setNewSourceName('');
      setNewSourceUrl('');
      await loadScraperSources();
    }

    setAddingSource(false);
  };

  const handleToggleSource = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from('scraper_sources' as any)
      .update({ active })
      .eq('id', id);

    if (error) {
      console.error('Error toggling source:', error);
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht geändert werden.',
        variant: 'destructive',
      });
    } else {
      setScraperSources(prev => 
        prev.map(s => s.id === id ? { ...s, active } : s)
      );
    }
  };

  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`Möchten Sie die Quelle "${name}" wirklich löschen?`)) {
      return;
    }

    const { error } = await supabase
      .from('scraper_sources' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting source:', error);
      toast({
        title: 'Fehler',
        description: 'Quelle konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Gelöscht',
        description: `${name} wurde entfernt.`,
      });
      setScraperSources(prev => prev.filter(s => s.id !== id));
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

  if (loadingContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
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
            {/* Top bar with back button and admin controls */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zur Startseite
              </Button>
              
              {/* Admin indicator and logout - ALWAYS VISIBLE */}
              <div className="flex items-center gap-3">
                <Badge className="bg-destructive/10 text-destructive border border-destructive/30 gap-1 font-semibold px-3 py-1.5">
                  <Shield className="h-4 w-4" />
                  ADMIN MODUS
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {loggingOut ? 'Abmelden...' : 'Abmelden'}
                </Button>
              </div>
            </div>

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
                 {!canUseBackend && (
                   <p className="text-sm text-destructive mt-1">
                     Debug-Ansicht: Nicht eingeloggt – Backend-Aktionen können fehlschlagen.
                   </p>
                 )}
              </div>
            </div>

            {/* Legal Forms Section - First */}
            <Tabs
              value={activeContentKey}
              onValueChange={(v) => setActiveContentKey(v as ContentKey)}
              className="space-y-6 mb-8"
            >
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
                        onChange={(e) =>
                          setContents((prev) => ({
                            ...prev,
                            [section.key]: e.target.value,
                          }))
                        }
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

            {/* Scraper Sources Section - Second */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Roboter-Quellen ({scraperSources.length})</CardTitle>
                    <CardDescription>Websites, die der Roboter durchsuchen soll</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new source */}
                <div className="flex gap-2 flex-wrap">
                  <Input
                    placeholder="Name (z.B. Kunstforum)"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    className="flex-1 min-w-[150px]"
                  />
                  <Input
                    placeholder="URL (z.B. https://kunstforum.de/wettbewerbe)"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    className="flex-[2] min-w-[250px]"
                  />
                  <Button
                    onClick={handleAddSource}
                    disabled={addingSource || !newSourceName.trim() || !newSourceUrl.trim()}
                    className="gradient-gold text-primary font-semibold border-0"
                  >
                    {addingSource ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Hinzufügen
                      </>
                    )}
                  </Button>
                </div>

                {/* Sources list */}
                {loadingSources ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : scraperSources.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                    Noch keine Quellen hinzugefügt. Fügen Sie oben eine URL hinzu.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scraperSources.map((source) => (
                      <div
                        key={source.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
                          source.active 
                            ? 'bg-muted/50 border-border/50' 
                            : 'bg-muted/20 border-border/30 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{source.name}</p>
                            <a 
                              href={source.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline truncate block"
                            >
                              {source.url}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {source.active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                            <Switch
                              checked={source.active}
                              onCheckedChange={(checked) => handleToggleSource(source.id, checked)}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSource(source.id, source.name)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scraper Robot Section - Third */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Kunst-Ausschreibungs-Roboter</CardTitle>
                      <CardDescription>Internationale Suche via Tavily & AI-Extraktion</CardDescription>
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
                          🔄 Roboter starten
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
                                  {log.items_found} archiviert
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

            {/* Art Prizes Manager Section - Fourth */}
            <ArtPrizesManager />
          </div>
        </main>
      </div>

    </>
  );
}
