import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pencil, Trash2, Award, RefreshCw, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ArtPrize {
  id: string;
  name: string;
  organizer: string;
  deadline: string;
  website: string;
  description: string;
  is_archived: boolean;
  created_at: string;
  category: string;
  region: string;
  country: string;
  prize_amount: number | null;
  fee: number | null;
  age_min: number | null;
  age_max: number | null;
  requirements: string[];
}

export function ArtPrizesManager() {
  const { toast } = useToast();
  const [prizes, setPrizes] = useState<ArtPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrize, setEditingPrize] = useState<ArtPrize | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadPrizes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('art_prizes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading prizes:', error);
      toast({
        title: 'Fehler',
        description: 'Ausschreibungen konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } else {
      setPrizes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPrizes();
  }, []);

  const handleToggleArchived = async (id: string, isArchived: boolean) => {
    const { error } = await supabase
      .from('art_prizes')
      .update({ is_archived: isArchived })
      .eq('id', id);

    if (error) {
      console.error('Error toggling archive:', error);
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht geändert werden.',
        variant: 'destructive',
      });
    } else {
      setPrizes(prev => prev.map(p => p.id === id ? { ...p, is_archived: isArchived } : p));
      toast({
        title: isArchived ? 'Archiviert' : 'Wiederhergestellt',
        description: isArchived ? 'Ausschreibung wurde archiviert.' : 'Ausschreibung ist wieder aktiv.',
      });
    }
  };

  const handleEdit = (prize: ArtPrize) => {
    setEditingPrize({ ...prize });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPrize) return;

    setSaving(true);
    const { error } = await supabase
      .from('art_prizes')
      .update({
        name: editingPrize.name,
        deadline: editingPrize.deadline,
        website: editingPrize.website,
        description: editingPrize.description,
        organizer: editingPrize.organizer,
        category: editingPrize.category as any,
      })
      .eq('id', editingPrize.id);

    if (error) {
      console.error('Error saving prize:', error);
      toast({
        title: 'Fehler',
        description: 'Änderungen konnten nicht gespeichert werden.',
        variant: 'destructive',
      });
    } else {
      setPrizes(prev => prev.map(p => p.id === editingPrize.id ? { ...p, ...editingPrize } : p));
      toast({
        title: 'Gespeichert',
        description: 'Ausschreibung wurde aktualisiert.',
      });
      setIsEditDialogOpen(false);
      setEditingPrize(null);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Möchten Sie "${name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    setDeleting(id);
    const { error } = await supabase
      .from('art_prizes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting prize:', error);
      toast({
        title: 'Fehler',
        description: 'Ausschreibung konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    } else {
      setPrizes(prev => prev.filter(p => p.id !== id));
      toast({
        title: 'Gelöscht',
        description: `"${name}" wurde entfernt.`,
      });
    }
    setDeleting(null);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Ausschreibungen verwalten</CardTitle>
              <CardDescription>
                {prizes.length} Einträge • Bearbeiten, Archivieren oder Löschen
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPrizes}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : prizes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
            Noch keine Ausschreibungen vorhanden. Starten Sie den Roboter, um Daten zu sammeln.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[35%]">Titel</TableHead>
                  <TableHead className="w-[15%]">Kategorie</TableHead>
                  <TableHead className="w-[12%]">Deadline</TableHead>
                  <TableHead className="w-[12%] text-center">Archiviert</TableHead>
                  <TableHead className="w-[26%] text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prizes.map((prize) => (
                  <TableRow key={prize.id} className={prize.is_archived ? 'opacity-60 bg-muted/20' : ''}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground line-clamp-1">{prize.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{prize.organizer}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {prize.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(prize.deadline), 'dd.MM.yyyy', { locale: de })}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={prize.is_archived}
                        onCheckedChange={(checked) => handleToggleArchived(prize.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {prize.website && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-muted-foreground hover:text-primary"
                          >
                            <a href={prize.website} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(prize)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(prize.id, prize.name)}
                          disabled={deleting === prize.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {deleting === prize.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ausschreibung bearbeiten</DialogTitle>
            <DialogDescription>
              Korrigieren Sie die Daten der Ausschreibung.
            </DialogDescription>
          </DialogHeader>
          
          {editingPrize && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Titel</Label>
                <Input
                  id="edit-name"
                  value={editingPrize.name}
                  onChange={(e) => setEditingPrize({ ...editingPrize, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-organizer">Veranstalter</Label>
                <Input
                  id="edit-organizer"
                  value={editingPrize.organizer}
                  onChange={(e) => setEditingPrize({ ...editingPrize, organizer: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Kategorie</Label>
                  <Select
                    value={editingPrize.category}
                    onValueChange={(value) => setEditingPrize({ ...editingPrize, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kunstpreis">Kunstpreis</SelectItem>
                      <SelectItem value="Wettbewerb">Wettbewerb</SelectItem>
                      <SelectItem value="grant">Stipendium</SelectItem>
                      <SelectItem value="painting">Malerei</SelectItem>
                      <SelectItem value="photography">Fotografie</SelectItem>
                      <SelectItem value="sculpture">Skulptur</SelectItem>
                      <SelectItem value="residency">Residenz</SelectItem>
                      <SelectItem value="mixed">Gemischt</SelectItem>
                      <SelectItem value="media">Medienkunst</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="exhibition">Ausstellung</SelectItem>
                      <SelectItem value="public_art">Kunst im öffentl. Raum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-deadline">Deadline</Label>
                  <Input
                    id="edit-deadline"
                    type="date"
                    value={editingPrize.deadline}
                    onChange={(e) => setEditingPrize({ ...editingPrize, deadline: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  type="url"
                  value={editingPrize.website}
                  onChange={(e) => setEditingPrize({ ...editingPrize, website: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Beschreibung</Label>
                <Textarea
                  id="edit-description"
                  value={editingPrize.description}
                  onChange={(e) => setEditingPrize({ ...editingPrize, description: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={saving}
              className="gradient-gold text-primary font-semibold border-0"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Speichern...
                </>
              ) : (
                'Speichern'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
