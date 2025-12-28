import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const { user, signIn, signUp, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: t('auth.error.invalid'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/');
    }

    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast({
        title: t('auth.error.password'),
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
      if (error.message.includes('already registered')) {
        toast({
          title: t('auth.error.exists'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Fehler',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: language === 'de' ? 'Erfolgreich registriert!' : 'Successfully registered!',
        description: language === 'de' ? 'Sie können sich jetzt anmelden.' : 'You can now log in.',
      });
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      {/* Back to Calendar Link */}
      <div className="w-full max-w-md mb-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>{language === 'de' ? 'Zurück zum Kalender' : 'Back to Calendar'}</span>
        </Link>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-gold">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="font-display text-2xl">Kunstpreiskalender</CardTitle>
          <CardDescription>
            {t('hero.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('auth.email')}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t('auth.password')}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-gold text-primary font-semibold border-0"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {t('auth.login')}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                {t('auth.noAccount')}{' '}
                <button
                  type="button"
                  className="text-accent hover:underline"
                  onClick={() => document.querySelector<HTMLButtonElement>('[data-value="signup"]')?.click()}
                >
                  {t('auth.signup')}
                </button>
              </p>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder={language === 'de' ? 'min. 8 Zeichen' : 'min. 8 characters'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">
                    {language === 'de' ? 'Passwort wiederholen' : 'Confirm Password'}
                  </Label>
                  <Input
                    id="signup-confirm-password"
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
                  className="w-full gradient-gold text-primary font-semibold border-0"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {t('auth.signup')}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                {t('auth.hasAccount')}{' '}
                <button
                  type="button"
                  className="text-accent hover:underline"
                  onClick={() => document.querySelector<HTMLButtonElement>('[data-value="login"]')?.click()}
                >
                  {t('auth.login')}
                </button>
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
