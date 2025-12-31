import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Category, Sparte } from '@/data/mockArtPrizes';

export interface ArtPrize {
  id: string;
  name: string;
  organizer: string;
  category: Category;
  sparte: Sparte; // Discipline field
  deadline: string;
  prizeAmount: number | null;
  benefitDetails: string | null;
  currency: string;
  region: string;
  country: string;
  ageMin: number | null;
  ageMax: number | null;
  fee: number | null;
  description: string;
  requirements: string[];
  website: string;
  isShortTerm: boolean;
  isArchived: boolean;
  created_at: string;
}

// Format amount with currency
export function formatCurrency(amount: number, currency: string, language: string): string {
  const currencyCode = currency || 'EUR';
  
  if (currencyCode === 'USD') {
    return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  
  // Default EUR formatting
  return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}


function generateBenefitDetails(dbPrize: any): string | null {
  const amount = dbPrize.prize_amount;
  const currency = dbPrize.currency || 'EUR';
  const category = dbPrize.category;
  
  if (!amount && !['Residenz', 'residency', 'Ausstellung', 'exhibition'].includes(category)) {
    return null;
  }
  
  // Format currency symbol
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'CHF' ? 'CHF' : currency === 'USD' ? 'USD' : currency;
  
  // Stipendium / Grant: show monthly breakdown
  if (['Stipendium', 'grant', 'Förderung'].includes(category) && amount) {
    const monthly = Math.round(amount / 12);
    return `${monthly.toLocaleString('de-DE')}${currencySymbol === '€' ? '€' : ' ' + currencySymbol} / Monat (12 Monate)`;
  }
  
  // Residency: show duration + benefits
  if (['Residenz', 'residency'].includes(category)) {
    if (amount) {
      const monthly = Math.round(amount / 6);
      return `${monthly.toLocaleString('de-DE')}${currencySymbol === '€' ? '€' : ' ' + currencySymbol} / Monat + Studio + Unterkunft`;
    }
    return 'Studio + Unterkunft';
  }
  
  // Exhibition: show exhibition benefits
  if (['Ausstellung', 'exhibition'].includes(category)) {
    return amount ? `Ausstellung + ${amount.toLocaleString('de-DE')} ${currencySymbol}` : 'Katalog + Ausstellung';
  }
  
  // Competition / Prize: show prize breakdown
  if (amount) {
    return `Gewinn: ${amount.toLocaleString('de-DE')} ${currencySymbol}`;
  }
  
  return null;
}

// Derive Sparte from category if not a proper editorial category
function deriveSparteFromCategory(category: string): Sparte {
  const spartenMap: Record<string, Sparte> = {
    'Malerei': 'Malerei',
    'Skulptur': 'Skulptur',
    'Fotografie': 'Fotografie',
    'Mixed Media': 'Mixed Media',
    'Performance': 'Performance',
    'Installation': 'Installation',
    'Medienkunst': 'Medienkunst',
    'painting': 'Malerei',
    'sculpture': 'Skulptur',
    'photography': 'Fotografie',
    'mixed': 'Mixed Media',
    'media': 'Medienkunst',
    'performance': 'Performance',
  };
  return spartenMap[category] || 'Alle Bereiche';
}

// Map category to proper editorial category
function mapToEditorialCategory(category: string): Category {
  const categoryMap: Record<string, Category> = {
    'Kunstpreis': 'Kunstpreis',
    'Wettbewerb': 'Wettbewerb',
    'Stipendium': 'Stipendium',
    'Förderung': 'Förderung',
    'Residenz': 'Residenz',
    'Ausstellung': 'Ausstellung',
    'Kunst am Bau': 'Kunst am Bau',
    // English mappings
    'grant': 'Förderung',
    'residency': 'Residenz',
    'exhibition': 'Ausstellung',
    'public_art': 'Kunst am Bau',
  };
  return categoryMap[category] || 'Wettbewerb';
}

function mapDbPrizeToArtPrize(dbPrize: any): ArtPrize {
  const editorialCategory = mapToEditorialCategory(dbPrize.category);
  const sparte = deriveSparteFromCategory(dbPrize.category);
  
  return {
    id: dbPrize.id,
    name: dbPrize.name,
    organizer: dbPrize.organizer,
    category: editorialCategory,
    sparte: sparte,
    deadline: dbPrize.deadline,
    prizeAmount: dbPrize.prize_amount,
    benefitDetails: generateBenefitDetails(dbPrize),
    currency: dbPrize.currency || 'EUR',
    region: dbPrize.region,
    country: dbPrize.country,
    ageMin: dbPrize.age_min,
    ageMax: dbPrize.age_max,
    fee: dbPrize.fee,
    description: dbPrize.description,
    requirements: dbPrize.requirements || [],
    website: dbPrize.website,
    isShortTerm: dbPrize.is_short_term,
    isArchived: dbPrize.is_archived,
    created_at: dbPrize.created_at,
  };
}

export function useArtPrizes(archived: boolean = false) {
  return useQuery({
    queryKey: ['art-prizes', archived],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('art_prizes')
        .select('*')
        .eq('is_archived', archived)
        .order('deadline', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapDbPrizeToArtPrize);
    },
  });
}

export function useArtPrize(id: string | null) {
  return useQuery({
    queryKey: ['art-prize', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('art_prizes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data ? mapDbPrizeToArtPrize(data) : null;
    },
    enabled: !!id,
  });
}
