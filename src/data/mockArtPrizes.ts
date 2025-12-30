export type Category = 
  | 'Kunstpreis'
  | 'Wettbewerb'
  | 'Malerei'
  | 'Skulptur'
  | 'Fotografie'
  | 'Mixed Media'
  | 'Performance'
  | 'Installation'
  | 'Residenz'
  | 'Förderung'
  | 'Stipendium'
  | 'Ausstellung'
  | 'Kunst am Bau'
  | 'Medienkunst'
  | 'Keramik';

export interface ArtPrize {
  id: string;
  name: string;
  organizer: string;
  category: Category;
  deadline: string;
  prizeAmount: number | null;
  benefitDetails: string | null; // Flexible text-based benefit description
  region: string;
  country: string;
  ageMin: number | null;
  ageMax: number | null;
  fee: number | null;
  description: string;
  requirements: string[];
  website: string;
  isShortTerm: boolean; // Within 2 weeks = free access
}

// Calculate dates relative to today for testing
const today = new Date();
const in14Days = new Date(today);
in14Days.setDate(today.getDate() + 14);
const in30Days = new Date(today);
in30Days.setDate(today.getDate() + 30);
const in90Days = new Date(today);
in90Days.setDate(today.getDate() + 90);

export const mockArtPrizes: ArtPrize[] = [
  // Example 1: Concours international de céramique (NEW - within 5 days)
  {
    id: '1',
    name: 'Concours international de céramique',
    organizer: 'Ville de Carouge',
    category: 'Wettbewerb',
    deadline: in14Days.toISOString().split('T')[0],
    prizeAmount: 10000,
    benefitDetails: '10.000 CHF',
    region: 'International',
    country: 'Schweiz',
    ageMin: null,
    ageMax: null,
    fee: null,
    description: 'Internationaler Keramikwettbewerb in Carouge, Schweiz.',
    requirements: ['Keramikarbeiten', 'CV', 'Künstlerstatement'],
    website: 'https://carouge.ch/biennale',
    isShortTerm: true,
  },
  // Example 2: Perspektive Bildende Kunst (NEW - within 5 days)
  {
    id: '2',
    name: 'Perspektive Bildende Kunst',
    organizer: 'Kulturstiftung des Bundes',
    category: 'Förderung',
    deadline: in30Days.toISOString().split('T')[0],
    prizeAmount: 5000,
    benefitDetails: '5.000 €',
    region: 'Deutschland',
    country: 'Deutschland',
    ageMin: null,
    ageMax: 40,
    fee: null,
    description: 'Förderung für junge Künstler*innen in allen Bereichen der bildenden Kunst.',
    requirements: ['Portfolio', 'Projektbeschreibung', 'CV'],
    website: 'https://kulturstiftung-des-bundes.de',
    isShortTerm: true,
  },
  // Example 3: Internationaler Schneeskulpturen-Wettbewerb (LOCKED - older than 5 days)
  {
    id: '3',
    name: 'Internationaler Schneeskulpturen-Wettbewerb',
    organizer: 'Stadt Grindelwald',
    category: 'Wettbewerb',
    deadline: in90Days.toISOString().split('T')[0], // Far deadline = treated as "old" entry
    prizeAmount: null,
    benefitDetails: 'Versch. Preisgelder',
    region: 'International',
    country: 'Schweiz',
    ageMin: null,
    ageMax: null,
    fee: null,
    description: 'Internationaler Wettbewerb für Schneeskulpturen in den Schweizer Alpen.',
    requirements: ['Team-Anmeldung', 'Entwurfsskizze', 'CV'],
    website: 'https://grindelwald.ch/skulpturen',
    isShortTerm: false,
  },
  // Additional entries for variety
  {
    id: '4',
    name: 'Kunstpreis der Stadt München',
    organizer: 'Kulturreferat München',
    category: 'Kunstpreis',
    deadline: in14Days.toISOString().split('T')[0],
    prizeAmount: 15000,
    benefitDetails: '1. Preis: 15.000 €',
    region: 'Deutschland',
    country: 'Deutschland',
    ageMin: 18,
    ageMax: 40,
    fee: null,
    description: 'Jährlicher Kunstpreis für aufstrebende Künstler*innen aus Bayern.',
    requirements: ['Wohnsitz in Bayern', 'Portfolio', 'CV'],
    website: 'https://muenchen.de/kunstpreis',
    isShortTerm: true,
  },
  {
    id: '5',
    name: 'Artist Residency Schloss Solitude',
    organizer: 'Akademie Schloss Solitude',
    category: 'Residenz',
    deadline: in30Days.toISOString().split('T')[0],
    prizeAmount: null,
    benefitDetails: '1.200 € / Monat + Studio + Unterkunft',
    region: 'International',
    country: 'Deutschland',
    ageMin: null,
    ageMax: 35,
    fee: null,
    description: '6-12 monatige Residenz mit Studio und Unterkunft.',
    requirements: ['Arbeitsproben', 'Projektvorhaben', 'Empfehlungsschreiben'],
    website: 'https://akademie-solitude.de',
    isShortTerm: true,
  },
  {
    id: '6',
    name: 'Arbeitsstipendium Bildende Kunst',
    organizer: 'Stiftung Kunstfonds',
    category: 'Stipendium',
    deadline: in30Days.toISOString().split('T')[0],
    prizeAmount: 24000,
    benefitDetails: '2.000 € / Monat (12 Monate)',
    region: 'Deutschland',
    country: 'Deutschland',
    ageMin: null,
    ageMax: null,
    fee: null,
    description: '12-monatiges Arbeitsstipendium für bildende Künstler*innen.',
    requirements: ['Projektbeschreibung', 'Portfolio', 'Finanzplan'],
    website: 'https://kunstfonds.de',
    isShortTerm: true,
  },
  {
    id: '7',
    name: 'Gruppenausstellung Junge Kunst',
    organizer: 'Kunstverein Frankfurt',
    category: 'Ausstellung',
    deadline: in14Days.toISOString().split('T')[0],
    prizeAmount: null,
    benefitDetails: 'Katalog + Vernissage',
    region: 'Deutschland',
    country: 'Deutschland',
    ageMin: 18,
    ageMax: 35,
    fee: null,
    description: 'Gruppenausstellung für junge Künstler*innen.',
    requirements: ['Portfolio', 'Motivationsschreiben'],
    website: 'https://kunstverein-frankfurt.de',
    isShortTerm: true,
  },
  {
    id: '8',
    name: 'Kunst am Bau Wettbewerb Berlin',
    organizer: 'Senatsverwaltung Berlin',
    category: 'Kunst am Bau',
    deadline: in30Days.toISOString().split('T')[0],
    prizeAmount: 50000,
    benefitDetails: 'Auftragssumme: 50.000 €',
    region: 'Deutschland',
    country: 'Deutschland',
    ageMin: null,
    ageMax: null,
    fee: null,
    description: 'Kunst am Bau Wettbewerb für ein neues Verwaltungsgebäude.',
    requirements: ['Entwurf', 'Materialkonzept', 'Referenzen'],
    website: 'https://berlin.de/kunstambau',
    isShortTerm: true,
  },
];

export function getCategoryColor(category: Category): string {
  const colors: Record<Category, string> = {
    'Kunstpreis': 'bg-amber-600',
    'Wettbewerb': 'bg-indigo-600',
    'Malerei': 'bg-rose-600',
    'Skulptur': 'bg-stone-600',
    'Fotografie': 'bg-cyan-600',
    'Mixed Media': 'bg-purple-600',
    'Performance': 'bg-pink-600',
    'Installation': 'bg-teal-600',
    'Residenz': 'bg-emerald-600',
    'Förderung': 'bg-blue-600',
    'Stipendium': 'bg-sky-600',
    'Ausstellung': 'bg-orange-600',
    'Kunst am Bau': 'bg-lime-700',
    'Medienkunst': 'bg-violet-600',
    'Keramik': 'bg-amber-700',
  };
  return colors[category];
}

export function isDeadlineSoon(deadline: string): boolean {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 14 && diffDays >= 0;
}

export function formatDeadline(deadline: string, language: string): string {
  const date = new Date(deadline);
  const locales: Record<string, string> = {
    de: 'de-DE',
    en: 'en-GB',
    fr: 'fr-FR',
    es: 'es-ES',
    ko: 'ko-KR',
  };
  return date.toLocaleDateString(locales[language] || 'de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getDaysUntilDeadline(deadline: string): number {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
