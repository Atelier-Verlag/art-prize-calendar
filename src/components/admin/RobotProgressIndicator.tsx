import { useState, useEffect, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RobotProgressIndicatorProps {
  isRunning: boolean;
  sourceName?: string;
  onComplete?: (success: boolean, message: string) => void;
}

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

const INITIAL_STEPS: ProgressStep[] = [
  { id: 'search', label: 'Websites durchsuchen...', status: 'pending' },
  { id: 'analyze', label: 'Inhalte analysieren...', status: 'pending' },
  { id: 'extract', label: 'Preise & Deadlines extrahieren...', status: 'pending' },
  { id: 'save', label: 'In Datenbank speichern...', status: 'pending' },
];

const STEP_DURATION_MS = 5000; // Average time per step for progress simulation
const TIMEOUT_WARNING_MS = 20000; // Show warning after 20 seconds
const MAX_DURATION_MS = 30000; // Max expected duration

export function RobotProgressIndicator({ 
  isRunning, 
  sourceName,
  onComplete 
}: RobotProgressIndicatorProps) {
  const [steps, setSteps] = useState<ProgressStep[]>(INITIAL_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  // Reset when starting
  useEffect(() => {
    if (isRunning) {
      setSteps(INITIAL_STEPS.map((s, i) => ({
        ...s,
        status: i === 0 ? 'active' : 'pending'
      })));
      setCurrentStepIndex(0);
      setElapsedSeconds(0);
      setShowTimeoutWarning(false);
      setProgressPercent(0);
    }
  }, [isRunning]);

  // Timer for elapsed seconds
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setElapsedSeconds(prev => {
        const newVal = prev + 1;
        if (newVal * 1000 >= TIMEOUT_WARNING_MS) {
          setShowTimeoutWarning(true);
        }
        return newVal;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  // Progress simulation - advances steps over time
  useEffect(() => {
    if (!isRunning) return;

    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prev => {
        const next = Math.min(prev + 1, INITIAL_STEPS.length - 1);
        
        setSteps(current => 
          current.map((step, i) => ({
            ...step,
            status: i < next ? 'complete' : i === next ? 'active' : 'pending'
          }))
        );
        
        return next;
      });
    }, STEP_DURATION_MS);

    return () => clearInterval(stepInterval);
  }, [isRunning]);

  // Progress bar animation
  useEffect(() => {
    if (!isRunning) return;

    const progressInterval = setInterval(() => {
      setProgressPercent(prev => {
        // Slow down as we approach 90% (never hit 100 until actually done)
        const remaining = 90 - prev;
        const increment = Math.max(0.5, remaining * 0.05);
        return Math.min(90, prev + increment);
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [isRunning]);

  // When running stops, complete the progress
  useEffect(() => {
    if (!isRunning && progressPercent > 0) {
      setProgressPercent(100);
      setSteps(current => current.map(s => ({ ...s, status: 'complete' })));
    }
  }, [isRunning, progressPercent]);

  const getStepIcon = useCallback((status: ProgressStep['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground/40" />;
    }
  }, []);

  if (!isRunning && progressPercent === 0) {
    return null;
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className={cn(
            "h-5 w-5 text-primary",
            isRunning && "animate-spin"
          )} />
          <span className="font-medium text-foreground">
            {sourceName 
              ? `Scanne: ${sourceName}` 
              : 'Internationale Suche läuft'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{elapsedSeconds}s</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {steps.filter(s => s.status === 'complete').length}/{steps.length} Schritte
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
      </div>

      {/* Step checklist */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={cn(
              "flex items-center gap-3 text-sm transition-all duration-300",
              step.status === 'active' && "text-foreground font-medium",
              step.status === 'complete' && "text-muted-foreground",
              step.status === 'pending' && "text-muted-foreground/50"
            )}
          >
            {getStepIcon(step.status)}
            <span>{step.label}</span>
            {step.status === 'active' && (
              <span className="text-xs text-primary animate-pulse">
                {index === 0 && 'Verbinde mit Tavily API...'}
                {index === 1 && 'AI analysiert Texte...'}
                {index === 2 && 'Prüfe Alterslimits & Gebühren...'}
                {index === 3 && 'Speichere in Datenbank...'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Timeout warning */}
      {showTimeoutWarning && isRunning && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg animate-in fade-in duration-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            {elapsedSeconds >= 25 
              ? 'Dauert länger als erwartet – bitte noch einen Moment warten...'
              : 'Die Analyse dauert etwas länger – bleiben Sie auf dieser Seite.'}
          </span>
        </div>
      )}

      {/* Completion message */}
      {!isRunning && progressPercent === 100 && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg animate-in fade-in duration-300">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            Scan abgeschlossen in {elapsedSeconds} Sekunden!
          </span>
        </div>
      )}
    </div>
  );
}
