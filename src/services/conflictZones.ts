/**
 * Conflict Zone Monitor
 * Primary:  UCDP GED API (Uppsala Conflict Data Program) — free, no auth, authoritative
 * Fallback: Curated 2024-2025 static dataset from ACLED/UCDP public reports
 *
 * UCDP covers all armed conflicts with geocoded events since 1989.
 * API: https://ucdpapi.pcr.uu.se
 */

export interface ConflictPoint {
  lat: number;
  lng: number;
  /** 0 (low) – 1 (active war) */
  intensity: number;
  label?: string;
}

// ─── Curated 2024-2025 static fallback ────────────────────────────────────────
// Source: UCDP/PRIO Armed Conflict Dataset + ACLED global data (Jan-Apr 2025)
const FALLBACK: ConflictPoint[] = [
  // Active war zones (intensity 0.8-1.0)
  { lat: 48.2, lng: 37.8,  intensity: 1.0,  label: 'Ukraine – Donbas front' },
  { lat: 49.5, lng: 26.5,  intensity: 0.8,  label: 'Ukraine – central' },
  { lat: 31.35, lng: 34.3, intensity: 1.0,  label: 'Gaza Strip' },
  { lat: 32.5,  lng: 35.5, intensity: 0.5,  label: 'West Bank' },
  { lat: 33.3,  lng: 36.2, intensity: 0.65, label: 'Syria – Damascus area' },
  { lat: 36.2,  lng: 37.1, intensity: 0.55, label: 'Syria – Aleppo' },
  { lat: 15.3,  lng: 44.2, intensity: 0.9,  label: 'Yemen – Houthi zone' },
  { lat: 14.5,  lng: 32.5, intensity: 0.85, label: 'Sudan – Khartoum' },
  { lat: 13.0,  lng: 25.5, intensity: 0.7,  label: 'Sudan – Darfur' },
  // Medium intensity (0.4-0.7)
  { lat: 34.5,  lng: 69.2, intensity: 0.65, label: 'Afghanistan – Kabul region' },
  { lat: 32.5,  lng: 65.5, intensity: 0.55, label: 'Afghanistan – Helmand' },
  { lat: 14.0,  lng: 40.5, intensity: 0.5,  label: 'Ethiopia – Amhara' },
  { lat: 9.5,   lng: 42.5, intensity: 0.45, label: 'Ethiopia – Tigray buffer' },
  { lat: 10.5,  lng: 7.5,  intensity: 0.5,  label: 'Nigeria – Boko Haram zone' },
  { lat: 12.5,  lng: 2.5,  intensity: 0.45, label: 'Mali – Sahel' },
  { lat: 13.5,  lng: -3.0, intensity: 0.4,  label: 'Burkina Faso' },
  { lat: 3.5,   lng: 26.5, intensity: 0.6,  label: 'DRC – eastern' },
  { lat: 1.5,   lng: 30.5, intensity: 0.45, label: 'DRC – Uganda border' },
  { lat: 5.0,   lng: 18.0, intensity: 0.35, label: 'CAR – interior' },
  { lat: 16.0,  lng: 47.5, intensity: 0.4,  label: 'Yemen – eastern' },
  // Lower intensity / tensions (0.2-0.4)
  { lat: 4.5,   lng: 8.5,  intensity: 0.3,  label: 'Cameroon – Anglophone' },
  { lat: 7.5,   lng: 81.0, intensity: 0.3,  label: 'Sri Lanka – tension' },
  { lat: 25.5,  lng: 51.5, intensity: 0.25, label: 'Gulf tensions' },
  { lat: 36.5,  lng: 74.5, intensity: 0.3,  label: 'Pakistan – north' },
  { lat: 24.0,  lng: 90.5, intensity: 0.25, label: 'Myanmar – east' },
];

let _cache: ConflictPoint[] | null = null;

/** Fetches live conflict event data from UCDP GED REST API.
 *  Falls back gracefully to the curated static list on any error.
 */
export async function fetchConflictZones(): Promise<ConflictPoint[]> {
  if (_cache) return _cache;

  try {
    // UCDP GED API — geocoded conflict events 2024
    // Docs: https://ucdpapi.pcr.uu.se/  | No auth required | CORS enabled
    const res = await fetch(
      'https://ucdpapi.pcr.uu.se/api/gedevents/24.1?pagesize=500&Year=2024',
      { signal: AbortSignal.timeout(6000) }
    );

    if (!res.ok) throw new Error(`UCDP HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data.Result) || data.Result.length === 0) {
      throw new Error('UCDP empty response');
    }

    const points: ConflictPoint[] = data.Result
      .filter((e: any) => e.latitude && e.longitude)
      .map((e: any) => {
        const dead = parseInt(e.deaths_civilians || 0) +
                     parseInt(e.deaths_unknown || 0);
        const intensity = Math.min(1, Math.max(0.1, dead / 40));
        return {
          lat: parseFloat(e.latitude),
          lng: parseFloat(e.longitude),
          intensity,
          label: e.country,
        };
      })
      .filter((p: ConflictPoint) => !isNaN(p.lat) && !isNaN(p.lng))
      .slice(0, 300);

    _cache = points.length >= 10 ? points : FALLBACK;
    console.info(`[ConflictZones] UCDP live: ${_cache.length} events`);
    return _cache;

  } catch (err) {
    console.warn('[ConflictZones] UCDP unavailable, using curated fallback:', err);
    _cache = FALLBACK;
    return FALLBACK;
  }
}
