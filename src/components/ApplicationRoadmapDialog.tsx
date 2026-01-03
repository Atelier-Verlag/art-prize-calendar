import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Route, Loader2, CheckCircle, Calendar, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApplicationRoadmapDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RoadmapStep {
  week: string;
  title: string;
  tasks: string[];
  priority: 'high' | 'medium' | 'low';
}

export function ApplicationRoadmapDialog({ isOpen, onClose }: ApplicationRoadmapDialogProps) {
  const { t, language } = useLanguage();
  const [tenderDescription, setTenderDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [requirements, setRequirements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapStep[] | null>(null);

  const handleGenerate = async () => {
    if (!tenderDescription.trim() || !deadline) {
      toast.error(language === 'de' ? 'Bitte füllen Sie alle Pflichtfelder aus' : 'Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    setRoadmap(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-roadmap', {
        body: {
          tenderDescription,
          deadline,
          requirements,
          language,
        },
      });

      if (error) throw error;

      if (data?.roadmap) {
        setRoadmap(data.roadmap);
        toast.success(language === 'de' ? 'Fahrplan erstellt!' : 'Roadmap generated!');
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
      toast.error(language === 'de' ? 'Fehler beim Erstellen des Fahrplans' : 'Error generating roadmap');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setTenderDescription('');
    setDeadline('');
    setRequirements('');
    setRoadmap(null);
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-muted-foreground';
      default: return 'text-foreground';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Calendar className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-accent" />
            {language === 'de' ? 'Bewerbungsfahrplan' : language === 'fr' ? 'Feuille de route de candidature' : 'Application Roadmap'}
          </DialogTitle>
          <DialogDescription>
            {language === 'de' 
              ? 'Erstellen Sie einen personalisierten Zeitplan für Ihre Bewerbung' 
              : language === 'fr'
              ? 'Créez un calendrier personnalisé pour votre candidature'
              : 'Create a personalized timeline for your application'}
          </DialogDescription>
        </DialogHeader>

        {!roadmap ? (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">
                {language === 'de' ? 'Bewerbungsfrist *' : language === 'fr' ? 'Date limite *' : 'Application Deadline *'}
              </Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {language === 'de' ? 'Ausschreibungsbeschreibung *' : language === 'fr' ? 'Description de l\'appel *' : 'Tender Description *'}
              </Label>
              <Textarea
                id="description"
                placeholder={language === 'de' 
                  ? 'Fügen Sie hier die Ausschreibungsbeschreibung ein...' 
                  : language === 'fr'
                  ? 'Collez la description de l\'appel ici...'
                  : 'Paste the tender description here...'}
                value={tenderDescription}
                onChange={(e) => setTenderDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">
                {language === 'de' ? 'Spezifische Anforderungen (optional)' : language === 'fr' ? 'Exigences spécifiques (optionnel)' : 'Specific Requirements (optional)'}
              </Label>
              <Textarea
                id="requirements"
                placeholder={language === 'de' 
                  ? 'z.B. Portfolio, Lebenslauf, Projektbeschreibung...' 
                  : language === 'fr'
                  ? 'ex. Portfolio, CV, description du projet...'
                  : 'e.g. Portfolio, CV, project description...'}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !tenderDescription.trim() || !deadline}
              className="w-full gradient-gold text-primary font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'de' ? 'Fahrplan wird erstellt...' : 'Generating roadmap...'}
                </>
              ) : (
                <>
                  <Route className="h-4 w-4 mr-2" />
                  {language === 'de' ? 'Fahrplan erstellen' : language === 'fr' ? 'Créer le plan' : 'Generate Roadmap'}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="space-y-3">
              {roadmap.map((step, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 bg-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`flex items-center gap-1 ${getPriorityColor(step.priority)}`}>
                      {getPriorityIcon(step.priority)}
                    </span>
                    <span className="font-semibold text-sm text-muted-foreground">{step.week}</span>
                    <span className="font-medium">{step.title}</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {step.tasks.map((task, taskIndex) => (
                      <li key={taskIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3 w-3 mt-1 flex-shrink-0 text-accent" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setRoadmap(null)}
                className="flex-1"
              >
                {language === 'de' ? 'Neuen Fahrplan erstellen' : 'Create New Roadmap'}
              </Button>
              <Button
                onClick={handleClose}
                className="flex-1 gradient-gold text-primary font-semibold"
              >
                {language === 'de' ? 'Fertig' : 'Done'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
