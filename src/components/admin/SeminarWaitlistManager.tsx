import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, RefreshCw, Loader2, Trash2, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
}

export function SeminarWaitlistManager() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('seminar_waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading waitlist:', error);
        toast({
          title: 'Fehler',
          description: 'Warteliste konnte nicht geladen werden.',
          variant: 'destructive',
        });
      } else {
        setEntries(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Möchten Sie "${email}" wirklich von der Warteliste entfernen?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('seminar_waitlist')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setEntries(prev => prev.filter(e => e.id !== id));
      toast({
        title: 'Entfernt',
        description: `${email} wurde von der Warteliste entfernt.`,
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: 'Fehler',
        description: 'Eintrag konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Seminar Warteliste
                <Badge variant="secondary" className="ml-2">
                  {entries.length}
                </Badge>
              </CardTitle>
              <CardDescription>Interessenten für das Seminar zu seriösen Ausschreibungen</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadEntries}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
            Noch keine Anmeldungen auf der Warteliste.
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{entry.email}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(entry.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(entry.id, entry.email)}
                  disabled={deletingId === entry.id}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  {deletingId === entry.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
