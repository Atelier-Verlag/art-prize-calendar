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
  const { user, signIn, signUp, signOut, loading } = useAuth();
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

  const waitForSession = async (maxMs = 5000, intervalMs = 250) => {
    const start = Date.now();

    // Poll until a session exists (token propagation after signup can be slightly delayed)
    while (Date.now() - start < maxMs) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token && session.user?.id) return session;
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    return null;
  };

  const launchCheckout = async (checkoutPriceId: string): Promise<void> => {
    console.log('[Checkout] Starting launchCheckout with priceId:', checkoutPriceId);

    // Bypass React state: pull the freshest session directly from the auth client storage first.
    const {
      data: { session: directSession },
      error: directSessionError,
    } = await supabase.auth.getSession();

    if (directSessionError) {
      console.warn('[Checkout] getSession() returned an error:', directSessionError);
    }

    const directSessionReady = !!directSession?.access_token && !!directSession?.user?.id;

    // If direct session is not ready yet (common right after signup), fall back to polling.
    const session = directSessionReady ? directSession : await waitForSession();

    // Strict guard: never invoke backend checkout without a logged-in user/session.
    if (!session || !session.user || !session.access_token) {
      console.error('[Checkout] Guard blocked checkout invocation (no active session/user)');
      throw new Error('No active session');
    }

    console.log('[Checkout] Session obtained, userId:', session.user.id);
    console.log('[Checkout] Using session source:', directSessionReady ? 'direct_getSession' : 'polled_waitForSession');
    console.log('[Checkout] Invoking create-checkout function...');

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { priceId: checkoutPriceId },
    });

    console.log('[Checkout] Function response - data:', data, 'error:', error);

    if (error) {
      console.error('[Checkout] Function invoke error:', error);
      throw error;
    }

    if (!data?.url) {
      console.error('[Checkout] No URL in response:', data);
      throw new Error('NO_CHECKOUT_URL');
    }

    console.log('[Checkout] Opening Stripe URL:', data.url);
    window.open(data.url, '_blank', 'noopener,noreferrer');
  };

  // Handle post-auth checkout redirect
  useEffect(() => {
    const handlePostAuthCheckout = async () => {
      if (user && !loading && priceId && !isProcessingCheckout) {
        setIsProcessingCheckout(true);
        setIsSubmitting(false);

        try {
          await launchCheckout(priceId);
          navigate(returnTo);
        } catch (err: any) {
          // If session isn't ready yet, don't error-toast; let the fallback button appear.
          if (err?.message === 'NO_SESSION') {
            setCheckoutTimeout(true);
          } else {
            console.error('Checkout error:', err);
            toast({
              title: language === 'de' ? 'Fehler' : 'Error',
              description:
                language === 'de'
                  ? 'Checkout konnte nicht gestartet werden. Bitte versuchen Sie es erneut.'
                  : 'Unable to start checkout. Please try again.',
              variant: 'destructive',
            });
            setCheckoutTimeout(true);
          }
          setIsProcessingCheckout(false);
        }
      }
    };

    handlePostAuthCheckout();
  }, [user, loading, priceId, returnTo, navigate, isProcessingCheckout, toast, language]);

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
      const isRateLimit =
        /rate limit|too many requests|security purposes/i.test(error.message ?? '');

      if (isRateLimit) {
        toast({
          title: language === 'de' ? 'Zu viele Versuche' : 'Too many attempts',
          description:
            language === 'de'
              ? 'Zu viele Versuche. Bitte versuchen Sie es später erneut.'
              : 'Too many attempts. Please try again later.',
          variant: 'destructive',
        });
      } else if (error.message.includes('already registered')) {
        toast({
          title: t('auth.error.exists'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: language === 'de' ? 'Fehler' : 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }

      setIsSubmitting(false);
      return; // IMPORTANT: stop flow on signup failure
    }

    setSignupComplete(true);

    // With auto-confirm enabled, Supabase auto-logs in the user.
    // The useEffect watching `user` will trigger checkout once session propagates.
    toast({
      title: language === 'de' ? 'Erfolgreich registriert!' : 'Successfully registered!',
      description: isCheckoutFlow
        ? language === 'de'
          ? 'Weiterleitung zur Zahlung...'
          : 'Redirecting to checkout...'
        : language === 'de'
          ? 'Willkommen!'
          : 'Welcome!',
    });
    // Keep isSubmitting true - the checkout useEffect will handle the rest
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
                      setIsSubmitting(true);
                      try {
                        await launchCheckout(priceId!);
                        navigate(returnTo);
                      } catch (err: any) {
                        console.error('Manual checkout error:', err);
                        toast({
                          title: language === 'de' ? 'Fehler' : 'Error',
                          description:
                            language === 'de'
                              ? 'Checkout konnte nicht gestartet werden. Bitte versuchen Sie es erneut.'
                              : 'Unable to start checkout. Please try again.',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {language === 'de' ? 'Weiter zur Zahlung' : 'Proceed to Payment'}
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
