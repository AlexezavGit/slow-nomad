// ─── MAP LAYER PARAMETER SYSTEM ───────────────────────────────────────────────
// Based on 7-pillar roadmap + wireframe 1.2 structure

export type LayerStatus = 'live' | 'coming-soon' | 'manual';

export interface LayerItem {
  id: string;
  icon: string;
  label: string;
  status: LayerStatus;
  source?: string;
  type: 'fog' | 'highlight' | 'interest';
  active?: boolean;
}

export interface LayerCluster {
  id: string;
  icon: string;
  label: string;
  items: LayerItem[];
}

export const LAYER_CLUSTERS: LayerCluster[] = [
  {
    id: 'safety',
    icon: '🛡',
    label: 'Безпека',
    items: [
      { id: 'conflicts', icon: '⚔', label: 'Конфлікти і война', type: 'fog', status: 'live', source: 'Global Peace Index 2024' },
      { id: 'crime', icon: '🔒', label: 'Висока злочинність', type: 'fog', status: 'live', source: 'Numbeo Crime Index' },
      { id: 'corruption', icon: '🏛', label: 'Корупція (CPI)', type: 'fog', status: 'live', source: 'Transparency International' },
      { id: 'travel_warnings', icon: '⚠', label: 'Travel warnings', type: 'fog', status: 'coming-soon', source: 'FCDO / US State Dept' },
      { id: 'terrorism', icon: '💣', label: 'Тероризм', type: 'fog', status: 'coming-soon', source: 'GTI Index' },
    ],
  },
  {
    id: 'climate',
    icon: '🌤',
    label: 'Клімат',
    items: [
      { id: 'short_season', icon: '🌦', label: 'Короткий сезон', type: 'fog', status: 'live', source: 'Manually mapped' },
      { id: 'disasters', icon: '🌊', label: 'Природні катаклізми', type: 'fog', status: 'live', source: 'INFORM Risk Index' },
      { id: 'air_quality', icon: '💨', label: 'Якість повітря (AQI)', type: 'highlight', status: 'live', source: 'OpenAQ API' },
      { id: 'uv', icon: '☀', label: 'UV-індекс', type: 'fog', status: 'coming-soon', source: 'WHO / NASA' },
      { id: 'temperature', icon: '🌡', label: 'Середня t°', type: 'highlight', status: 'coming-soon', source: 'Open-Meteo' },
    ],
  },
  {
    id: 'rights',
    icon: '📜',
    label: 'Права і інституції',
    items: [
      { id: 'property', icon: '🏠', label: 'Слабкі права власності', type: 'fog', status: 'live', source: 'Manually mapped' },
      { id: 'censorship', icon: '🔇', label: 'Цензура інтернету', type: 'fog', status: 'coming-soon', source: 'Freedom House' },
      { id: 'lgbtq', icon: '🌈', label: 'LGBTQ+ права', type: 'fog', status: 'coming-soon', source: 'ILGA World' },
      { id: 'press', icon: '📰', label: 'Свобода преси', type: 'highlight', status: 'coming-soon', source: 'RSF Index' },
    ],
  },
  {
    id: 'economy',
    icon: '💰',
    label: 'Економіка',
    items: [
      { id: 'cost_of_living', icon: '🛒', label: 'Вартість життя', type: 'highlight', status: 'live', source: 'Numbeo CoL' },
      { id: 'yield', icon: '📈', label: 'Yield > 8%', type: 'highlight', status: 'live', source: 'Internal data' },
      { id: 'internet', icon: '📡', label: 'Швидкий інтернет', type: 'highlight', status: 'live', source: 'Speedtest Global' },
      { id: 'nomad_visa', icon: '✈', label: 'Nomad Visa', type: 'highlight', status: 'live', source: 'Manually tracked' },
      { id: 'visa_barriers', icon: '🛂', label: 'Візові барʼєри', type: 'fog', status: 'live', source: 'Passport Index' },
      { id: 'inflation', icon: '📉', label: 'Висока інфляція', type: 'fog', status: 'coming-soon', source: 'World Bank' },
    ],
  },
  {
    id: 'culture',
    icon: '🎭',
    label: 'Культура і освіта',
    items: [
      { id: 'happiness', icon: '😊', label: 'Індекс щастя', type: 'highlight', status: 'live', source: 'World Happiness Report' },
      { id: 'tolerance', icon: '🤝', label: 'Толерантність', type: 'highlight', status: 'coming-soon', source: 'Hofstede Insights' },
      { id: 'expat_friendly', icon: '🌍', label: 'Expat-friendly', type: 'highlight', status: 'coming-soon', source: 'InterNations' },
      { id: 'language', icon: '🗣', label: 'Англомовне середовище', type: 'highlight', status: 'coming-soon', source: 'EF EPI' },
    ],
  },
  {
    id: 'nature',
    icon: '🌿',
    label: 'Природа',
    items: [
      { id: 'biodiversity', icon: '🌳', label: 'Біорізноманіття', type: 'highlight', status: 'coming-soon', source: 'IUCN' },
      { id: 'ocean_access', icon: '🌊', label: 'Доступ до океану', type: 'highlight', status: 'manual', source: 'Manually mapped' },
      { id: 'mountains', icon: '⛰', label: 'Гірська місцевість', type: 'highlight', status: 'manual', source: 'Manually mapped' },
      { id: 'green_city', icon: '🌱', label: 'Зелені міста', type: 'highlight', status: 'coming-soon', source: 'EIU Liveability' },
    ],
  },
  {
    id: 'interests',
    icon: '🏄',
    label: 'Інтереси',
    items: [
      { id: 'surf', icon: '🏄', label: 'Серфінг', type: 'interest', status: 'live' },
      { id: 'gastronomy', icon: '🍽', label: 'Гастрономія', type: 'interest', status: 'live' },
      { id: 'culture_i', icon: '🏺', label: 'Культура', type: 'interest', status: 'live' },
      { id: 'wine', icon: '🍷', label: 'Вино', type: 'interest', status: 'live' },
      { id: 'wellness', icon: '🧘', label: 'Wellness', type: 'interest', status: 'live' },
      { id: 'diving', icon: '🤿', label: 'Дайвінг', type: 'interest', status: 'live' },
      { id: 'hiking', icon: '🥾', label: 'Хайкінг', type: 'interest', status: 'live' },
      { id: 'coworking', icon: '💻', label: 'Коворкінг культура', type: 'interest', status: 'live' },
      { id: 'photography', icon: '📸', label: 'Фотографія', type: 'interest', status: 'coming-soon' },
    ],
  },
];

// Initial fog filter state (all off)
export type FogState = Record<string, boolean>;

export function buildInitialFogState(): FogState {
  const state: FogState = {};
  LAYER_CLUSTERS.forEach(cluster => {
    cluster.items.forEach(item => {
      state[item.id] = false;
    });
  });
  return state;
}
