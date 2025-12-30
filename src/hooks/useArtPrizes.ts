import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Category } from '@/data/mockArtPrizes';

export interface ArtPrize {
  id: string;
  name: string;
  organizer: string;
  category: Category;
  deadline: string;
  prizeAmount: number | null;
  benefitDetails: string | null; // Flexible text-based benefit description
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

function mapDbPrizeToArtPrize(dbPrize: any): ArtPrize {
  return {
    id: dbPrize.id,
    name: dbPrize.name,
    organizer: dbPrize.organizer,
    category: dbPrize.category as Category,
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
