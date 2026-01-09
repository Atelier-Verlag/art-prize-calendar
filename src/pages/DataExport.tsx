import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function DataExport() {
  const [data, setData] = useState<Record<string, unknown[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [artPrizes, tenders, seminars, scraperSources] = await Promise.all([
          supabase.from('art_prizes').select('*'),
          supabase.from('tenders').select('*'),
          supabase.from('seminars').select('*'),
          supabase.from('scraper_sources').select('*'),
        ]);

        setData({
          art_prizes: artPrizes.data || [],
          tenders: tenders.data || [],
          seminars: seminars.data || [],
          scraper_sources: scraperSources.data || [],
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) return <pre>Loading...</pre>;
  if (error) return <pre>Error: {error}</pre>;

  return (
    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '1rem', fontFamily: 'monospace', fontSize: '12px' }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
