// services/teleport.ts

export interface TeleportScores {
  city: string;
  distanceKm: number;
  scores: { name: string; score: number; color: string }[];
  summary: string;
}

/**
 * Fetches Teleport API urban area scores for a given lat/lng.
 * 1. Find nearest urban area from lat/lng
 * 2. Fetch its scores and summary
 */
export async function getTeleportData(lat: number, lng: number): Promise<TeleportScores | null> {
  try {
    // 1. Find nearest urban area
    const locRes = await fetch(`https://api.teleport.org/api/locations/${lat},${lng}/`);
    const locData = await locRes.json();

    const urbanAreas = locData?._embedded?.['location:nearest-urban-areas'];
    if (!urbanAreas || urbanAreas.length === 0) return null;

    const nearest = urbanAreas[0];
    const distanceKm = nearest.distance_km;
    
    // We only want to show it if it's reasonably close (e.g. within 300km)
    if (distanceKm > 300) return null;

    const uaUrl = nearest._links['location:nearest-urban-area'].href;
    const cityName = nearest._links['location:nearest-urban-area'].name;

    // 2. Fetch urban area scores
    const scoresRes = await fetch(`${uaUrl}scores/`);
    const scoresData = await scoresRes.json();

    const categories = scoresData.categories || [];
    
    // Filter to the key metrics we want to show
    const targetMetrics = ['Cost of Living', 'Safety', 'Healthcare', 'Internet Access'];
    const filteredScores = categories
      .filter((c: any) => targetMetrics.includes(c.name))
      .map((c: any) => ({
        name: c.name,
        score: Math.round(c.score_out_of_10),
        color: c.color
      }));

    return {
      city: cityName,
      distanceKm: Math.round(distanceKm),
      scores: filteredScores,
      summary: scoresData.summary || ''
    };
  } catch (err) {
    console.error('Teleport API error:', err);
    return null;
  }
}
