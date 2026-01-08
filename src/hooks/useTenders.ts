import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Tender {
  id: string;
  created_at: string;
  title: string;
  organizer: string | null;
  description: string | null;
  category: string | null;
  disciplines: string[] | null;
  deadline: string | null;
  prize_detail: string | null;
  entry_fee: number | null;
  artist_fee: boolean | null;
  geo_scope: string | null;
  location: string | null;
  application_link: string | null;
  age_limit: string | null;
}

export function useTenders() {
  return useQuery({
    queryKey: ['tenders'],
    queryFn: async (): Promise<Tender[]> => {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .gte('deadline', new Date().toISOString().split('T')[0])
        .order('deadline', { ascending: true });

      if (error) {
        console.error('Error fetching tenders:', error);
        throw error;
      }

      return data || [];
    },
  });
}

export function useTender(id: string | null) {
  return useQuery({
    queryKey: ['tender', id],
    queryFn: async (): Promise<Tender | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching tender:', error);
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });
}
