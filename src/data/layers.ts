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
      { id: 'conflicts', icon: '⚔', label: 'Зони бойових дій', type: 'fog', status: 'live', source: 'Global Peace Index 2024' },
      { id: 'crime', icon: '🔒', label: 'Високий рівень злочинності', type: 'fog', status: 'live', source: 'Numbeo Crime Index' },
      { id: 'corruption', icon: '🏛', label: 'Системна корупція (Ризики)', type: 'fog', status: 'live', source: 'Transparency International' },
      { id: 'travel_warnings', icon: '⚠', label: 'Червоні зони (Travel Warnings)', type: 'fog', status: 'coming-soon', source: 'FCDO / US State Dept' },
      { id: 'terrorism', icon: '💣', label: 'Терористична загроза', type: 'fog', status: 'coming-soon', source: 'GTI Index' },
    ],
  },
  {
    id: 'climate',
    icon: '🌤',
    label: 'Клімат',
    items: [
      { id: 'short_season', icon: '🌦', label: 'Короткий комфортний сезон', type: 'fog', status: 'live', source: 'Manually mapped' },
      { id: 'disasters', icon: '🌊', label: 'Високий ризик катаклізмів', type: 'fog', status: 'live', source: 'INFORM Risk Index' },
      { id: 'air_quality', icon: '💨', label: 'Чисте повітря (AQI)', type: 'highlight', status: 'live', source: 'OpenAQ API' },
      { id: 'uv', icon: '☀', label: 'Екстремальний UV-індекс', type: 'fog', status: 'coming-soon', source: 'WHO / NASA' },
      { id: 'temperature', icon: '🌡', label: 'Локації з цілорічним теплом', type: 'highlight', status: 'coming-soon', source: 'Open-Meteo' },
    ],
  },
  {
    id: 'rights',
    icon: '📜',
    label: 'Права і інституції',
    items: [
      { id: 'property', icon: '🏠', label: 'Ризики прав власності', type: 'fog', status: 'live', source: 'Manually mapped' },
      { id: 'censorship', icon: '🔇', label: 'Тотальна цензура інтернету', type: 'fog', status: 'coming-soon', source: 'Freedom House' },
      { id: 'lgbtq', icon: '🌈', label: 'Лояльність до LGBTQ+', type: 'highlight', status: 'coming-soon', source: 'ILGA World' },
      { id: 'press', icon: '📰', label: 'Висока свобода преси', type: 'highlight', status: 'coming-soon', source: 'RSF Index' },
    ],
  },
  {
    id: 'economy',
    icon: '💰',
    label: 'Економіка',
    items: [
      { id: 'cost_of_living', icon: '🛒', label: 'Доступна вартість життя', type: 'highlight', status: 'live', source: 'Numbeo CoL' },
      { id: 'yield', icon: '📈', label: 'Висока дохідність активів (> 8%)', type: 'highlight', status: 'live', source: 'Internal data' },
      { id: 'internet', icon: '📡', label: 'Стабільно швидкий інтернет', type: 'highlight', status: 'live', source: 'Speedtest Global' },
      { id: 'nomad_visa', icon: '✈', label: 'Наявність Digital Nomad Visa', type: 'highlight', status: 'live', source: 'Manually tracked' },
      { id: 'visa_barriers', icon: '🛂', label: 'Складні візові барʼєри', type: 'fog', status: 'live', source: 'Passport Index' },
      { id: 'inflation', icon: '📉', label: 'Нестабільна інфляція', type: 'fog', status: 'coming-soon', source: 'World Bank' },
    ],
  },
  {
    id: 'culture',
    icon: '🎭',
    label: 'Культура і суспільство',
    items: [
      { id: 'happiness', icon: '😊', label: 'Глобальний Індекс Щастя (Топ)', type: 'highlight', status: 'live', source: 'World Happiness Report' },
      { id: 'tolerance', icon: '🤝', label: 'Висока суспільна толерантність', type: 'highlight', status: 'coming-soon', source: 'Hofstede Insights' },
      { id: 'expat_friendly', icon: '🌍', label: 'Привітне до експатів середовище', type: 'highlight', status: 'coming-soon', source: 'InterNations' },
      { id: 'language', icon: '🗣', label: 'Вільне англомовне середовище', type: 'highlight', status: 'coming-soon', source: 'EF EPI' },
    ],
  },
  {
    id: 'nature',
    icon: '🌿',
    label: 'Природа',
    items: [
      { id: 'biodiversity', icon: '🌳', label: 'Багате біорізноманіття', type: 'highlight', status: 'coming-soon', source: 'IUCN' },
      { id: 'ocean_access', icon: '🌊', label: 'Прямий доступ до океану/моря', type: 'highlight', status: 'manual', source: 'Manually mapped' },
      { id: 'mountains', icon: '⛰', label: 'Мальовнича гірська місцевість', type: 'highlight', status: 'manual', source: 'Manually mapped' },
      { id: 'green_city', icon: '🌱', label: 'Топ "Зелених" Еко-міста', type: 'highlight', status: 'coming-soon', source: 'EIU Liveability' },
    ],
  },
  {
    id: 'interests',
    icon: '🏄',
    label: 'Точкові Сенси',
    items: [
      { id: 'surf', icon: '🏄', label: 'Топові серф-споти', type: 'interest', status: 'live' },
      { id: 'gastronomy', icon: '🍽', label: 'Кулінарні столиці / Гастрономія', type: 'interest', status: 'live' },
      { id: 'culture_i', icon: '🏺', label: 'Світова історична спадщина', type: 'interest', status: 'live' },
      { id: 'wine', icon: '🍷', label: 'Винні регіони світового рівня', type: 'interest', status: 'live' },
      { id: 'wellness', icon: '🧘', label: 'Ретрит та Wellness центри', type: 'interest', status: 'live' },
      { id: 'diving', icon: '🤿', label: 'Дайвінг та коралові рифи', type: 'interest', status: 'live' },
      { id: 'hiking', icon: '🥾', label: 'Популярні трейли для хайкінгу', type: 'interest', status: 'live' },
      { id: 'coworking', icon: '💻', label: 'Розширена Коворкінг культура', type: 'interest', status: 'live' },
      { id: 'photography', icon: '📸', label: 'Популярні фото та крейтор локації', type: 'interest', status: 'coming-soon' },
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
