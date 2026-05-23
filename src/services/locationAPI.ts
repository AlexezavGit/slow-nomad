// services/locationAPI.ts

export interface InfrastructureScore {
  name: string;
  score: number;
  color: string;
}

export interface PlaceOfInterest {
  label: string;
  type: string;
  emoji: string;
}

export interface LocationData {
  city: string;
  countryCode: string;
  scores: InfrastructureScore[];
  places: PlaceOfInterest[];
}

function pseudoRandom(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
  }
  const sin = Math.sin(hash) * 10000;
  return sin - Math.floor(sin);
}

/**
 * Fetches actual city name and Wikipedia POIs.
 * Teleport API is permanently shut down, so this acts as our resilient aggregator:
 * 1. Reverse geocoding via BigDataCloud to get City/Country.
 * 2. Wikipedia GeoSearch for nearby real points of interest.
 * 3. Deterministic calculation of infrastructure scores based on location hash.
 */
export async function getLocationData(lat: number, lng: number): Promise<LocationData | null> {
  try {
    // 1. Get City and Country mapping
    const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    const geoData = await geoRes.json();

    const countryCode = geoData.countryCode || '';
    const city = geoData.city || geoData.locality || geoData.principalSubdivision || '';

    if (!countryCode) {
      // In the middle of the ocean or unrecognized zone
      return null;
    }

    // 2. Fetch Wikipedia nearby places
    let places: PlaceOfInterest[] = [];
    try {
      const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=10000&gslimit=4&format=json&origin=*`);
      const wikiData = await wikiRes.json();
      const gs = wikiData?.query?.geosearch || [];
      
      places = gs.map((item: any) => {
        // Assign a predictable emoji based on string hash
        const emojis = ['🏛️', '🌴', '📸', '📍', '⛰️', '🔭', '🏰'];
        const em = emojis[Math.floor(pseudoRandom(item.title) * emojis.length)];
        return {
          label: item.title,
          type: 'Wikipedia Point',
          emoji: em
        };
      });
    } catch (e) {
      console.error('Wiki fetch failed', e);
    }

    // If wiki didn't find anything, provide some generic context based on the country
    if (places.length === 0) {
      places = [
        { label: city ? `Центр ${city}` : 'Локальна зона', type: 'Geo', emoji: '📍' },
        { label: 'Природний ландшафт', type: 'Природа', emoji: '🌴' }
      ];
    }

    // 3. Generate deterministic scores based on the combination of country and lat/lng hash.
    // In a real production app, replace this with Numbeo API or similar paid service.
    const baseHash = pseudoRandom(`${countryCode}-${lat.toFixed(1)}-${lng.toFixed(1)}`);
    
    // EU/NA regions typically have higher base infrastructure baselines, we can simulate this:
    const highIncomeCodes = ['US','CA','GB','FR','DE','JP','AU','NZ','CH','SE','NO','DK','NL','AT','BE','FI','IE','IS','SG','AE'];
    const isDeveloping = !highIncomeCodes.includes(countryCode);

    const getScore = (offset: number) => {
      let s = pseudoRandom(baseHash.toString() + offset.toString()) * 5 + 3; // 3 to 8
      if (!isDeveloping) s += 2; // Bump high income nations
      return Math.min(10, Math.max(1, Math.round(s)));
    };

    const costScore = getScore(1);
    const safetyScore = getScore(2);
    const healthScore = getScore(3);
    const netScore = getScore(4);

    return {
      city: city || countryCode,
      countryCode,
      scores: [
        { name: 'Cost of Living', score: costScore, color: costScore > 5 ? '#f43f5e' : '#10b981' }, 
        { name: 'Safety', score: safetyScore, color: safetyScore > 6 ? '#10b981' : '#f59e0b' },
        { name: 'Healthcare', score: healthScore, color: healthScore > 6 ? '#3b82f6' : '#d97706' },
        { name: 'Internet Access', score: netScore, color: netScore > 7 ? '#6366f1' : '#f59e0b' },
      ],
      places,
    };
  } catch (err) {
    console.error('Location API error:', err);
    return null;
  }
}
