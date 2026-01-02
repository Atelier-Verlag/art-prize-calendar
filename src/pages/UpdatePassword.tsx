import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UpdatePassword() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // The user should have a session after clicking the recovery link
      if (session) {
        setIsValidSession(true);
      }
      setIsLoading(false);
    };

    checkSession();

    // Listen for auth state changes (recovery link clicked)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({
        title: language === 'de' ? 'Passwort zu kurz' : 'Password too short',
        description: language === 'de' ? 'Mindestens 8 Zeichen erforderlich.' : 'At least 8 characters required.',
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

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: language === 'de' ? 'Passwort aktualisiert!' : 'Password updated!',
        description: language === 'de' 
          ? 'Sie können sich jetzt mit Ihrem neuen Passwort anmelden.' 
          : 'You can now log in with your new password.',
      });
      navigate('/auth');
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">
              {language === 'de' ? 'Ungültiger Link' : 'Invalid Link'}
            </CardTitle>
            <CardDescription>
              {language === 'de' 
                ? 'Dieser Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.' 
                : 'This link is invalid or expired. Please request a new link.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth">
              <Button className="w-full gradient-gold text-primary font-semibold border-0">
                {language === 'de' ? 'Zurück zur Anmeldung' : 'Back to Login'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-md mb-4">
        <Link 
          to="/auth" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>{language === 'de' ? 'Zurück zur Anmeldung' : 'Back to Login'}</span>
        </Link>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-gold">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="font-display text-2xl">
            {language === 'de' ? 'Neues Passwort festlegen' : 'Set New Password'}
          </CardTitle>
          <CardDescription>
            {language === 'de' 
              ? 'Geben Sie Ihr neues Passwort ein.' 
              : 'Enter your new password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">
                {language === 'de' ? 'Neues Passwort' : 'New Password'}
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder={language === 'de' ? 'min. 8 Zeichen' : 'min. 8 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">
                {language === 'de' ? 'Passwort wiederholen' : 'Confirm Password'}
              </Label>
              <Input
                id="confirm-new-password"
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
              {language === 'de' ? 'Passwort speichern' : 'Save Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
