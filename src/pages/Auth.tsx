import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AuthView = 'login' | 'signup' | 'forgot-password';

export default function Auth() {
  const { user, signIn, signUp, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<AuthView>('login');

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: language === 'de' ? 'E-Mail erforderlich' : 'Email required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use window.location.origin to ensure correct domain
      const redirectUrl = `${window.location.origin}/auth/update-password`;
      console.log('Password reset redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      console.log('Password reset response:', { data, error });

      if (error) {
        console.error('Password reset error:', error);
        
        // Show specific error messages
        let errorMessage = error.message;
        if (error.message.includes('rate limit') || error.message.includes('security purposes')) {
          errorMessage = language === 'de' 
            ? 'Bitte warten Sie einen Moment, bevor Sie es erneut versuchen.' 
            : 'Please wait a moment before trying again.';
        }
        
        toast({
          title: language === 'de' ? 'Fehler' : 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        toast({
          title: language === 'de' ? 'E-Mail gesendet!' : 'Email sent!',
          description: language === 'de'
            ? 'Bitte prüfen Sie Ihren Posteingang (auch den Spam-Ordner).'
            : 'Please check your inbox (including spam folder).',
        });
        setView('login');
        setEmail('');
      }
    } catch (err: any) {
      console.error('Unexpected error during password reset:', err);
      toast({
        title: language === 'de' ? 'Unerwarteter Fehler' : 'Unexpected Error',
        description: err?.message || 'Unknown error occurred',
        variant: 'destructive',
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

  // Forgot Password View
  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <div className="w-full max-w-md mb-4">
          <button 
            onClick={() => setView('login')}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>{language === 'de' ? 'Zurück zur Anmeldung' : 'Back to Login'}</span>
          </button>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-gold">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="font-display text-2xl">
              {language === 'de' ? 'Passwort zurücksetzen' : 'Reset Password'}
            </CardTitle>
            <CardDescription>
              {language === 'de' 
                ? 'Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.' 
                : 'Enter your email address and we will send you a reset link.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">{t('auth.email')}</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {language === 'de' ? 'Link senden' : 'Send Reset Link'}
              </Button>
            </form>
          </CardContent>
        </Card>
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
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setView('forgot-password')}
                    className="text-sm text-accent hover:underline"
                  >
                    {language === 'de' ? 'Passwort vergessen?' : 'Forgot password?'}
                  </button>
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
