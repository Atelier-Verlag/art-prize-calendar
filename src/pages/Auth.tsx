import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Loader2, ArrowLeft, Mail, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AuthView = 'login' | 'signup' | 'forgot-password';

export default function Auth() {
  const { user, signIn, signUp, signOut, loading, startCheckout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<AuthView>('login');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [checkoutTimeout, setCheckoutTimeout] = useState(false);

  // Get checkout params from URL
  const priceId = searchParams.get('priceId');
  const returnTo = searchParams.get('returnTo') || '/';
  const isCheckoutFlow = !!priceId;

  // Handle post-auth checkout redirect
  useEffect(() => {
    const handlePostAuthCheckout = async () => {
      if (user && !loading && priceId && !isProcessingCheckout) {
        setIsProcessingCheckout(true);
        setIsSubmitting(false); // Clear submitting state
        // User just logged in/signed up and has a pending checkout
        await startCheckout(priceId);
        navigate(returnTo);
      }
    };

    handlePostAuthCheckout();
  }, [user, loading, priceId, returnTo, navigate, startCheckout, isProcessingCheckout]);

  // Fallback timeout: if checkout is processing for > 3 seconds, show manual button
  useEffect(() => {
    if (signupComplete && isCheckoutFlow) {
      const timeout = setTimeout(() => {
        setCheckoutTimeout(true);
        setIsSubmitting(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [signupComplete, isCheckoutFlow]);

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
      setIsSubmitting(false);
    }
    // Don't navigate here - useEffect will handle it after user state updates
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
      setIsSubmitting(false);
    } else {
      setSignupComplete(true); // Mark signup as complete for timeout fallback
      toast({
        title: language === 'de' ? 'Erfolgreich registriert!' : 'Successfully registered!',
        description: isCheckoutFlow 
          ? (language === 'de' ? 'Weiterleitung zur Zahlung...' : 'Redirecting to checkout...')
          : (language === 'de' ? 'Willkommen!' : 'Welcome!'),
      });
      // Keep isSubmitting true - useEffect will clear it when checkout starts or timeout fires
    }
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

  // Logged-in view (so users can explicitly clear session)
  if (user && !isCheckoutFlow) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
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
            <CardTitle className="font-display text-2xl">
              {language === 'de' ? 'Sie sind angemeldet' : 'You are signed in'}
            </CardTitle>
            <CardDescription className="break-all">
              {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => navigate(returnTo)}
            >
              {language === 'de' ? 'Weiter' : 'Continue'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await signOut();
                // ensure all in-memory state is cleared
                window.location.reload();
              }}
            >
              {language === 'de' ? 'Abmelden (Session löschen)' : 'Logout (clear session)'}
            </Button>
          </CardContent>
        </Card>
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

      {/* Checkout Flow Banner */}
      {isCheckoutFlow && (
        <div className="w-full max-w-md mb-4 bg-accent/10 border border-accent/30 rounded-lg p-4 flex items-start gap-3">
          <ShoppingCart className="h-5 w-5 text-accent mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {language === 'de' ? 'Fast geschafft!' : 'Almost there!'}
            </p>
            <p className="text-xs text-muted-foreground">
              {language === 'de' 
                ? 'Melden Sie sich an oder erstellen Sie ein Konto, um den Kauf abzuschließen.'
                : 'Sign in or create an account to complete your purchase.'}
            </p>
          </div>
        </div>
      )}
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-gold">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="font-display text-2xl">Kunstpreiskalender</CardTitle>
          <CardDescription>
            {isCheckoutFlow 
              ? (language === 'de' ? 'Konto erstellen oder anmelden' : 'Create account or sign in')
              : t('hero.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Default to signup tab when in checkout flow */}
          <Tabs defaultValue={isCheckoutFlow ? 'signup' : 'login'} className="w-full">
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
                {checkoutTimeout && isCheckoutFlow ? (
                  <Button
                    type="button"
                    className="w-full gradient-gold text-primary font-semibold border-0"
                    disabled={isSubmitting}
                    onClick={async () => {
                      // Check if session is established after signup
                      if (user) {
                        setIsSubmitting(true);
                        await startCheckout(priceId!);
                        navigate(returnTo);
                      } else {
                        // Session not ready yet - user needs to log in
                        toast({
                          title: language === 'de' ? 'Bitte anmelden' : 'Please log in',
                          description: language === 'de' 
                            ? 'Melden Sie sich mit Ihren Zugangsdaten an, um fortzufahren.'
                            : 'Log in with your credentials to continue.',
                        });
                        setView('login');
                        setSignupComplete(false);
                        setCheckoutTimeout(false);
                      }
                    }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {user 
                      ? (language === 'de' ? 'Weiter zur Zahlung' : 'Proceed to Payment')
                      : (language === 'de' ? 'Anmelden & fortfahren' : 'Log in & continue')}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="w-full gradient-gold text-primary font-semibold border-0"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {signupComplete 
                      ? (language === 'de' ? 'Weiterleitung...' : 'Redirecting...')
                      : t('auth.signup')}
                  </Button>
                )}
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
