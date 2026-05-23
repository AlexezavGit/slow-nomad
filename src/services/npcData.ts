// services/npcData.ts

export interface NpcUser {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
}

export const NPCS: NpcUser[] = [
  { id: 'npc_1', name: 'Nomad Kael', role: 'Explorer', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kael' },
  { id: 'npc_2', name: 'Cypher X', role: 'Investor', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cypher' },
  { id: 'npc_3', name: 'Luna Star', role: 'Creator', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna' },
  { id: 'npc_4', name: 'Drifter_0x', role: 'Nomad', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Drifter' },
  { id: 'npc_5', name: 'Aria Connect', role: 'Community Architect', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria' },
];

export interface CommunityPulse {
  nomadsCount: number;
  notesCount: number;
  activityLabel: 'Низька' | 'Середня' | 'Висока';
  activityColor: string;
  // A few notes gathered nearby
  recentNotes: { author: NpcUser; text: string; time: string }[];
}

// Pseudo-random generation based on lat/lng to be consistent for the same location
function pseudoRandom(lat: number, lng: number, salt: number) {
  const sin = Math.sin(lat * salt + lng * salt * 1.3 + salt);
  return sin - Math.floor(sin);
}

/**
 * Gets a dynamically simulated community pulse for a given coordinate.
 * Uses pseudo-random math so the exact same location always yields the same result.
 * This satisfies the "5 NPCs making 15 notes" demo without complex DB querying for now.
 */
export function getCommunityPulseForLocation(lat: number, lng: number): CommunityPulse {
  // Round to nearest ~10km (0.1 degree) to aggregate nearby clicks
  const cellLat = Math.round(lat * 10) / 10;
  const cellLng = Math.round(lng * 10) / 10;
  
  const randNomads = pseudoRandom(cellLat, cellLng, 1234);
  const randNotes = pseudoRandom(cellLat, cellLng, 5678);
  const randActivity = pseudoRandom(cellLat, cellLng, 9012);

  // If it's pure ocean (we don't have water check yet, but usually pulse is low everywhere except hotspots)
  // We'll just generate up to 15 nomads
  const nomadsCount = Math.floor(randNomads * 16);
  const notesCount = Math.floor(randNotes * 20);
  
  let activityLabel: 'Низька' | 'Середня' | 'Висока' = 'Низька';
  let activityColor = 'text-stone-400';
  
  if (randActivity > 0.8) {
    activityLabel = 'Висока';
    activityColor = 'text-sky-400';
  } else if (randActivity > 0.4) {
    activityLabel = 'Середня';
    activityColor = 'text-amber-400';
  }

  // Pick a random NPC author for notes
  const notes = [];
  if (notesCount > 0) {
    const authorIdx = Math.floor(pseudoRandom(cellLat, cellLng, 1111) * NPCS.length);
    notes.push({
      author: NPCS[authorIdx],
      text: 'Перевіряв швидкість Starlink тут — все стабільно. 120 Mbps.',
      time: '2 год тому'
    });
  }
  if (notesCount > 5) {
    const authorIdx2 = Math.floor(pseudoRandom(cellLat, cellLng, 2222) * NPCS.length);
    notes.push({
      author: NPCS[authorIdx2],
      text: 'Гарна інфраструктура, але ціни на оренду стрибнули.',
      time: '1 день тому'
    });
  }

  return {
    nomadsCount,
    notesCount,
    activityLabel,
    activityColor,
    recentNotes: notes
  };
}
