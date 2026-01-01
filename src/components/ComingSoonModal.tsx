import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Bell } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function ComingSoonModal({ isOpen, onClose, featureName }: ComingSoonModalProps) {
  const { language } = useLanguage();

  const getText = () => {
    switch (language) {
      case 'en':
        return {
          title: 'Coming Soon',
          description: `The "${featureName || 'AI Assistant'}" feature is currently in development. We're working hard to bring you the best experience.`,
          notify: 'Notify me',
          close: 'Close',
        };
      case 'fr':
        return {
          title: 'Bientôt disponible',
          description: `La fonctionnalité "${featureName || 'Assistant IA'}" est en cours de développement. Nous travaillons dur pour vous offrir la meilleure expérience.`,
          notify: 'Me notifier',
          close: 'Fermer',
        };
      default:
        return {
          title: 'Demnächst verfügbar',
          description: `Die Funktion "${featureName || 'KI-Assistent'}" befindet sich derzeit in der Entwicklung. Wir arbeiten daran, Ihnen das beste Erlebnis zu bieten.`,
          notify: 'Benachrichtigen',
          close: 'Schließen',
        };
    }
  };

  const text = getText();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            {text.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {text.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-4">
          <Button 
            className="gradient-gold text-primary font-semibold border-0"
            onClick={onClose}
          >
            <Bell className="h-4 w-4 mr-2" />
            {text.notify}
          </Button>
          <Button 
            variant="outline"
            onClick={onClose}
          >
            {text.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
