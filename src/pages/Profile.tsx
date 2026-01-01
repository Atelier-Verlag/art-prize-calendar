import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Crown, CreditCard, User, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Profile() {
  const { t } = useLanguage();
  const { user, isProUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleManageSubscription = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Bitte melde dich erneut an.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error('Kein Abo gefunden. Bitte schließe zuerst ein Pro-Abo ab.');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.error('Fehler beim Öffnen des Abo-Portals.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Mein Profil | Kunstpreiskalender</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Kalender
          </Button>

          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Mein Profil
                </CardTitle>
                <CardDescription>Deine Kontoinformationen und Abo-Status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-Mail</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Crown className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      {isProUser ? (
                        <Badge className="gradient-gold text-primary border-0">
                          <Crown className="h-3 w-3 mr-1" />
                          Pro-Mitglied
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Free</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Abonnement
                </CardTitle>
                <CardDescription>Verwalte dein Abo über das Stripe-Kundenportal</CardDescription>
              </CardHeader>
              <CardContent>
                {isProUser ? (
                  <Button onClick={handleManageSubscription} className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Abo verwalten
                  </Button>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">Du hast noch kein Pro-Abo.</p>
                    <Button onClick={() => navigate('/#pricing')} variant="outline">
                      Pro-Abo abschließen
                    </Button>
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
