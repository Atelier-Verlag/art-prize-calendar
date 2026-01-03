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
  'nav.subscriptions': { de: 'Abonnements', en: 'Subscriptions', fr: 'Abonnements', es: 'Suscripciones', ko: '구독' },
  'nav.login': { de: 'Anmelden', en: 'Login', fr: 'Connexion', es: 'Iniciar sesión', ko: '로그인' },
  
  // Auth
  'auth.login': { de: 'Anmelden', en: 'Login', fr: 'Connexion', es: 'Iniciar sesión', ko: '로그인' },
  'auth.signup': { de: 'Registrieren', en: 'Sign up', fr: 'S\'inscrire', es: 'Registrarse', ko: '회원가입' },
  'auth.email': { de: 'E-Mail-Adresse', en: 'Email address', fr: 'Adresse e-mail', es: 'Correo electrónico', ko: '이메일 주소' },
  'auth.password': { de: 'Passwort', en: 'Password', fr: 'Mot de passe', es: 'Contraseña', ko: '비밀번호' },
  'auth.logout': { de: 'Abmelden', en: 'Logout', fr: 'Déconnexion', es: 'Cerrar sesión', ko: '로그아웃' },
  'auth.noAccount': { de: 'Noch kein Konto?', en: 'No account yet?', fr: 'Pas encore de compte?', es: '¿Sin cuenta?', ko: '계정이 없으신가요?' },
  'auth.hasAccount': { de: 'Bereits registriert?', en: 'Already have an account?', fr: 'Déjà inscrit?', es: '¿Ya tienes cuenta?', ko: '이미 계정이 있으신가요?' },
  'auth.error.invalid': { de: 'Ungültige Anmeldedaten', en: 'Invalid credentials', fr: 'Identifiants invalides', es: 'Credenciales inválidas', ko: '잘못된 자격 증명' },
  'auth.error.exists': { de: 'E-Mail bereits registriert', en: 'Email already registered', fr: 'Email déjà enregistré', es: 'Email ya registrado', ko: '이미 등록된 이메일' },
  'auth.error.password': { de: 'Passwort muss mind. 6 Zeichen haben', en: 'Password must be at least 6 characters', fr: 'Le mot de passe doit contenir au moins 6 caractères', es: 'La contraseña debe tener al menos 6 caracteres', ko: '비밀번호는 최소 6자 이상이어야 합니다' },

  // Premium / Paywall
  'premium.lockedTitle': { de: '🔒 Premium Ausschreibung', en: '🔒 Premium Call', fr: '🔒 Appel Premium', es: '🔒 Convocatoria Premium', ko: '🔒 프리미엄 공모' },
  'premium.unlock': { de: 'Jetzt freischalten', en: 'Unlock now', fr: 'Débloquer', es: 'Desbloquear', ko: '지금 잠금 해제' },
  'premium.upgrade': { de: 'Pro werden', en: 'Go Pro', fr: 'Devenir Pro', es: 'Ser Pro', ko: 'Pro 되기' },
  'premium.badge': { de: 'Pro', en: 'Pro', fr: 'Pro', es: 'Pro', ko: 'Pro' },
  'premium.loginFirst': { de: 'Bitte erst anmelden', en: 'Please login first', fr: 'Veuillez d\'abord vous connecter', es: 'Por favor inicia sesión', ko: '먼저 로그인해주세요' },
  'premium.hiddenInfo': { de: 'Weitere Details nur für Pro-Mitglieder', en: 'More details for Pro members only', fr: 'Plus de détails pour les membres Pro', es: 'Más detalles solo para miembros Pro', ko: 'Pro 회원만 상세정보 확인 가능' },
  
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
    de: 'Der umfassende Ausschreibungskalender für Künstlerinnen und Künstler — sorgfältig kuratiert', 
    en: 'The comprehensive call calendar for artists — carefully curated',
    fr: 'Le calendrier complet des appels pour artistes — soigneusement sélectionné',
    es: 'El calendario completo de convocatorias para artistas — cuidadosamente curado',
    ko: '아티스트를 위한 종합 공모전 캘린더 — 세심하게 큐레이션'
  },
  'hero.subtitleSuffix': { 
    de: 'umfassend und laufend aktualisiert.', 
    en: 'comprehensive and continuously updated.',
    fr: 'complet et mis à jour en continu.',
    es: 'completo y actualizado continuamente.',
    ko: '종합적이고 지속적으로 업데이트됩니다.'
  },
  'hero.cta': { de: 'Jetzt starten', en: 'Get started', fr: 'Commencer', es: 'Comenzar', ko: '시작하기' },
  'hero.cta.secondary': { de: 'Mehr erfahren', en: 'Learn more', fr: 'En savoir plus', es: 'Saber más', ko: '더 알아보기' },

  // Calendar
  'calendar.deadline': { de: 'Deadline', en: 'Deadline', fr: 'Date limite', es: 'Fecha límite', ko: '마감일' },
  'calendar.prize': { de: 'Preisgeld', en: 'Prize money', fr: 'Prix', es: 'Premio', ko: '상금' },
  'calendar.region': { de: 'Region', en: 'Region', fr: 'Région', es: 'Región', ko: '지역' },
  'calendar.age': { de: 'Alter', en: 'Age', fr: 'Âge', es: 'Edad', ko: '연령' },
  'calendar.fee': { de: 'Gebühr', en: 'Fee', fr: 'Frais', es: 'Tarifa', ko: '수수료' },
  'calendar.details': { de: 'Details ansehen', en: 'View details', fr: 'Voir les détails', es: 'Ver detalles', ko: '세부정보 보기' },
  'calendar.locked': { de: 'Pro-Zugang erforderlich', en: 'Pro access required', fr: 'Accès Pro requis', es: 'Acceso Pro requerido', ko: 'Pro 액세스 필요' },
  'calendar.filter': { de: 'Filter', en: 'Filter', fr: 'Filtrer', es: 'Filtrar', ko: '필터' },
  'calendar.all': { de: 'Alle', en: 'All', fr: 'Tous', es: 'Todos', ko: '전체' },
  'calendar.sparte': { de: 'Sparte', en: 'Discipline', fr: 'Discipline', es: 'Disciplina', ko: '분야' },
  'calendar.requirement': { de: 'Voraussetzung', en: 'Requirement', fr: 'Condition', es: 'Requisito', ko: '요구사항' },
  'calendar.prizeLeistung': { de: 'Preis / Leistung', en: 'Prize / Benefit', fr: 'Prix / Avantage', es: 'Premio / Beneficio', ko: '상금 / 혜택' },
  'calendar.noLimit': { de: 'Keine Begrenzung', en: 'No limit', fr: 'Aucune limite', es: 'Sin límite', ko: '제한 없음' },
  'calendar.allAreas': { de: 'Alle Bereiche', en: 'All areas', fr: 'Tous domaines', es: 'Todas áreas', ko: '전체 분야' },
  'calendar.none': { de: 'Keine', en: 'None', fr: 'Aucune', es: 'Ninguno', ko: '없음' },
  'calendar.onRequest': { de: 'Auf Anfrage', en: 'On request', fr: 'Sur demande', es: 'Bajo petición', ko: '문의' },
  'calendar.proOnly': { de: 'Nur für Pro-Künstler', en: 'Pro artists only', fr: 'Artistes Pro uniquement', es: 'Solo artistas Pro', ko: 'Pro 아티스트 전용' },
  'calendar.unlock': { de: 'Freischalten', en: 'Unlock', fr: 'Débloquer', es: 'Desbloquear', ko: '잠금 해제' },
  'calendar.feeWarning': { de: 'Gebühr', en: 'Fee', fr: 'Frais', es: 'Tarifa', ko: '수수료' },

  // Card labels
  'card.sparte': { de: 'Sparte', en: 'Discipline', fr: 'Discipline', es: 'Disciplina', ko: '분야' },
  'card.age': { de: 'Alter', en: 'Age', fr: 'Âge', es: 'Edad', ko: '연령' },
  'card.requirement': { de: 'Voraussetzung', en: 'Requirement', fr: 'Condition', es: 'Requisito', ko: '요구사항' },
  'card.prizeLabel': { de: 'Preis / Leistung', en: 'Prize / Benefit', fr: 'Prix / Avantage', es: 'Premio / Beneficio', ko: '상금 / 혜택' },
  'card.noRestriction': { de: 'Keine Begrenzung', en: 'No limit', fr: 'Aucune limite', es: 'Sin límite', ko: '제한 없음' },
  'card.none': { de: 'Keine', en: 'None', fr: 'Aucune', es: 'Ninguno', ko: '없음' },
  'card.noInfo': { de: 'Auf Anfrage', en: 'On request', fr: 'Sur demande', es: 'Bajo petición', ko: '문의' },
  'card.details': { de: 'Details ansehen', en: 'View details', fr: 'Voir les détails', es: 'Ver detalles', ko: '세부정보 보기' },
  'card.proOnly': { de: 'Nur für Pro-Künstler', en: 'Pro artists only', fr: 'Artistes Pro uniquement', es: 'Solo artistas Pro', ko: 'Pro 아티스트 전용' },
  'card.unlock': { de: 'Freischalten', en: 'Unlock', fr: 'Débloquer', es: 'Desbloquear', ko: '잠금 해제' },

  // Filter categories (for buttons)
  'filter.all': { de: 'Alle', en: 'All', fr: 'Tous', es: 'Todos', ko: '전체' },
  'filter.Kunstpreis': { de: 'Kunstpreise', en: 'Art Prizes', fr: 'Prix d\'Art', es: 'Premios de Arte', ko: '예술상' },
  'filter.Wettbewerb': { de: 'Wettbewerbe', en: 'Competitions', fr: 'Concours', es: 'Concursos', ko: '경쟁' },
  'filter.Stipendium': { de: 'Stipendien', en: 'Grants', fr: 'Bourses', es: 'Becas', ko: '장학금' },
  'filter.Förderung': { de: 'Förderung', en: 'Funding', fr: 'Financement', es: 'Financiación', ko: '지원금' },
  'filter.Residenz': { de: 'Residencies', en: 'Residencies', fr: 'Résidences', es: 'Residencias', ko: '레지던시' },
  'filter.Ausstellung': { de: 'Ausstellungsmöglichkeiten', en: 'Exhibition Opportunities', fr: 'Opportunités d\'exposition', es: 'Oportunidades de exposición', ko: '전시 기회' },
  'filter.Kunst am Bau': { de: 'Kunst am Bau', en: 'Public Art', fr: 'Art Public', es: 'Arte Público', ko: '공공 예술' },

  // Categories (for card header)
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
  'category.Kunstpreis': { de: 'Kunstpreis', en: 'Art Prize', fr: 'Prix d\'Art', es: 'Premio de Arte', ko: '예술상' },
  'category.Wettbewerb': { de: 'Wettbewerb', en: 'Competition', fr: 'Concours', es: 'Concurso', ko: '경쟁' },
  'category.Stipendium': { de: 'Stipendium', en: 'Grant', fr: 'Bourse', es: 'Beca', ko: '장학금' },
  'category.Förderung': { de: 'Förderung', en: 'Funding', fr: 'Financement', es: 'Financiación', ko: '지원금' },
  'category.Residenz': { de: 'Residenz', en: 'Residency', fr: 'Résidence', es: 'Residencia', ko: '레지던시' },
  'category.Ausstellung': { de: 'Ausstellung', en: 'Exhibition', fr: 'Exposition', es: 'Exposición', ko: '전시' },
  'category.Kunst am Bau': { de: 'Kunst am Bau', en: 'Public Art', fr: 'Art Public', es: 'Arte Público', ko: '공공 예술' },

  // AI Consultant
  'ai.badge': { de: 'KI-gestützt', en: 'AI-powered', fr: 'Propulsé par IA', es: 'Impulsado por IA', ko: 'AI 기반' },
  'ai.description': { de: 'Nutzen Sie unsere KI, um überzeugende Bewerbungsschreiben zu erstellen und Ihren Bewerbungsprozess zu optimieren.', en: 'Use our AI to create compelling application letters and optimize your application process.', fr: 'Utilisez notre IA pour créer des lettres de candidature convaincantes et optimiser votre processus de candidature.', es: 'Usa nuestra IA para crear cartas de solicitud convincentes y optimizar tu proceso de solicitud.', ko: 'AI를 사용하여 설득력 있는 지원서를 작성하고 지원 과정을 최적화하세요.' },
  'ai.feature1.title': { de: 'Bewerbungsschreiben', en: 'Application Letter', fr: 'Lettre de candidature', es: 'Carta de solicitud', ko: '지원서' },
  'ai.feature1.desc': { de: 'Lassen Sie sich ein professionelles Anschreiben für Ihre Kunstbewerbung erstellen.', en: 'Have a professional cover letter created for your art application.', fr: 'Faites rédiger une lettre de motivation professionnelle pour votre candidature artistique.', es: 'Haz que te creen una carta de presentación profesional para tu solicitud artística.', ko: '예술 지원을 위한 전문적인 커버레터를 작성하세요.' },
  'ai.feature2.title': { de: 'Bewerbungsfahrplan', en: 'Application Roadmap', fr: 'Feuille de route', es: 'Hoja de ruta', ko: '지원 로드맵' },
  'ai.feature2.desc': { de: 'Erhalten Sie einen detaillierten Zeitplan für Ihre Bewerbungsstrategie.', en: 'Get a detailed timeline for your application strategy.', fr: 'Obtenez un calendrier détaillé pour votre stratégie de candidature.', es: 'Obtén un calendario detallado para tu estrategia de solicitud.', ko: '지원 전략을 위한 상세한 일정을 받으세요.' },
  'ai.startTitle': { de: 'Starten Sie Ihre Anfrage', en: 'Start your request', fr: 'Commencez votre demande', es: 'Inicia tu solicitud', ko: '요청 시작' },
  'ai.startDesc': { de: 'Beschreiben Sie die Ausschreibung und was Sie benötigen.', en: 'Describe the call and what you need.', fr: 'Décrivez l\'appel et ce dont vous avez besoin.', es: 'Describe la convocatoria y lo que necesitas.', ko: '공모와 필요한 것을 설명하세요.' },
  'ai.placeholder': { de: 'Ich möchte mich für [Name des Preises] bewerben. Meine Kunst beschäftigt sich mit...', en: 'I want to apply for [Prize Name]. My art deals with...', fr: 'Je veux postuler pour [Nom du Prix]. Mon art traite de...', es: 'Quiero solicitar [Nombre del Premio]. Mi arte trata de...', ko: '[상 이름]에 지원하고 싶습니다. 제 예술은...' },
  'ai.generate': { de: 'Generieren', en: 'Generate', fr: 'Générer', es: 'Generar', ko: '생성' },
  'ai.proFeature': { de: 'Pro-Feature', en: 'Pro Feature', fr: 'Fonctionnalité Pro', es: 'Función Pro', ko: 'Pro 기능' },
  'ai.proDescription': { de: 'Upgraden Sie auf Pro, um den KI-Berater zu nutzen.', en: 'Upgrade to Pro to use the AI consultant.', fr: 'Passez à Pro pour utiliser le consultant IA.', es: 'Actualiza a Pro para usar el consultor IA.', ko: 'AI 컨설턴트를 사용하려면 Pro로 업그레이드하세요.' },

  // Modal labels
  'modal.description': { de: 'Beschreibung', en: 'Description', fr: 'Description', es: 'Descripción', ko: '설명' },
  'modal.requirements': { de: 'Anforderungen', en: 'Requirements', fr: 'Conditions', es: 'Requisitos', ko: '요구사항' },
  'modal.attention': { de: 'Achtung!', en: 'Attention!', fr: 'Attention!', es: '¡Atención!', ko: '주의!' },
  'modal.feeWarning': { de: 'Gebühr!', en: 'Fee!', fr: 'Frais!', es: '¡Tarifa!', ko: '수수료!' },
  'modal.website': { de: 'Zur Website des Veranstalters', en: 'Visit organizer website', fr: 'Visiter le site de l\'organisateur', es: 'Visitar sitio del organizador', ko: '주최자 웹사이트 방문' },
  'modal.useAI': { de: 'nutzen', en: 'use', fr: 'utiliser', es: 'usar', ko: '사용' },
  'modal.upgradeText': { de: 'Erhalten Sie Zugang zu allen Details, Beschreibungen, Anforderungen und Links.', en: 'Get access to all details, descriptions, requirements and links.', fr: 'Obtenez l\'accès à tous les détails, descriptions, conditions et liens.', es: 'Obtén acceso a todos los detalles, descripciones, requisitos y enlaces.', ko: '모든 세부정보, 설명, 요구사항 및 링크에 액세스하세요.' },

  // Pricing
  'pricing.title': { de: 'Unsere Abonnements', en: 'Our Subscriptions', fr: 'Nos Abonnements', es: 'Nuestras Suscripciones', ko: '구독 플랜' },
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
  'pricing.popular': { de: 'Beliebteste Wahl', en: 'Most Popular', fr: 'Plus Populaire', es: 'Más Popular', ko: '가장 인기' },
  'pricing.selectPlan': { de: 'Auswählen', en: 'Select', fr: 'Sélectionner', es: 'Seleccionar', ko: '선택' },
  'pricing.cancelAnytime': { de: 'Jederzeit kündbar. Sichere Zahlung über Stripe.', en: 'Cancel anytime. Secure payment via Stripe.', fr: 'Annulez à tout moment. Paiement sécurisé via Stripe.', es: 'Cancela en cualquier momento. Pago seguro con Stripe.', ko: '언제든지 취소 가능. Stripe 통한 안전한 결제.' },

  // Footer
  'footer.imprint': { de: 'Impressum', en: 'Imprint', fr: 'Mentions légales', es: 'Aviso legal', ko: '법적 고지' },
  'footer.privacy': { de: 'Datenschutz', en: 'Privacy Policy', fr: 'Politique de confidentialité', es: 'Política de privacidad', ko: '개인정보 처리방침' },
  'footer.disclaimer': { de: 'Haftungsausschluss', en: 'Disclaimer', fr: 'Avertissement', es: 'Descargo', ko: '면책조항' },
  'footer.terms': { de: 'Nutzungsbedingungen', en: 'Terms of Service', fr: 'Conditions d\'utilisation', es: 'Términos de servicio', ko: '이용약관' },
  'footer.sitemap': { de: 'Sitemap', en: 'Sitemap', fr: 'Plan du site', es: 'Mapa del sitio', ko: '사이트맵' },

  // Black Sheep / Fee Warning
  'blacksheep.warning': { 
    de: 'Achtung: Teilnahmegebühr!', 
    en: 'Warning: Entry Fee!', 
    fr: 'Attention: Frais de participation!', 
    es: '¡Atención: Cuota de participación!', 
    ko: '주의: 참가비!' 
  },
  'blacksheep.title': { 
    de: 'Grauzone Warnung', 
    en: 'Gray Zone Warning', 
    fr: 'Avertissement Zone Grise', 
    es: 'Advertencia Zona Gris', 
    ko: '그레이존 경고' 
  },
  'blacksheep.description1': { 
    de: 'Weitere Informationen zu der Grauzone in der Kunstszene erfahren Sie regelmäßig aktuell in der Zeitschrift', 
    en: 'For more information about gray zones in the art scene, regularly visit the magazine', 
    fr: 'Pour plus d\'informations sur les zones grises dans le monde de l\'art, consultez régulièrement le magazine', 
    es: 'Para más información sobre las zonas grises en el mundo del arte, consulte regularmente la revista', 
    ko: '예술계의 그레이존에 대한 자세한 정보는 정기적으로 잡지에서 확인하세요' 
  },
  'blacksheep.description2': { 
    de: 'in der Rubrik "Grauzone".', 
    en: 'in the "Gray Zone" section.', 
    fr: 'dans la rubrique "Zone Grise".', 
    es: 'en la sección "Zona Gris".', 
    ko: '"그레이존" 섹션에서.' 
  },
  'blacksheep.archiveInfo': { 
    de: 'Eine Liste über die schon dort behandelten Grauzonen-Fälle, in denen die wenig künstlerfreundlichen Konditionen von Organisatoren untersucht wurden, finden Sie unter:', 
    en: 'A list of gray zone cases already covered, where unfavorable conditions for artists by organizers were examined, can be found at:', 
    fr: 'Une liste des cas de zone grise déjà traités, où les conditions peu favorables aux artistes des organisateurs ont été examinées, est disponible sur:', 
    es: 'Una lista de casos de zona gris ya cubiertos, donde se examinaron las condiciones desfavorables para artistas por parte de organizadores, se encuentra en:', 
    ko: '이미 다룬 그레이존 사례 목록(주최자의 예술가에게 불리한 조건을 조사한)은 다음에서 확인할 수 있습니다:' 
  },
  'blacksheep.archiveLink': { 
    de: 'Grauzone Archiv', 
    en: 'Gray Zone Archive', 
    fr: 'Archives Zone Grise', 
    es: 'Archivo Zona Gris', 
    ko: '그레이존 아카이브' 
  },
  'blacksheep.scamWarning': { 
    de: 'Achtung: Mögliche Kostenfalle!', 
    en: 'Warning: Potential Scam!', 
    fr: 'Attention: Arnaque potentielle!', 
    es: '¡Atención: Posible estafa!', 
    ko: '주의: 잠재적 사기!' 
  },
  'blacksheep.scamDescription': { 
    de: 'Diese Ausschreibung wurde als potenziell unseriös gemeldet. Bitte prüfen Sie die Konditionen sorgfältig.', 
    en: 'This call has been flagged as potentially dubious. Please review the conditions carefully.', 
    fr: 'Cet appel a été signalé comme potentiellement douteux. Veuillez examiner attentivement les conditions.', 
    es: 'Esta convocatoria ha sido marcada como potencialmente dudosa. Por favor revise las condiciones cuidadosamente.', 
    ko: '이 공모전은 잠재적으로 의심스러운 것으로 표시되었습니다. 조건을 신중하게 검토하세요.' 
  },
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
