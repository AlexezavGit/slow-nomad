export interface Location {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  type: 'hub' | 'community' | 'asset';
  phase: number;   // 1-8 journey phase
  tier: number;    // 1-4 network tier
  score: number;   // composite attractiveness 0-100
  yield: string;
  entry: string;
  monthlyRent?: number;
  purchasePrice?: number;
  estimatedLoanPayment?: number;
  accommodationType?: string;
  purpose?: string;
  description?: string;
  intellectualTags?: string[];
  amenities?: string[];
  neighborhoodFeatures?: string[];
  images?: string[];
  developmentStage?: string;
  risks: {
    conflicts: boolean;
    crime: boolean;
    property: boolean;
    disasters: boolean;
    short_season: boolean;
    visa_barriers: boolean;
  };
  highlights: {
    nomad_visa: boolean;
    good_internet: boolean;
    high_yield: boolean;
    happiness: boolean;
    air_quality: boolean;
  };
  interests: string[];
  financials?: {
    totalSlots: number;
    platformSlots: number;
    ownerSlots: number;
    platformIncome: number;
    cafeIncomeMonthly: number;
    downpayment: number;
  } | null;
  image: string;
}

export const LOCATIONS: Location[] = [
  {
    id: 'buenos-aires-hub',
    name: 'Viamonte 1400',
    city: 'Buenos Aires',
    country: 'Argentina 🇦🇷',
    lat: -34.6037, lng: -58.3816,
    type: 'community',
    phase: 7, tier: 1, score: 82,
    yield: '8.5%', entry: '$35k',
    monthlyRent: 850,
    purchasePrice: 155000,
    estimatedLoanPayment: 750,
    accommodationType: 'Coliving',
    purpose: 'Permanent Residency',
    description: 'A vibrant community hub in the heart of Recoleta, focused on sustainable living and cultural depth. Perfect for long-term residents.',
    intellectualTags: ['Heritage Architecture', 'Tango Culture', 'Gastronomy Hub'],
    amenities: ['Fiber Internet', 'Rooftop Lounge', 'Communal Kitchen', 'Library'],
    neighborhoodFeatures: ['Walkable', 'Historic Museums', 'Nightlife', 'Public Parks'],
    images: [
      'https://picsum.photos/seed/buenosaires1/1200/800',
      'https://picsum.photos/seed/buenosaires2/1200/800',
      'https://picsum.photos/seed/buenosaires3/1200/800'
    ],
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: false, good_internet: true, high_yield: true, happiness: false, air_quality: true },
    interests: ['gastronomy', 'culture_i', 'wine', 'tango'],
    financials: { totalSlots: 96, platformSlots: 16, ownerSlots: 80, platformIncome: 155520, cafeIncomeMonthly: 2400, downpayment: 10650 },
    image: 'https://picsum.photos/seed/buenosaires/800/600',
  },
  {
    id: 'lisbon-hub',
    name: 'Lisbon Nomad Hub',
    city: 'Lisbon',
    country: 'Portugal 🇵🇹',
    lat: 38.7223, lng: -9.1393,
    type: 'hub',
    phase: 8, tier: 1, score: 89,
    yield: '7.2%', entry: '$45k',
    monthlyRent: 1100,
    purchasePrice: 420000,
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: false, happiness: true, air_quality: true },
    interests: ['surf', 'gastronomy', 'culture_i', 'coworking'],
    financials: { totalSlots: 120, platformSlots: 20, ownerSlots: 100, platformIncome: 180000, cafeIncomeMonthly: 3500, downpayment: 15000 },
    image: 'https://picsum.photos/seed/lisbon/800/600',
    description: 'The digital nomad capital of Europe. History, surf, and a massive community.',
    intellectualTags: ['Tech Startups', 'Historic Heritage', 'Fado Music'],
    amenities: ['Coworking', 'Fiber Optic', 'Events Hall'],
    neighborhoodFeatures: ['Hills', 'Tram access', 'Bars'],
  },
  {
    id: 'bali-hub',
    name: 'Canggu Oasis',
    city: 'Canggu',
    country: 'Indonesia 🇮🇩',
    lat: -8.6478, lng: 115.1385,
    type: 'community',
    phase: 8, tier: 1, score: 94,
    yield: '11.5%', entry: '$25k',
    monthlyRent: 900,
    purchasePrice: 180000,
    risks: { conflicts: false, crime: false, property: true, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: true, happiness: true, air_quality: false },
    interests: ['surf', 'wellness', 'coworking', 'diving'],
    financials: { totalSlots: 64, platformSlots: 12, ownerSlots: 52, platformIncome: 92000, cafeIncomeMonthly: 5000, downpayment: 8500 },
    image: 'https://picsum.photos/seed/bali/800/600',
    description: 'A paradise for those who love tropical vibes and networking.',
    intellectualTags: ['Sustainability', 'Hindu Culture', 'Ecotourism'],
    amenities: ['Pool', 'Yoga Shala', 'Fiber WiFi'],
  },
  {
    id: 'bansko-hub',
    name: 'Bansko Nomad Nest',
    city: 'Bansko',
    country: 'Bulgaria 🇧🇬',
    lat: 41.8335, lng: 23.4867,
    type: 'community',
    phase: 8, tier: 1, score: 92,
    yield: '12.0%', entry: '$18k',
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: true, visa_barriers: false },
    highlights: { nomad_visa: false, good_internet: true, high_yield: true, happiness: true, air_quality: true },
    interests: ['hiking', 'wellness', 'coworking', 'culture_i'],
    image: 'https://picsum.photos/seed/bansko/800/600',
  },
  {
    id: 'medellin-hub',
    name: 'Poblado Heights',
    city: 'Medellin',
    country: 'Colombia 🇨🇴',
    lat: 6.2083, lng: -75.5671,
    type: 'community',
    phase: 6, tier: 2, score: 85,
    yield: '9.8%', entry: '$28k',
    risks: { conflicts: false, crime: true, property: false, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: true, happiness: true, air_quality: false },
    interests: ['gastronomy', 'culture_i', 'wellness', 'coworking'],
    image: 'https://picsum.photos/seed/medellin/800/600',
  },
  {
    id: 'tbilisi-hub',
    name: 'Sololaki Art Loft',
    city: 'Tbilisi',
    country: 'Georgia 🇬🇪',
    lat: 41.6938, lng: 44.8015,
    type: 'hub',
    phase: 7, tier: 1, score: 87,
    yield: '10.5%', entry: '$20k',
    risks: { conflicts: true, crime: false, property: false, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: true, happiness: false, air_quality: true },
    interests: ['wine', 'gastronomy', 'culture_i', 'hiking'],
    image: 'https://picsum.photos/seed/tbilisi/800/600',
  },
  {
    id: 'da-nang-hub',
    name: 'An Thuong Hub',
    city: 'Da Nang',
    country: 'Vietnam 🇻🇳',
    lat: 16.0544, lng: 108.2022,
    type: 'community',
    phase: 5, tier: 2, score: 81,
    yield: '11.0%', entry: '$15k',
    risks: { conflicts: false, crime: false, property: true, disasters: true, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: false, good_internet: true, high_yield: true, happiness: true, air_quality: false },
    interests: ['surf', 'gastronomy', 'coworking'],
    image: 'https://picsum.photos/seed/danang/800/600',
  },
  {
    id: 'cape-town-hub',
    name: 'Table Mountain Villa',
    city: 'Cape Town',
    country: 'South Africa 🇿🇦',
    lat: -33.9249, lng: 18.4241,
    type: 'community',
    phase: 6, tier: 2, score: 84,
    yield: '8.8%', entry: '$32k',
    risks: { conflicts: false, crime: true, property: false, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: true, happiness: true, air_quality: true },
    interests: ['surf', 'wine', 'hiking', 'photography'],
    image: 'https://picsum.photos/seed/capetown/800/600',
  },
  {
    id: 'mexico-city-hub',
    name: 'Roma Norte Sanctuary',
    city: 'Mexico City',
    country: 'Mexico 🇲🇽',
    lat: 19.4326, lng: -99.1332,
    type: 'community',
    phase: 7, tier: 1, score: 88,
    yield: '7.5%', entry: '$40k',
    risks: { conflicts: false, crime: true, property: false, disasters: true, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: false, happiness: true, air_quality: false },
    interests: ['gastronomy', 'culture_i', 'coworking'],
    image: 'https://picsum.photos/seed/mexicocity/800/600',
  },
  {
    id: 'chiang-mai-hub',
    name: 'Nimman Coliving',
    city: 'Chiang Mai',
    country: 'Thailand 🇹🇭',
    lat: 18.7883, lng: 98.9853,
    type: 'community',
    phase: 8, tier: 1, score: 91,
    yield: '10.1%', entry: '$22k',
    monthlyRent: 650,
    purchasePrice: 95000,
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: true, happiness: true, air_quality: false },
    interests: ['gastronomy', 'culture_i', 'wellness', 'coworking'],
    financials: { totalSlots: 80, platformSlots: 10, ownerSlots: 70, platformIncome: 115000, cafeIncomeMonthly: 1500, downpayment: 5500 },
    image: 'https://picsum.photos/seed/chiangmai/800/600',
  },
  {
    id: 'valencia-hub',
    name: 'Ruzafa Creative',
    city: 'Valencia',
    country: 'Spain 🇪🇸',
    lat: 39.4699, lng: -0.3763,
    type: 'hub',
    phase: 7, tier: 1, score: 86,
    yield: '6.5%', entry: '$55k',
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: false, happiness: true, air_quality: true },
    interests: ['gastronomy', 'culture_i', 'surf'],
    image: 'https://picsum.photos/seed/valencia/800/600',
  },
  {
    id: 'porto-hub',
    name: 'Douro Dock',
    city: 'Porto',
    country: 'Portugal 🇵🇹',
    lat: 41.1579, lng: -8.6291,
    type: 'hub',
    phase: 7, tier: 1, score: 83,
    yield: '6.8%', entry: '$48k',
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: false, happiness: true, air_quality: true },
    interests: ['wine', 'gastronomy', 'culture_i', 'surf'],
    image: 'https://picsum.photos/seed/porto/800/600',
  },
  {
    id: 'tenerife-hub',
    name: 'Santa Cruz Nomad',
    city: 'Santa Cruz',
    country: 'Spain 🇪🇸',
    lat: 28.4636, lng: -16.2518,
    type: 'hub',
    phase: 6, tier: 2, score: 80,
    yield: '8.2%', entry: '$38k',
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: true, happiness: true, air_quality: true },
    interests: ['surf', 'hiking', 'diving', 'wellness'],
    image: 'https://picsum.photos/seed/tenerife/800/600',
  },
  {
    id: 'ericeira-hub',
    name: 'Wave Shack',
    city: 'Ericeira',
    country: 'Portugal 🇵🇹',
    lat: 38.9667, lng: -9.4167,
    type: 'community',
    phase: 5, tier: 3, score: 79,
    yield: '9.0%', entry: '$42k',
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: true, happiness: true, air_quality: true },
    interests: ['surf', 'wellness', 'gastronomy'],
    image: 'https://picsum.photos/seed/ericeira/800/600',
  },
  {
    id: 'tallinn-hub',
    name: 'E-Resident Loft',
    city: 'Tallinn',
    country: 'Estonia EE',
    lat: 59.4370, lng: 24.7536,
    type: 'hub',
    phase: 7, tier: 1, score: 85,
    yield: '7.0%', entry: '$35k',
    risks: { conflicts: true, crime: false, property: false, disasters: false, short_season: true, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: false, happiness: true, air_quality: true },
    interests: ['coworking', 'culture_i', 'photography'],
    image: 'https://picsum.photos/seed/tallinn/800/600',
  },
  {
    id: 'warsaw-hub',
    name: 'Vistula View',
    city: 'Warsaw',
    country: 'Poland 🇵🇱',
    lat: 52.2297, lng: 21.0122,
    type: 'hub',
    phase: 6, tier: 2, score: 82,
    yield: '8.5%', entry: '$30k',
    risks: { conflicts: true, crime: false, property: false, disasters: false, short_season: true, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: true, happiness: true, air_quality: true },
    interests: ['culture_i', 'gastronomy', 'coworking'],
    image: 'https://picsum.photos/seed/warsaw/800/600',
  },
  {
    id: 'budapest-hub',
    name: 'Danube Palace',
    city: 'Budapest',
    country: 'Hungary 🇭🇺',
    lat: 47.4979, lng: 19.0402,
    type: 'hub',
    phase: 7, tier: 2, score: 86,
    yield: '9.2%', entry: '$25k',
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: true, happiness: true, air_quality: true },
    interests: ['culture_i', 'wellness', 'gastronomy', 'wine'],
    image: 'https://picsum.photos/seed/budapest/800/600',
  },
  {
    id: 'prague-hub',
    name: 'Old Square Suite',
    city: 'Prague',
    country: 'Czech Republic 🇨🇿',
    lat: 50.0755, lng: 14.4378,
    type: 'hub',
    phase: 8, tier: 1, score: 88,
    yield: '6.5%', entry: '$45k',
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: true, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: false, happiness: true, air_quality: true },
    interests: ['culture_i', 'gastronomy', 'photography'],
    image: 'https://picsum.photos/seed/prague/800/600',
  },
  {
    id: 'berlin-hub',
    name: 'Techno Loft',
    city: 'Berlin',
    country: 'Germany 🇩🇪',
    lat: 52.5200, lng: 13.4050,
    type: 'hub',
    phase: 8, tier: 1, score: 81,
    yield: '5.2%', entry: '$70k',
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: true, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: false, happiness: true, air_quality: true },
    interests: ['culture_i', 'photography', 'gastronomy'],
    image: 'https://picsum.photos/seed/berlin/800/600',
  },
  {
    id: 'athens-hub',
    name: 'Acropolis View',
    city: 'Athens',
    country: 'Greece 🇬🇷',
    lat: 37.9838, lng: 23.7275,
    type: 'hub',
    phase: 6, tier: 2, score: 79,
    yield: '8.8%', entry: '$35k',
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: true, happiness: true, air_quality: false },
    interests: ['culture_i', 'gastronomy', 'hiking'],
    image: 'https://picsum.photos/seed/athens/800/600',
  },
  {
    id: 'dubai-hub',
    name: 'Skyline Suite',
    city: 'Dubai',
    country: 'UAE 🇦🇪',
    lat: 25.2048, lng: 55.2708,
    type: 'hub',
    phase: 8, tier: 1, score: 83,
    yield: '7.0%', entry: '$80k',
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: false, visa_barriers: true },
    highlights: { nomad_visa: true, good_internet: true, high_yield: false, happiness: true, air_quality: false },
    interests: ['coworking', 'gastronomy', 'wellness'],
    image: 'https://picsum.photos/seed/dubai/800/600',
  },
  {
    id: 'malta-hub',
    name: 'Valletta Nest',
    city: 'Valletta',
    country: 'Malta 🇲🇹',
    lat: 35.8989, lng: 14.5146,
    type: 'hub',
    phase: 7, tier: 2, score: 84,
    yield: '8.0%', entry: '$40k',
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: true, high_yield: true, happiness: true, air_quality: true },
    interests: ['diving', 'culture_i', 'photography'],
    image: 'https://picsum.photos/seed/malta/800/600',
  },
  {
    id: 'weligama-hub',
    name: 'Surf Spirit',
    city: 'Weligama',
    country: 'Sri Lanka 🇱🇰',
    lat: 5.9722, lng: 80.4286,
    type: 'community',
    phase: 4, tier: 4, score: 76,
    yield: '14.0%', entry: '$12k',
    risks: { conflicts: true, crime: false, property: true, disasters: false, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: true, good_internet: false, high_yield: true, happiness: true, air_quality: true },
    interests: ['surf', 'wellness', 'diving'],
    image: 'https://picsum.photos/seed/srilanka/800/600',
  },
  {
    id: 'ljubljana-hub',
    name: 'Dragon Den',
    city: 'Ljubljana',
    country: 'Slovenia 🇸🇮',
    lat: 46.0569, lng: 14.5058,
    type: 'hub',
    phase: 7, tier: 2, score: 89,
    yield: '7.5%', entry: '$30k',
    risks: { conflicts: false, crime: false, property: false, disasters: false, short_season: true, visa_barriers: false },
    highlights: { nomad_visa: false, good_internet: true, high_yield: false, happiness: true, air_quality: true },
    interests: ['hiking', 'photography', 'culture_i'],
    image: 'https://picsum.photos/seed/slovenia/800/600',
  },
  {
    id: 'antigua-hub',
    name: 'Volcano View',
    city: 'Antigua',
    country: 'Guatemala 🇬🇹',
    lat: 14.5573, lng: -90.7332,
    type: 'hub',
    phase: 5, tier: 3, score: 77,
    yield: '11.5%', entry: '$18k',
    risks: { conflicts: false, crime: true, property: false, disasters: true, short_season: false, visa_barriers: false },
    highlights: { nomad_visa: false, good_internet: false, high_yield: true, happiness: true, air_quality: true },
    interests: ['hiking', 'photography', 'culture_i'],
    image: 'https://picsum.photos/seed/antigua/800/600',
  }
];

export function getPhaseColors(phase: number, isFogged: boolean, isSelected: boolean, isDark: boolean) {
  if (isFogged && !isSelected) {
    return {
      bg: isDark ? '#1a1a1a' : '#f0f0f0',
      border: isDark ? '#333' : '#ddd',
      text: isDark ? '#444' : '#aaa',
      glow: 'transparent'
    };
  }

  // Phase colors based on progress (red-ish to green-ish)
  const phaseColors: Record<number, string> = {
    1: '#F43F5E', // ideation
    2: '#FB7185',
    3: '#F87171',
    4: '#FB923C', // formation
    5: '#FBBF24', // pledge
    6: '#A3E635', // acquisition
    7: '#4ADE80', // acquisition
    8: '#22C55E', // operational
  };

  const color = phaseColors[phase] || '#22C55E';

  return {
    bg: isSelected ? color : isDark ? '#000' : '#fff',
    border: color,
    text: isSelected ? (isDark ? '#000' : '#fff') : color,
    glow: color + '33'
  };
}
