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
  | 'Medienkunst';

export interface ArtPrize {
  id: string;
  name: string;
  organizer: string;
  category: Category;
  deadline: string;
  prizeAmount: number | null;
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

export const mockArtPrizes: ArtPrize[] = [
  {
    id: '1',
    name: 'Kunstpreis der Stadt München',
    organizer: 'Kulturreferat München',
    category: 'Malerei',
    deadline: '2025-01-15',
    prizeAmount: 15000,
    region: 'Bayern',
    country: 'Deutschland',
    ageMin: 18,
    ageMax: 40,
    fee: null,
    description: 'Der Kunstpreis der Stadt München wird jährlich an aufstrebende Künstler*innen verliehen, die in Bayern leben und arbeiten.',
    requirements: ['Wohnsitz in Bayern', 'Künstlerischer Lebenslauf', '5-10 Arbeitsproben'],
    website: 'https://muenchen.de/kunstpreis',
    isShortTerm: true,
  },
  {
    id: '2',
    name: 'International Sculpture Prize Vienna',
    organizer: 'Akademie der bildenden Künste Wien',
    category: 'Skulptur',
    deadline: '2025-02-28',
    prizeAmount: 25000,
    region: 'International',
    country: 'Österreich',
    ageMin: null,
    ageMax: null,
    fee: 50,
    description: 'Prestigious international prize for contemporary sculptors working in any medium.',
    requirements: ['Portfolio', 'Artist statement', 'CV'],
    website: 'https://akbild.ac.at/prize',
    isShortTerm: false,
  },
  {
    id: '3',
    name: 'Digital Arts Fellowship',
    organizer: 'ZKM Karlsruhe',
    category: 'Medienkunst',
    deadline: '2025-01-20',
    prizeAmount: null,
    region: 'International',
    country: 'Deutschland',
    ageMin: null,
    ageMax: 35,
    fee: null,
    description: '3-monatige Residenz mit Stipendium für Medienkünstler*innen.',
    requirements: ['Projektvorschlag', 'Portfolio', 'Referenzen'],
    website: 'https://zkm.de/fellowship',
    isShortTerm: true,
  },
  {
    id: '4',
    name: 'European Photography Award',
    organizer: 'Fotomuseum Winterthur',
    category: 'Fotografie',
    deadline: '2025-03-15',
    prizeAmount: 20000,
    region: 'Europa',
    country: 'Schweiz',
    ageMin: 21,
    ageMax: 45,
    fee: 35,
    description: 'Award for emerging photographers exploring contemporary themes.',
    requirements: ['Photo series (10-20 images)', 'Statement', 'Biography'],
    website: 'https://fotomuseum.ch/award',
    isShortTerm: false,
  },
  {
    id: '5',
    name: 'Performance Art Grant Berlin',
    organizer: 'Hebbel am Ufer',
    category: 'Performance',
    deadline: '2025-01-10',
    prizeAmount: 8000,
    region: 'International',
    country: 'Deutschland',
    ageMin: null,
    ageMax: null,
    fee: null,
    description: 'Projektförderung für Performance-Künstler*innen zur Entwicklung neuer Arbeiten.',
    requirements: ['Projektkonzept', 'Video-Dokumentation', 'Budget'],
    website: 'https://hebbel-am-ufer.de/grants',
    isShortTerm: true,
  },
  {
    id: '6',
    name: 'Mixed Media Innovation Prize',
    organizer: 'Hamburger Kunsthalle',
    category: 'Mixed Media',
    deadline: '2025-04-01',
    prizeAmount: 12000,
    region: 'Deutschland',
    country: 'Deutschland',
    ageMin: 25,
    ageMax: 50,
    fee: 25,
    description: 'Preis für innovative Arbeiten, die verschiedene Medien kombinieren.',
    requirements: ['Werkdokumentation', 'Konzeptbeschreibung', 'CV'],
    website: 'https://hamburger-kunsthalle.de/preis',
    isShortTerm: false,
  },
  {
    id: '7',
    name: 'Artist Residency Schloss Solitude',
    organizer: 'Akademie Schloss Solitude',
    category: 'Residenz',
    deadline: '2025-02-15',
    prizeAmount: null,
    region: 'International',
    country: 'Deutschland',
    ageMin: null,
    ageMax: 35,
    fee: null,
    description: '6-12 monatige Residenz mit Studio, Unterkunft und monatlichem Stipendium.',
    requirements: ['Arbeitsproben', 'Projektvorhaben', 'Empfehlungsschreiben'],
    website: 'https://akademie-solitude.de',
    isShortTerm: false,
  },
  {
    id: '8',
    name: 'Arbeitsstipendium Bildende Kunst',
    organizer: 'Kulturstiftung des Bundes',
    category: 'Förderung',
    deadline: '2025-01-31',
    prizeAmount: 24000,
    region: 'Deutschland',
    country: 'Deutschland',
    ageMin: null,
    ageMax: null,
    fee: null,
    description: '12-monatiges Arbeitsstipendium zur Realisierung eines künstlerischen Projekts.',
    requirements: ['Projektbeschreibung', 'Portfolio', 'Finanzplan'],
    website: 'https://kulturstiftung-des-bundes.de',
    isShortTerm: true,
  },
  {
    id: '9',
    name: 'Prix de Rome - Visual Arts',
    organizer: 'Académie de France à Rome',
    category: 'Malerei',
    deadline: '2025-05-01',
    prizeAmount: 30000,
    region: 'International',
    country: 'Frankreich',
    ageMin: null,
    ageMax: 45,
    fee: null,
    description: 'Prestigious residency at Villa Medici with significant prize money.',
    requirements: ['Dossier artistique', 'Projet de séjour', 'Lettres de recommandation'],
    website: 'https://villamedici.it/prix-de-rome',
    isShortTerm: false,
  },
  {
    id: '10',
    name: 'New Media Art Award Korea',
    organizer: 'Nam June Paik Art Center',
    category: 'Medienkunst',
    deadline: '2025-03-30',
    prizeAmount: 50000,
    region: 'International',
    country: 'Südkorea',
    ageMin: null,
    ageMax: null,
    fee: 40,
    description: 'Major international award for new media and technology-based art.',
    requirements: ['Project documentation', 'Technical specifications', 'Artist CV'],
    website: 'https://njpartcenter.kr/award',
    isShortTerm: false,
  },
];

export function getCategoryColor(category: Category): string {
  const colors: Record<Category, string> = {
    'Kunstpreis': 'category-kunstpreis',
    'Wettbewerb': 'category-wettbewerb',
    'Malerei': 'category-painting',
    'Skulptur': 'category-sculpture',
    'Fotografie': 'category-photography',
    'Mixed Media': 'category-mixed',
    'Performance': 'category-performance',
    'Installation': 'category-installation',
    'Residenz': 'category-residency',
    'Förderung': 'category-grant',
    'Stipendium': 'category-grant',
    'Ausstellung': 'category-exhibition',
    'Kunst am Bau': 'category-public-art',
    'Medienkunst': 'category-media',
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
