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

function mapDbPrizeToArtPrize(dbPrize: any): ArtPrize {
  return {
    id: dbPrize.id,
    name: dbPrize.name,
    organizer: dbPrize.organizer,
    category: dbPrize.category as Category,
    deadline: dbPrize.deadline,
    prizeAmount: dbPrize.prize_amount,
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
