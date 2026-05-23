/**
 * Airport Proximity Service
 * Source: OurAirports.com open data (CSV → compiled to typed JSON subset)
 *
 * Strategy:
 *  1. On first call, fetch the full large_airports + medium_airports CSV from
 *     OurAirports GitHub mirror (public, no auth, CORS-friendly).
 *  2. Parse into a compact in-memory array (~6k airports).
 *  3. For any lat/lng, find the nearest airport using Haversine distance.
 *  4. Return airport info + distance + dynamic radius based on airport type.
 *
 * Type → Radius mapping:
 *   large_airport    → 120 km  (international hub)
 *   medium_airport   → 60 km   (regional)
 *   small_airport    → 25 km   (local airstrip)
 */

export interface Airport {
  name: string;
  iata: string;
  lat: number;
  lng: number;
  type: 'large' | 'medium' | 'small';
  country: string;
}

export interface NearestAirportResult {
  airport: Airport;
  distanceKm: number;
  /** Dynamic coverage radius in km based on airport type */
  radiusKm: number;
}

const TYPE_RADIUS: Record<string, number> = {
  large: 120,
  medium: 60,
  small: 25,
};

const TYPE_LABELS: Record<string, string> = {
  large: 'Міжнародний',
  medium: 'Регіональний',
  small: 'Локальний',
};

export function getAirportTypeLabel(type: string): string {
  return TYPE_LABELS[type] || type;
}

// ─── Haversine ──────────────────────────────────────────────────────────────────
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── In-memory cache ────────────────────────────────────────────────────────────
let _airports: Airport[] | null = null;
let _loading: Promise<Airport[]> | null = null;

/**
 * Loads airports from OurAirports GitHub CSV.
 * We parse only large + medium airports to keep memory light (~3k entries).
 */
async function loadAirports(): Promise<Airport[]> {
  if (_airports) return _airports;
  if (_loading) return _loading;

  _loading = (async () => {
    try {
      const res = await fetch(
        'https://davidmegginson.github.io/ourairports-data/airports.csv',
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      const lines = text.split('\n');
      const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

      const iName = header.indexOf('name');
      const iType = header.indexOf('type');
      const iLat = header.indexOf('latitude_deg');
      const iLng = header.indexOf('longitude_deg');
      const iIata = header.indexOf('iata_code');
      const iCountry = header.indexOf('iso_country');

      const result: Airport[] = [];
      for (let i = 1; i < lines.length; i++) {
        // Simple CSV parsing (handles quoted fields)
        const row = parseCSVLine(lines[i]);
        if (!row || row.length < Math.max(iName, iType, iLat, iLng, iIata, iCountry) + 1) continue;

        const rawType = row[iType];
        let type: 'large' | 'medium' | 'small' | null = null;
        if (rawType === 'large_airport') type = 'large';
        else if (rawType === 'medium_airport') type = 'medium';
        else continue; // Skip small/closed/heliport — too many, not useful for nomad radius

        const lat = parseFloat(row[iLat]);
        const lng = parseFloat(row[iLng]);
        if (isNaN(lat) || isNaN(lng)) continue;

        result.push({
          name: row[iName].replace(/"/g, ''),
          iata: (row[iIata] || '').replace(/"/g, ''),
          lat,
          lng,
          type,
          country: (row[iCountry] || '').replace(/"/g, ''),
        });
      }

      _airports = result;
      console.info(`[Airports] Loaded ${result.length} airports (large + medium)`);
      return result;
    } catch (err) {
      console.warn('[Airports] Failed to load OurAirports data:', err);
      _airports = [];
      return [];
    }
  })();

  return _loading;
}

/** Simple CSV line parser that handles quoted fields with commas */
function parseCSVLine(line: string): string[] | null {
  if (!line.trim()) return null;
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Find the nearest airport to a given point.
 * Loads data on first call.
 */
export async function findNearestAirport(
  lat: number,
  lng: number
): Promise<NearestAirportResult | null> {
  const airports = await loadAirports();
  if (airports.length === 0) return null;

  let best: Airport | null = null;
  let bestDist = Infinity;

  for (const ap of airports) {
    const d = haversineKm(lat, lng, ap.lat, ap.lng);
    if (d < bestDist) {
      bestDist = d;
      best = ap;
    }
  }

  if (!best) return null;

  return {
    airport: best,
    distanceKm: Math.round(bestDist),
    radiusKm: TYPE_RADIUS[best.type] || 40,
  };
}
