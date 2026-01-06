import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Send, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ApplicationLetterDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApplicationLetterDialog({ isOpen, onClose }: ApplicationLetterDialogProps) {
  const { t, language } = useLanguage();
  const [artistName, setArtistName] = useState('');
  const [artDescription, setArtDescription] = useState('');
  const [prizeName, setPrizeName] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [generatedLetter]);

  const getText = () => {
    switch (language) {
      case 'en':
        return {
          title: 'Application Letter Generator',
          artistName: 'Your Name',
          artistNamePlaceholder: 'Enter your name',
          artDescription: 'Describe Your Art',
          artDescriptionPlaceholder: 'Describe your artistic practice, themes you explore, media you work with...',
          prizeName: 'Prize/Grant Name',
          prizeNamePlaceholder: 'Name of the prize or grant you\'re applying for',
          prizeDescription: 'Prize Description (optional)',
          prizeDescriptionPlaceholder: 'Paste the prize description or requirements here...',
          generate: 'Generate Letter',
          generating: 'Generating...',
          copy: 'Copy to Clipboard',
          copied: 'Copied!',
          result: 'Your Application Letter',
        };
      case 'fr':
        return {
          title: 'Générateur de Lettre de Candidature',
          artistName: 'Votre Nom',
          artistNamePlaceholder: 'Entrez votre nom',
          artDescription: 'Décrivez Votre Art',
          artDescriptionPlaceholder: 'Décrivez votre pratique artistique, les thèmes que vous explorez, les médiums que vous utilisez...',
          prizeName: 'Nom du Prix/Bourse',
          prizeNamePlaceholder: 'Nom du prix ou de la bourse pour laquelle vous postulez',
          prizeDescription: 'Description du Prix (optionnel)',
          prizeDescriptionPlaceholder: 'Collez la description du prix ou les conditions ici...',
          generate: 'Générer la Lettre',
          generating: 'Génération...',
          copy: 'Copier',
          copied: 'Copié!',
          result: 'Votre Lettre de Candidature',
        };
      default:
        return {
          title: 'Bewerbungsschreiben Generator',
          artistName: 'Ihr Name',
          artistNamePlaceholder: 'Geben Sie Ihren Namen ein',
          artDescription: 'Beschreiben Sie Ihre Kunst',
          artDescriptionPlaceholder: 'Beschreiben Sie Ihre künstlerische Praxis, Themen die Sie erforschen, Medien mit denen Sie arbeiten...',
          prizeName: 'Name des Preises/Stipendiums',
          prizeNamePlaceholder: 'Name des Preises oder Stipendiums für das Sie sich bewerben',
          prizeDescription: 'Preisbeschreibung (optional)',
          prizeDescriptionPlaceholder: 'Fügen Sie hier die Preisbeschreibung oder Anforderungen ein...',
          generate: 'Schreiben generieren',
          generating: 'Generiere...',
          copy: 'Kopieren',
          copied: 'Kopiert!',
          result: 'Ihr Bewerbungsschreiben',
        };
    }
  };

  const text = getText();

  const generateLetter = async () => {
    if (!artistName.trim() || !artDescription.trim() || !prizeName.trim()) {
      toast.error(language === 'de' 
        ? 'Bitte füllen Sie alle Pflichtfelder aus.' 
        : 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setGeneratedLetter('');

    // Detect language from prize name and description to write the letter in the appropriate language
    const tenderText = `${prizeName} ${prizeDescription}`.toLowerCase();
    const germanIndicators = ['preis', 'stipendium', 'ausstellung', 'bewerbung', 'förderung', 'kunst', 'künstler', 'galerie', 'deutschland', 'österreich', 'schweiz'];
    const englishIndicators = ['prize', 'grant', 'exhibition', 'application', 'artist', 'gallery', 'residency', 'award', 'competition', 'call for'];
    
    const germanScore = germanIndicators.filter(word => tenderText.includes(word)).length;
    const englishScore = englishIndicators.filter(word => tenderText.includes(word)).length;
    
    // Default to English if more English indicators, otherwise use German
    const tenderLanguage = englishScore > germanScore ? 'en' : 'de';

    const userMessage = tenderLanguage === 'de' 
      ? `Bitte erstelle ein professionelles Bewerbungsschreiben für den Kunstpreis "${prizeName}". 
      
Informationen über mich:
- Name: ${artistName}
- Meine künstlerische Arbeit: ${artDescription}

${prizeDescription ? `Beschreibung des Preises: ${prizeDescription}` : ''}

Das Schreiben sollte professionell, überzeugend und auf den Preis zugeschnitten sein. Bitte formatiere es als fertigen Brief auf Deutsch.`
      : `Please create a professional application letter for the art prize "${prizeName}".

Information about me:
- Name: ${artistName}
- My artistic practice: ${artDescription}

${prizeDescription ? `Prize description: ${prizeDescription}` : ''}

The letter should be professional, compelling, and tailored to the prize. Please format it as a complete letter in English.`;

    try {
      // Get user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(language === 'de' 
          ? 'Bitte melden Sie sich an, um diese Funktion zu nutzen.' 
          : 'Please sign in to use this feature.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-consultant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prize: {
            name: prizeName,
            organizer: '',
            category: '',
            deadline: '',
            prizeAmount: null,
            region: '',
            country: '',
            ageMin: null,
            ageMax: null,
            fee: null,
            description: prizeDescription || 'Keine Beschreibung vorhanden.',
            requirements: [],
          },
          userMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error(language === 'de' 
            ? 'Rate-Limit erreicht. Bitte versuche es später erneut.' 
            : 'Rate limit reached. Please try again later.');
        } else if (response.status === 402) {
          toast.error(language === 'de' 
            ? 'Guthaben aufgebraucht. Bitte lade dein Konto auf.' 
            : 'Insufficient credits. Please top up your account.');
        } else {
          toast.error(errorData.error || (language === 'de' ? 'Ein Fehler ist aufgetreten.' : 'An error occurred.'));
        }
        setIsLoading(false);
        return;
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setGeneratedLetter(fullContent);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Application letter generation error:', error);
      toast.error(language === 'de' 
        ? 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' 
        : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLetter);
      setCopied(true);
      toast.success(language === 'de' ? 'In die Zwischenablage kopiert!' : 'Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(language === 'de' ? 'Kopieren fehlgeschlagen' : 'Failed to copy');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <DialogTitle className="font-display text-xl">
              {text.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 px-6" ref={scrollRef}>
            <div className="space-y-6 py-4">
              {/* Input Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="artistName">{text.artistName} *</Label>
                  <Input
                    id="artistName"
                    placeholder={text.artistNamePlaceholder}
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prizeName">{text.prizeName} *</Label>
                  <Input
                    id="prizeName"
                    placeholder={text.prizeNamePlaceholder}
                    value={prizeName}
                    onChange={(e) => setPrizeName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artDescription">{text.artDescription} *</Label>
                  <Textarea
                    id="artDescription"
                    placeholder={text.artDescriptionPlaceholder}
                    value={artDescription}
                    onChange={(e) => setArtDescription(e.target.value)}
                    className="min-h-[100px] resize-none"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prizeDescription">{text.prizeDescription}</Label>
                  <Textarea
                    id="prizeDescription"
                    placeholder={text.prizeDescriptionPlaceholder}
                    value={prizeDescription}
                    onChange={(e) => setPrizeDescription(e.target.value)}
                    className="min-h-[80px] resize-none"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  onClick={generateLetter}
                  disabled={isLoading || !artistName.trim() || !artDescription.trim() || !prizeName.trim()}
                  className="w-full gradient-gold text-primary font-semibold border-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {text.generating}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {text.generate}
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Letter */}
              {generatedLetter && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold">{text.result}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="h-8"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          {text.copied}
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          {text.copy}
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-4 border">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {generatedLetter}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}