-- Create enum for art prize categories
CREATE TYPE public.art_category AS ENUM (
  'painting', 
  'sculpture', 
  'media', 
  'photography', 
  'performance', 
  'mixed', 
  'residency', 
  'grant',
  'exhibition',
  'public_art'
);

-- Create art prizes table
CREATE TABLE public.art_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organizer TEXT NOT NULL,
  category art_category NOT NULL,
  deadline DATE NOT NULL,
  prize_amount INTEGER,
  region TEXT NOT NULL,
  country TEXT NOT NULL,
  age_min INTEGER,
  age_max INTEGER,
  fee INTEGER,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  website TEXT NOT NULL,
  is_short_term BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.art_prizes ENABLE ROW LEVEL SECURITY;

-- Public read access for all prizes (catalog data)
CREATE POLICY "Art prizes are publicly readable"
ON public.art_prizes
FOR SELECT
USING (true);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_art_prizes_updated_at
BEFORE UPDATE ON public.art_prizes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data (mock prizes)
INSERT INTO public.art_prizes (name, organizer, category, deadline, prize_amount, region, country, age_min, age_max, fee, description, requirements, website, is_short_term) VALUES
('Kunstpreis der Stadt München', 'Kulturreferat München', 'painting', '2025-01-15', 15000, 'Bayern', 'Deutschland', 18, 40, NULL, 'Der Kunstpreis der Stadt München wird jährlich an aufstrebende Künstler*innen verliehen, die in Bayern leben und arbeiten.', ARRAY['Wohnsitz in Bayern', 'Künstlerischer Lebenslauf', '5-10 Arbeitsproben'], 'https://muenchen.de/kunstpreis', true),
('International Sculpture Prize Vienna', 'Akademie der bildenden Künste Wien', 'sculpture', '2025-02-28', 25000, 'International', 'Österreich', NULL, NULL, 50, 'Prestigious international prize for contemporary sculptors working in any medium.', ARRAY['Portfolio', 'Artist statement', 'CV'], 'https://akbild.ac.at/prize', false),
('Digital Arts Fellowship', 'ZKM Karlsruhe', 'media', '2025-01-20', NULL, 'International', 'Deutschland', NULL, 35, NULL, '3-monatige Residenz mit Stipendium für Medienkünstler*innen.', ARRAY['Projektvorschlag', 'Portfolio', 'Referenzen'], 'https://zkm.de/fellowship', true),
('European Photography Award', 'Fotomuseum Winterthur', 'photography', '2025-03-15', 20000, 'Europa', 'Schweiz', 21, 45, 35, 'Award for emerging photographers exploring contemporary themes.', ARRAY['Photo series (10-20 images)', 'Statement', 'Biography'], 'https://fotomuseum.ch/award', false),
('Performance Art Grant Berlin', 'Hebbel am Ufer', 'performance', '2025-01-10', 8000, 'International', 'Deutschland', NULL, NULL, NULL, 'Projektförderung für Performance-Künstler*innen zur Entwicklung neuer Arbeiten.', ARRAY['Projektkonzept', 'Video-Dokumentation', 'Budget'], 'https://hebbel-am-ufer.de/grants', true),
('Mixed Media Innovation Prize', 'Hamburger Kunsthalle', 'mixed', '2025-04-01', 12000, 'Deutschland', 'Deutschland', 25, 50, 25, 'Preis für innovative Arbeiten, die verschiedene Medien kombinieren.', ARRAY['Werkdokumentation', 'Konzeptbeschreibung', 'CV'], 'https://hamburger-kunsthalle.de/preis', false),
('Artist Residency Schloss Solitude', 'Akademie Schloss Solitude', 'residency', '2025-02-15', NULL, 'International', 'Deutschland', NULL, 35, NULL, '6-12 monatige Residenz mit Studio, Unterkunft und monatlichem Stipendium.', ARRAY['Arbeitsproben', 'Projektvorhaben', 'Empfehlungsschreiben'], 'https://akademie-solitude.de', false),
('Arbeitsstipendium Bildende Kunst', 'Kulturstiftung des Bundes', 'grant', '2025-01-31', 24000, 'Deutschland', 'Deutschland', NULL, NULL, NULL, '12-monatiges Arbeitsstipendium zur Realisierung eines künstlerischen Projekts.', ARRAY['Projektbeschreibung', 'Portfolio', 'Finanzplan'], 'https://kulturstiftung-des-bundes.de', true),
('Prix de Rome - Visual Arts', 'Académie de France à Rome', 'painting', '2025-05-01', 30000, 'International', 'Frankreich', NULL, 45, NULL, 'Prestigious residency at Villa Medici with significant prize money.', ARRAY['Dossier artistique', 'Projet de séjour', 'Lettres de recommandation'], 'https://villamedici.it/prix-de-rome', false),
('New Media Art Award Korea', 'Nam June Paik Art Center', 'media', '2025-03-30', 50000, 'International', 'Südkorea', NULL, NULL, 40, 'Major international award for new media and technology-based art.', ARRAY['Project documentation', 'Technical specifications', 'Artist CV'], 'https://njpartcenter.kr/award', false),
('Ausstellung Junge Kunst Hamburg', 'Kunsthalle Hamburg', 'exhibition', '2025-02-10', 5000, 'Deutschland', 'Deutschland', 18, 35, NULL, 'Gruppenausstellung für aufstrebende Künstler*innen unter 35 Jahren.', ARRAY['Portfolio', 'Künstlerstatement', 'Lebenslauf'], 'https://hamburger-kunsthalle.de/jungekunst', true),
('Kunst am Bau Wettbewerb Berlin', 'Senatsverwaltung für Kultur Berlin', 'public_art', '2025-03-01', 100000, 'Berlin', 'Deutschland', NULL, NULL, NULL, 'Gestaltung der Außenfassade für ein neues öffentliches Gebäude in Berlin.', ARRAY['Entwurf', 'Materialkonzept', 'Kostenvoranschlag', 'Referenzprojekte'], 'https://berlin.de/kunstambau', false);