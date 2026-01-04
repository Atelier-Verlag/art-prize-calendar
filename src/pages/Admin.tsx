import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Save, Shield, ArrowLeft, RefreshCw, Bot, CheckCircle, XCircle, Loader2, Plus, Trash2, Link, Globe, LogOut, Calendar } from 'lucide-react';
import { ArtPrizesManager } from '@/components/admin/ArtPrizesManager';
import { SeminarWaitlistManager } from '@/components/admin/SeminarWaitlistManager';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type ContentKey = 'impressum' | 'datenschutz' | 'disclaimer' | 'terms';

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
  const { user, isAdmin, loading, signIn, signUp, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    navigate('/');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: language === 'de' ? 'Anmeldung fehlgeschlagen' : 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: language === 'de' ? 'Erfolgreich angemeldet!' : 'Successfully logged in!',
      });
    }

    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast({
        title: language === 'de' ? 'Passwort muss mindestens 8 Zeichen haben' : 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: language === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await signUp(email, password);

    if (error) {
      toast({
        title: language === 'de' ? 'Registrierung fehlgeschlagen' : 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: language === 'de' ? 'Erfolgreich registriert!' : 'Successfully registered!',
        description: language === 'de' ? 'Sie können sich jetzt anmelden.' : 'You can now log in.',
      });
    }

    setIsSubmitting(false);
  };
  
  const [contents, setContents] = useState<Record<ContentKey, string>>({
    impressum: '',
    datenschutz: '',
    disclaimer: '',
    terms: '',
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
  const [scanningSourceId, setScanningSourceId] = useState<string | null>(null);
  // Allow ANY logged-in user to save content (RLS now permits authenticated users)
  const canUseBackend = !!user;


  // Load existing content - always load for viewing, saving requires admin
  useEffect(() => {
    const loadContent = async () => {
      try {
        const contentMap: Record<ContentKey, string> = {
          impressum: '',
          datenschutz: '',
          disclaimer: '',
          terms: '',
        };

        // Fetch all content in one query
        const { data, error } = await supabase
          .from('site_content')
          .select('key, content');

        if (error) {
          console.error('Error loading site content:', error);
        } else if (data) {
          // Map each row to contentMap
          for (const row of data) {
            const key = row.key as ContentKey;
            if (key in contentMap) {
              contentMap[key] = row.content || '';
              console.log(`[Admin] Loaded ${key}: ${contentMap[key].substring(0, 50)}...`);
            }
          }
        }

        setContents(contentMap);
        console.log('[Admin] All content loaded');
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
    if (!canUseBackend) {
      toast({
        title: 'Nicht berechtigt',
        description: 'Bitte als Admin einloggen, um Inhalte zu speichern.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    console.log(`[Admin] Saving ${key} with content length: ${contents[key].length}`);

    try {
      // Use upsert with explicit onConflict for the key column
      const { data, error } = await supabase
        .from('site_content')
        .upsert(
          { key, content: contents[key], updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
        .select();

      if (error) {
        console.error('Error saving content:', error);
        toast({
          title: 'Fehler beim Speichern',
          description: `${key} konnte nicht gespeichert werden: ${error.message}`,
          variant: 'destructive',
        });
      } else {
        console.log(`[Admin] Successfully saved ${key}:`, data);
        toast({
          title: '✓ Gespeichert',
          description: `${key.charAt(0).toUpperCase() + key.slice(1)} wurde erfolgreich aktualisiert.`,
        });
      }
    } catch (err) {
      console.error('Unexpected error saving content:', err);
      toast({
        title: 'Unerwarteter Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
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

  const handleScanSource = async (source: ScraperSource) => {
    setScanningSourceId(source.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-prizes', {
        body: { singleUrl: source.url, sourceName: source.name }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Scan abgeschlossen',
        description: `"${source.name}" wurde gescannt. ${data?.newPrizesCount || 0} neue Einträge gefunden.`,
      });
      
      // Logs neu laden
      await loadScraperLogs();
    } catch (error) {
      console.error('Error scanning source:', error);
      toast({
        title: 'Fehler',
        description: `"${source.name}" konnte nicht gescannt werden.`,
        variant: 'destructive',
      });
    } finally {
      setScanningSourceId(null);
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

  // Show loading spinner while checking auth
  if (loading || loadingContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // AUTH GATE: If not logged in, show login form
  if (!user) {
    return (
      <>
        <Helmet>
          <title>Admin Login | Kunstpreiskalender</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
          <div className="w-full max-w-md mb-4">
            <button 
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>{language === 'de' ? 'Zurück zum Kalender' : 'Back to Calendar'}</span>
            </button>
          </div>
          
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                  <Shield className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <CardTitle className="font-display text-2xl">
                {language === 'de' ? 'Admin-Bereich' : 'Admin Area'}
              </CardTitle>
              <CardDescription>
                {language === 'de' ? 'Bitte melden Sie sich an, um fortzufahren' : 'Please log in to continue'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">{language === 'de' ? 'Anmelden' : 'Login'}</TabsTrigger>
                  <TabsTrigger value="signup">{language === 'de' ? 'Registrieren' : 'Sign Up'}</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-login-email">{language === 'de' ? 'E-Mail' : 'Email'}</Label>
                      <Input
                        id="admin-login-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-login-password">{language === 'de' ? 'Passwort' : 'Password'}</Label>
                      <Input
                        id="admin-login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {language === 'de' ? 'Anmelden' : 'Login'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-signup-email">{language === 'de' ? 'E-Mail' : 'Email'}</Label>
                      <Input
                        id="admin-signup-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-signup-password">{language === 'de' ? 'Passwort' : 'Password'}</Label>
                      <Input
                        id="admin-signup-password"
                        type="password"
                        placeholder={language === 'de' ? 'min. 8 Zeichen' : 'min. 8 characters'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-signup-confirm">
                        {language === 'de' ? 'Passwort wiederholen' : 'Confirm Password'}
                      </Label>
                      <Input
                        id="admin-signup-confirm"
                        type="password"
                        placeholder={language === 'de' ? 'Passwort bestätigen' : 'Confirm password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {language === 'de' ? 'Registrieren' : 'Sign Up'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // SECURITY GATE: If logged in but NOT admin, show access denied
  if (!isAdmin) {
    return (
      <>
        <Helmet>
          <title>Access Denied | Kunstpreiskalender</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
          <div className="w-full max-w-md mb-4">
            <button 
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>{language === 'de' ? 'Zurück zum Kalender' : 'Back to Calendar'}</span>
            </button>
          </div>
          
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                  <Shield className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <CardTitle className="font-display text-2xl">
                {language === 'de' ? 'Zugriff verweigert' : 'Access Denied'}
              </CardTitle>
              <CardDescription>
                {language === 'de' 
                  ? 'Sie haben keine Berechtigung, auf den Admin-Bereich zuzugreifen.' 
                  : 'You do not have permission to access the admin area.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {language === 'de' 
                  ? 'Nur Administratoren können diesen Bereich nutzen. Wenn Sie denken, dass dies ein Fehler ist, kontaktieren Sie bitte den Support.'
                  : 'Only administrators can access this area. If you believe this is an error, please contact support.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  {language === 'de' ? 'Zurück zur Startseite' : 'Back to Home'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full"
                >
                  {loggingOut ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
                  {language === 'de' ? 'Abmelden' : 'Sign Out'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const contentSections: { key: ContentKey; title: string; description: string }[] = [
    { key: 'impressum', title: 'Impressum', description: 'Rechtliche Angaben gemäß § 5 TMG' },
    { key: 'datenschutz', title: 'Datenschutz', description: 'Datenschutzerklärung nach DSGVO' },
    { key: 'disclaimer', title: 'Disclaimer', description: 'Haftungsausschluss' },
    { key: 'terms', title: 'Nutzungsbedingungen', description: 'AGB und Nutzungsbedingungen' },
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
            {/* Admin Mode Banner - Prominent */}
            <div className="bg-destructive/10 border-2 border-destructive/30 rounded-xl p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-destructive">ADMIN MODUS</p>
                    <p className="text-sm text-muted-foreground">
                      Sie bearbeiten die Website-Inhalte
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => window.open('/', '_blank', 'noopener,noreferrer')}
                    className="flex-1 sm:flex-none"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Öffentliche Seite ansehen
                  </Button>
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
            </div>

            {/* Back button */}
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-6"
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
              <TabsList className="grid w-full grid-cols-4">
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

            {/* Scraper Robot Section */}
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
                            <p className="text-sm text-foreground mt-1 break-words">{log.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Seminar Waitlist Manager Section */}
            <SeminarWaitlistManager />

            {/* Art Prizes Manager Section */}
            <ArtPrizesManager />

            {/* Scraper Sources Section (bottom) */}
            <Card className="mt-8">
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
                        <div className="flex items-center gap-2 flex-shrink-0">
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
                            variant="outline"
                            size="sm"
                            onClick={() => handleScanSource(source)}
                            disabled={scanningSourceId === source.id || !source.active}
                            className="text-primary border-primary hover:bg-primary hover:text-primary-foreground font-medium"
                          >
                            {scanningSourceId === source.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Scannt...
                              </>
                            ) : (
                              'Jetzt scannen'
                            )}
                          </Button>
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
          </div>
        </main>
      </div>

    </>
  );
}
