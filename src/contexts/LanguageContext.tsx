import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'de' | 'en' | 'fr' | 'es' | 'ko';

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

export const translations: Translations = {
  // Header
  'nav.calendar': { de: 'Kalender', en: 'Calendar', fr: 'Calendrier', es: 'Calendario', ko: '캘린더' },
  'nav.archive': { de: 'Archiv', en: 'Archive', fr: 'Archives', es: 'Archivo', ko: '아카이브' },
  'nav.ai': { de: 'KI-Berater', en: 'AI Consultant', fr: 'Consultant IA', es: 'Consultor IA', ko: 'AI 컨설턴트' },
  'nav.pricing': { de: 'Preise', en: 'Pricing', fr: 'Tarifs', es: 'Precios', ko: '요금' },
  'nav.login': { de: 'Anmelden', en: 'Login', fr: 'Connexion', es: 'Iniciar sesión', ko: '로그인' },
  
  // Hero
  'hero.banner': { 
    de: 'Nutzen Sie die nächste große Chance als Pro-Künstler.', 
    en: 'Seize your next big opportunity as a professional artist.',
    fr: 'Saisissez votre prochaine grande opportunité en tant qu\'artiste professionnel.',
    es: 'Aprovecha tu próxima gran oportunidad como artista profesional.',
    ko: '전문 아티스트로서 다음 큰 기회를 잡으세요.'
  },
  'hero.title.part1': { de: 'Der aktuelle ', en: 'The current ', fr: 'Le ', es: 'El actual ', ko: '현재 ' },
  'hero.title.highlight': { de: 'Kunstpreiskalender', en: 'Art Prize Calendar', fr: 'Calendrier des Prix d\'Art', es: 'Calendario de Premios de Arte', ko: '예술상 캘린더' },
  'hero.title.part2': { 
    de: ' für deutsche & internationale Ausschreibungen', 
    en: ' for German & international calls',
    fr: ' pour les appels allemands et internationaux',
    es: ' para convocatorias alemanas e internacionales',
    ko: ' 독일 및 국제 공모전'
  },
  'hero.subtitle': { 
    de: 'Der umfassende Ausschreibungskalender für Künstlerinnen und Künstler — sorgfältig kuratiert.', 
    en: 'The comprehensive call calendar for artists — carefully curated.',
    fr: 'Le calendrier complet des appels pour artistes — soigneusement sélectionné.',
    es: 'El calendario completo de convocatorias para artistas — cuidadosamente curado.',
    ko: '아티스트를 위한 종합 공모전 캘린더 — 세심하게 큐레이션.'
  },
  'hero.cta': { de: 'Jetzt starten', en: 'Get started', fr: 'Commencer', es: 'Comenzar', ko: '시작하기' },
  'hero.cta.secondary': { de: 'Mehr erfahren', en: 'Learn more', fr: 'En savoir plus', es: 'Saber más', ko: '더 알아보기' },

  // Calendar
  'calendar.deadline': { de: 'FRIST', en: 'DEADLINE', fr: 'DATE LIMITE', es: 'FECHA LÍMITE', ko: '마감일' },
  'calendar.prize': { de: 'Preisgeld', en: 'Prize money', fr: 'Prix', es: 'Premio', ko: '상금' },
  'calendar.region': { de: 'Region', en: 'Region', fr: 'Région', es: 'Región', ko: '지역' },
  'calendar.age': { de: 'Alter', en: 'Age', fr: 'Âge', es: 'Edad', ko: '연령' },
  'calendar.fee': { de: 'Gebühr', en: 'Fee', fr: 'Frais', es: 'Tarifa', ko: '수수료' },
  'calendar.details': { de: 'Details ansehen', en: 'View details', fr: 'Voir les détails', es: 'Ver detalles', ko: '세부정보 보기' },
  'calendar.locked': { de: 'Pro-Zugang erforderlich', en: 'Pro access required', fr: 'Accès Pro requis', es: 'Acceso Pro requerido', ko: 'Pro 액세스 필요' },
  'calendar.filter': { de: 'Filter', en: 'Filter', fr: 'Filtrer', es: 'Filtrar', ko: '필터' },
  'calendar.all': { de: 'Alle', en: 'All', fr: 'Tous', es: 'Todos', ko: '전체' },

  // Categories
  'category.painting': { de: 'Malerei', en: 'Painting', fr: 'Peinture', es: 'Pintura', ko: '회화' },
  'category.sculpture': { de: 'Skulptur', en: 'Sculpture', fr: 'Sculpture', es: 'Escultura', ko: '조각' },
  'category.media': { de: 'Medienkunst', en: 'Media Art', fr: 'Art Numérique', es: 'Arte Digital', ko: '미디어 아트' },
  'category.photography': { de: 'Fotografie', en: 'Photography', fr: 'Photographie', es: 'Fotografía', ko: '사진' },
  'category.performance': { de: 'Performance', en: 'Performance', fr: 'Performance', es: 'Performance', ko: '퍼포먼스' },
  'category.mixed': { de: 'Mixed Media', en: 'Mixed Media', fr: 'Techniques Mixtes', es: 'Técnica Mixta', ko: '복합 매체' },
  'category.residency': { de: 'Residenz', en: 'Residency', fr: 'Résidence', es: 'Residencia', ko: '레지던시' },
  'category.grant': { de: 'Stipendium', en: 'Grant', fr: 'Bourse', es: 'Beca', ko: '장학금' },
  'category.exhibition': { de: 'Ausstellung', en: 'Exhibition', fr: 'Exposition', es: 'Exposición', ko: '전시' },
  'category.public_art': { de: 'Kunst am Bau', en: 'Public Art', fr: 'Art Public', es: 'Arte Público', ko: '공공 예술' },

  // Pricing
  'pricing.title': { de: 'Einfache Preise', en: 'Simple Pricing', fr: 'Tarifs Simples', es: 'Precios Simples', ko: '간단한 요금' },
  'pricing.subtitle': { de: 'Wählen Sie den Plan, der zu Ihnen passt', en: 'Choose the plan that fits you', fr: 'Choisissez le plan qui vous convient', es: 'Elige el plan que te convenga', ko: '맞는 플랜을 선택하세요' },
  'pricing.free': { de: 'Kostenlos', en: 'Free', fr: 'Gratuit', es: 'Gratis', ko: '무료' },
  'pricing.free.desc': { de: 'Nur kurzfristige Ausschreibungen', en: 'Short-term calls only', fr: 'Appels à court terme uniquement', es: 'Solo convocatorias a corto plazo', ko: '단기 공모만' },
  'pricing.monthly': { de: 'Monatspass', en: 'Monthly Pass', fr: 'Pass Mensuel', es: 'Pase Mensual', ko: '월간 패스' },
  'pricing.yearly': { de: 'Jahrespass', en: 'Yearly Pass', fr: 'Pass Annuel', es: 'Pase Anual', ko: '연간 패스' },
  'pricing.yearly.save': { de: 'Spare 19%', en: 'Save 19%', fr: 'Économisez 19%', es: 'Ahorra 19%', ko: '19% 절약' },
  'pricing.perMonth': { de: '/Monat', en: '/month', fr: '/mois', es: '/mes', ko: '/월' },
  'pricing.perYear': { de: '/Jahr', en: '/year', fr: '/an', es: '/año', ko: '/년' },
  'pricing.subscribe': { de: 'Abonnieren', en: 'Subscribe', fr: 'S\'abonner', es: 'Suscribirse', ko: '구독하기' },
  'pricing.feature.all': { de: 'Alle Ausschreibungen', en: 'All calls', fr: 'Tous les appels', es: 'Todas las convocatorias', ko: '모든 공모' },
  'pricing.feature.ai': { de: 'KI-Bewerbungsassistent', en: 'AI Application Assistant', fr: 'Assistant IA', es: 'Asistente IA', ko: 'AI 지원 도우미' },
  'pricing.feature.archive': { de: 'Archiv-Zugang', en: 'Archive access', fr: 'Accès aux archives', es: 'Acceso al archivo', ko: '아카이브 액세스' },

  // Footer
  'footer.imprint': { de: 'Impressum', en: 'Imprint', fr: 'Mentions légales', es: 'Aviso legal', ko: '법적 고지' },
  'footer.privacy': { de: 'Datenschutz', en: 'Privacy Policy', fr: 'Politique de confidentialité', es: 'Política de privacidad', ko: '개인정보 처리방침' },
  'footer.disclaimer': { de: 'Haftungsausschluss', en: 'Disclaimer', fr: 'Avertissement', es: 'Descargo', ko: '면책조항' },
  'footer.sitemap': { de: 'Sitemap', en: 'Sitemap', fr: 'Plan du site', es: 'Mapa del sitio', ko: '사이트맵' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('de');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
