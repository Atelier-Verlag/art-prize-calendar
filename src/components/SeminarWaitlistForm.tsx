import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, GraduationCap } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().trim().email({ message: "Ungültige E-Mail-Adresse" }).max(255);

interface SeminarWaitlistFormProps {
  onSuccess?: () => void;
}

export function SeminarWaitlistForm({ onSuccess }: SeminarWaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast({
        title: 'Ungültige E-Mail',
        description: result.error.errors[0]?.message || 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const waitlistId = crypto.randomUUID();

      const { error } = await supabase
        .from('seminar_waitlist')
        .insert({ id: waitlistId, email: result.data, status: 'pending' });

      if (error) {
        throw error;
      }

      // Send confirmation email via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-waitlist-confirmation', {
        body: {
          email: result.data,
          waitlistId,
        },
      });

      if (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't throw - user is still on the waitlist, just email failed
      }

      if (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't throw - user is still on the waitlist, just email failed
      }

      setIsSuccess(true);
      toast({
        title: 'Fast geschafft!',
        description: 'Bitte prüfe deinen Posteingang und bestätige deine E-Mail-Adresse, um die Anmeldung abzuschließen.',
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding to waitlist:', error);
      toast({
        title: 'Fehler',
        description: 'Eintragung fehlgeschlagen. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
        <CheckCircle className="h-5 w-5 shrink-0" />
        <span className="text-sm font-medium">Fast geschafft! Prüfe deinen Posteingang.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-foreground font-semibold">
        <GraduationCap className="h-5 w-5 text-primary" />
        <span>Schluss mit unnötigen Kosten!</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Lerne, wie du seriöse Ausschreibungen sofort erkennst. Damit du dir die Gebühren sparst und dich voll darauf konzentrierst, Preise, Wettbewerbe und Stipendien wirklich zu gewinnen.
      </p>
      <p className="text-sm text-muted-foreground">
        Setz dich unverbindlich auf die Warteliste für unsere kommenden Seminare.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="E-Mail-Adresse"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 h-9"
          required
          disabled={isSubmitting}
        />
        <Button 
          type="submit" 
          size="sm"
          disabled={isSubmitting || !email.trim()}
          className="shrink-0"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Auf die Warteliste'
          )}
        </Button>
      </form>
    </div>
  );
}
