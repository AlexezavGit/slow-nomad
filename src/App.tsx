import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map as MapIcon, Users, Home, Compass, X, CheckCircle2, 
  Search, ArrowRight, Sun, Moon, Layers, MessageSquare, ChevronRight, UserCircle,
  History as HistoryIcon, TrendingUp, Shield, Database, User as UserIcon, Activity, ShieldCheck, Globe, LogOut, Building, Zap, MapPin, Plane, AlertTriangle
} from 'lucide-react';
import { db, auth, signIn, logOut } from './firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import ReactMapGL, { Marker, Source, Layer, NavigationControl, GeolocateControl, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Import our new data architecture
import { PERSONAS, assignPersona } from './data/personas';
import { LAYER_CLUSTERS, buildInitialFogState, FogState } from './data/layers';
import { LOCATIONS, getPhaseColors, Location } from './data/locations';
import AIRecommender from './components/AIRecommender';
import CommunityChat from './components/CommunityChat';
import { CommunityDetailPage } from './components/CommunityDetailPage';
import LiveDossierBuilder from './components/LiveDossierBuilder';
import { fetchConflictZones, type ConflictPoint } from './services/conflictZones';
import { findNearestAirport, getAirportTypeLabel, type NearestAirportResult, haversineKm } from './services/airports';
import { getCommunityPulseForLocation, type CommunityPulse } from './services/npcData';
import { getLocationData, type LocationData } from './services/locationAPI';

const GOOGLE_MAPS_MAP_ID_DARK = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || '';
const GOOGLE_MAPS_MAP_ID_LIGHT = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID_LIGHT || GOOGLE_MAPS_MAP_ID_DARK;

// ─── HOFSTEDE / QUESTIONNAIRE MODAL ──────────────────────────────────────────
const HOFSTEDE_QUESTIONS = [
  { id: 'pdi', dim: 'Дистанція влади', q: 'Як ти ставишся до ієрархії?', opts: ['Рівність важливіша', 'Помірна ієрархія', 'Структура і порядок'] },
  { id: 'idv', dim: 'Індивідуалізм', q: 'Яка спільнота тобі близька?', opts: ['Тісна як родина', 'Є своє коло і простір', 'Кожен сам собі'] },
  { id: 'mas', dim: 'Досягнення', q: 'Що тебе більше мотивує?', opts: ['Баланс і добробут', 'І те, і інше', 'Результат і успіх'] }
];

function QuestionnaireModal({ onClose, onOpenAI, isDark }: { onClose: () => void; onOpenAI: () => void; isDark: boolean }) {
  const [mode, setMode] = useState<'start' | 'questions' | 'done'>('start');
  const [target, setTarget] = useState<'community' | 'place' | 'object' | null>(null);
  const [step, setStep] = useState(0);

  const bg = isDark ? 'bg-stone-950' : 'bg-white';
  const cardBg = isDark ? 'bg-stone-900' : 'bg-slate-50';
  const border = isDark ? 'border-white/10' : 'border-slate-200';
  const text = isDark ? 'text-white' : 'text-slate-900';
  const sub = isDark ? 'text-stone-400' : 'text-slate-500';

  if (mode === 'start') {
    return (
      <ModalWrapper onClose={onClose} bg={bg} border={border}>
        <div className="p-10">
          <h2 className={`font-black text-3xl md:text-4xl mb-3 tracking-tighter ${text}`}>Що шукаємо?</h2>
          <p className={`text-base md:text-lg mb-8 font-medium leading-relaxed ${sub}`}>Оберіть формат опитування для точного підбору.</p>
          <div className="space-y-4">
            {[
              { id: 'community', title: 'Підбір ком\'юніті', desc: 'Культурний профіль за Хофстеде', badge: 'Hofstede Insights' },
              { id: 'place', title: 'Вибір місця', desc: 'Клімат, економіка, візи', badge: '7 Кластерів' },
              { id: 'object', title: 'Пошук об\'єкту', desc: 'Yield, ризики, бюджет', badge: 'Data Layers' },
            ].map(item => (
              <button key={item.id} onClick={() => { setTarget(item.id as any); setMode('questions'); }}
                className={`w-full text-left p-6 rounded-[32px] border-2 transition-all hover:border-sky-500 hover:scale-[1.02] ${cardBg} ${border} group flex items-start justify-between`}>
                <div>
                  <h3 className={`font-black text-lg ${text} group-hover:text-sky-500`}>{item.title}</h3>
                  <p className={`text-sm mt-1 font-medium ${sub}`}>{item.desc}</p>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-tighter uppercase ${isDark ? 'bg-stone-800 text-stone-300' : 'bg-slate-200 text-slate-500'}`}>
                  {item.badge}
                </div>
              </button>
            ))}
          </div>
          <button onClick={onOpenAI} className={`w-full mt-6 py-5 rounded-2xl border-2 ${border} ${sub} text-base font-black flex items-center justify-center gap-3 hover:${cardBg}`}>
            <MessageSquare size={20} /> Обговорити з AI
          </button>
        </div>
      </ModalWrapper>
    );
  }

  if (mode === 'questions') {
    const q = HOFSTEDE_QUESTIONS[step];
    return (
      <ModalWrapper onClose={onClose} bg={bg} border={border}>
        <div className={`p-6 border-b-2 ${border} flex items-center justify-between`}>
          <div className="flex gap-2">
            {HOFSTEDE_QUESTIONS.map((_, i) => (
              <div key={i} className={`h-2 w-8 rounded-full ${i <= step ? 'bg-sky-500' : isDark ? 'bg-stone-800' : 'bg-slate-200'}`} />
            ))}
          </div>
          <button onClick={() => setMode('done')} className={`text-xs uppercase font-black text-sky-500 tracking-widest`}>Пропустити</button>
        </div>
        <div className="p-10">
          <div className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-sky-500 mb-2`}>{q.dim}</div>
          <h3 className={`text-2xl md:text-3xl font-black mb-8 tracking-tighter leading-tight ${text}`}>{q.q}</h3>
          <div className="space-y-4">
            {q.opts.map((opt, i) => (
              <button key={i} onClick={() => { if(step < HOFSTEDE_QUESTIONS.length-1) setStep(s=>s+1); else setMode('done'); }}
                className={`w-full text-left p-6 rounded-[28px] border-2 transition-all hover:border-sky-500 hover:bg-sky-500/5 ${cardBg} ${border} ${text} text-lg font-bold`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper onClose={onClose} bg={bg} border={border}>
      <div className="p-12 text-center">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 size={48} />
        </div>
        <h2 className={`font-black text-3xl mb-3 tracking-tighter ${text}`}>Підбір завершено</h2>
        <p className={`text-base md:text-lg mb-10 font-medium leading-relaxed ${sub}`}>Результати збережено. На карті залишено лише релевантні локації.</p>
        <button onClick={onClose} className="w-full py-5 bg-sky-500 text-stone-950 rounded-[28px] font-black text-xl shadow-xl shadow-sky-500/20 active:scale-95 transition-all uppercase tracking-widest">
          Показати на карті
        </button>
      </div>
    </ModalWrapper>
  );
}

function ModalWrapper({ children, onClose, bg, border }: { children: React.ReactNode, onClose: ()=>void, bg: string, border: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-lg rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden ${bg} border-2 ${border} relative`}>
        <button onClick={onClose} className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center backdrop-blur transition-all">
          <X size={24} className={bg.includes('white') ? 'text-black' : 'text-white'} />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

// ─── NOMAD ZONE OVERLAY ───────────────────────────────────────────────────────────────
// Design:
//  ─ HALO:  viewport-aligned, FIXED 28px screen size at any zoom → always visible, never planet-sized
//  ─ CORE:  map-aligned, zoom-interpolated 2-14px → grows to cover actual geographic risk area
// Danger data source: UCDP live API + curated fallback (no manual flags needed)
function NomadZoneOverlay({
  activeInterests,
  fogState,
  conflictPoints,
  locations,
}: {
  activeInterests: string[];
  fogState: Record<string, boolean>;
  conflictPoints: ConflictPoint[];
  locations: { lat: number; lng: number; interests: string[]; risks: Record<string,boolean>; id: string }[];
}) {
  const hasFogFilters = Object.values(fogState).some(Boolean);
  const hasInterestFilters = activeInterests.length > 0;
  if (!hasFogFilters && !hasInterestFilters) return null;

  // ─── DANGER: real conflict points from UCDP/fallback (only when conflicts filter ON)
  // Also include any locations explicitly flagged for other risk types
  const dangerFeatures: GeoJSON.Feature[] = [];

  if (hasFogFilters) {
    if (fogState.conflicts) {
      // Real-world conflict data
      conflictPoints.forEach(pt => {
        dangerFeatures.push({
          type: 'Feature',
          properties: { intensity: pt.intensity },
          geometry: { type: 'Point', coordinates: [pt.lng, pt.lat] },
        });
      });
    }
    // Other risk flags: use location data
    const otherRisks = ['crime', 'property', 'disasters', 'short_season', 'visa_barriers'] as const;
    otherRisks.forEach(risk => {
      if (!fogState[risk]) return;
      locations
        .filter(loc => (loc.risks as any)[risk])
        .forEach(loc => {
          dangerFeatures.push({
            type: 'Feature',
            properties: { intensity: 0.5 },
            geometry: { type: 'Point', coordinates: [loc.lng, loc.lat] },
          });
        });
    });
  }

  // ─── GOOD: interest-matching locations
  const goodFeatures: GeoJSON.Feature[] = hasInterestFilters
    ? locations
        .filter(loc => activeInterests.some(i => loc.interests.includes(i)))
        .map(loc => ({
          type: 'Feature' as const,
          properties: {},
          geometry: { type: 'Point' as const, coordinates: [loc.lng, loc.lat] },
        }))
    : [];

  const dangerGeo: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: dangerFeatures };
  const goodGeo:   GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: goodFeatures };

  return (
    <>
      {/* DANGER ZONES (FOG OF WAR) — Creates dark/grey fog that reduces clarity */}
      {dangerFeatures.length > 0 && (
        <Source id="danger-zones" type="geojson" data={dangerGeo}>
          <Layer id="danger-heatmap" type="heatmap" paint={{
            'heatmap-weight': ['get', 'intensity'],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.2, 'rgba(10, 10, 15, 0.7)',
              0.6, 'rgba(5, 5, 8, 0.95)',
              1, 'rgba(0, 0, 0, 1)'
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 1, 40, 4, 100, 8, 150, 12, 80],
            'heatmap-opacity': 0.95
          }} />
        </Source>
      )}

      {/* NOMAD ZONES (WARM HIGHLIGHTS) — Pierces through fog with blue/amber tones */}
      {goodFeatures.length > 0 && (
        <Source id="good-zones" type="geojson" data={goodGeo}>
          <Layer id="good-heatmap" type="heatmap" paint={{
            'heatmap-weight': 1,
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.2, 'rgba(14, 165, 233, 0.3)', // sky-500
              0.6, 'rgba(56, 189, 248, 0.6)', // sky-400
              1, 'rgba(250, 204, 21, 0.9)'    // yellow-400 (warm center)
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 1, 30, 4, 80, 8, 120, 12, 60],
            'heatmap-opacity': 0.9
          }} />
        </Source>
      )}
    </>
  );
}

// ─── PIN RADIUS GLOW RING (shown when pin dropped) ──────────────────────────────
// Dynamic radius from nearest airport type
function MapboxRadiusCircle({ center, radiusKm }: { center: {lat:number,lng:number}; radiusKm: number }) {
  const toRad = (d: number) => d * Math.PI / 180;
  const R = radiusKm;
  const pts: [number,number][] = Array.from({length:128}, (_, i) => {
    const a = toRad((i / 128) * 360);
    const lat = center.lat + (R / 111) * Math.cos(a);
    const lng = center.lng + (R / (111 * Math.cos(toRad(center.lat)))) * Math.sin(a);
    return [lng, lat];
  });
  pts.push(pts[0]);
  const ring: GeoJSON.Feature = { type:'Feature', properties:{}, geometry:{ type:'LineString', coordinates: pts } };
  return (
    <Source id="radius" type="geojson" data={ring}>
      <Layer id="radius-glow" type="line" paint={{ 'line-color':'#818cf8', 'line-width':3, 'line-blur':4, 'line-opacity':0.6 }} />
      <Layer id="radius-line" type="line" paint={{ 'line-color':'#a5b4fc', 'line-width':1.5, 'line-dasharray':[4,4], 'line-opacity':0.9 }} />
    </Source>
  );
}

// ─── AIRPORT ROUTE LINE (Pin to Airport) ─────────────────────────────────────────
function MapboxAirportLine({ pin, airport }: { pin: {lat:number,lng:number}, airport: {lat:number,lng:number} }) {
  const [dash, setDash] = useState(0);
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setDash(d => (d + 0.1) % 8);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);
  const geojson: GeoJSON.Feature = {
    type: 'Feature', properties: {},
    geometry: { type: 'LineString', coordinates: [[pin.lng, pin.lat], [airport.lng, airport.lat]] }
  };
  return (
    <Source id="airport-line" type="geojson" data={geojson}>
      <Layer id="airport-line-glow" type="line" paint={{ 'line-color':'#6366f1', 'line-width':4, 'line-blur':6, 'line-opacity':0.3 }} />
      <Layer id="airport-line-dash" type="line" paint={{
        'line-color': '#818cf8',
        'line-width': 1.5,
        'line-dasharray': [4, dash],
        'line-opacity': 0.8
      }} />
    </Source>
  );
}

// ─── 3. ANIMATED ROUTE LINE ─────────────────────────────────────────────────────
function MapboxRouteLine({ coords }: { coords: [number,number][], isDark: boolean }) {
  const [dash, setDash] = useState(0);
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setDash(d => (d + 0.15) % 8);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);
  const geojson: GeoJSON.Feature = {
    type: 'Feature', properties: {},
    geometry: { type: 'LineString', coordinates: coords }
  };
  return (
    <Source id="route" type="geojson" data={geojson}>
      {/* Glow */}
      <Layer id="route-glow" type="line" paint={{ 'line-color':'#38bdf8', 'line-width':8, 'line-blur':6, 'line-opacity':0.3 }} />
      {/* Animated dash */}
      <Layer id="route-line" type="line" paint={{
        'line-color': '#7dd3fc',
        'line-width': 2.5,
        'line-dasharray': [4, dash],
        'line-opacity': 0.95
      }} />
    </Source>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedLoc, setSelectedLocation] = useState<Location | null>(null);
  const [tempPin, setTempPin] = useState<{lat:number,lng:number} | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, u => setUser(u));
    return () => unsubAuth();
  }, []);
  const [mapMode, setMapMode] = useState<'search' | 'routes' | 'communities'>('search');
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: 10,
    latitude: 30,
    zoom: 2
  });
  // 3 map styles: dark nomad, satellite, light
  const [mapStyleIdx, setMapStyleIdx] = useState(0);
  const MAP_STYLES = [
    { label: '🌑 Ніч', style: 'mapbox://styles/mapbox/dark-v11' },
    { label: '🛰️ Супутник', style: 'mapbox://styles/mapbox/satellite-streets-v12' },
    { label: '☀️ День', style: 'mapbox://styles/mapbox/light-v11' },
    { label: '🧭 Навігація', style: 'mapbox://styles/mapbox/navigation-night-v1' },
  ];

  const resetMap = () => {
    setSelectedLocation(null);
    setTempPin(null);
    setViewState({ longitude: 10, latitude: 30, zoom: 2 });
  };

  const [activeTab, setActiveTab] = useState<'map' | 'layers' | 'pins' | 'profile'>('map');

  const [isDark, setIsDark] = useState(true);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showAIRecommender, setShowAIRecommender] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Lead tracking (Unified Ecosystem)
  const [leads, setLeads] = useState<any[]>([]);
  const [showAdminLeads, setShowAdminLeads] = useState(false);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'leads'), (snap) => {
      setLeads(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);
  
  // State for data layers
  const [fogState, setFogState] = useState<FogState>(buildInitialFogState());
  const [activeInterests, setActiveInterests] = useState<string[]>([]);
  const [layersExpanded, setLayersExpanded] = useState<Record<string, boolean>>({ safety: true, climate: true });
  const [currentWizardStep, setCurrentWizardStep] = useState(0);

  // ─── Map center padding reset on panel close ───────────────
  useEffect(() => {
    if (!tempPin && mapRef.current) {
      mapRef.current.easeTo({ padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
    }
  }, [tempPin]);

  // ─── Real-world conflict zone data (UCDP live API + curated fallback) ───────
  const [conflictPoints, setConflictPoints] = useState<ConflictPoint[]>([]);
  useEffect(() => {
    fetchConflictZones().then(setConflictPoints);
  }, []);

  // ─── Nearest airport (real OurAirports data + dynamic radius) ────────────────
  const [nearestAirport, setNearestAirport] = useState<NearestAirportResult | null>(null);

  // ─── Teleport API & Community Pulse ──────────────────────────────────────────
  const [communityPulse, setCommunityPulse] = useState<CommunityPulse | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    if (tempPin) {
      // Load pulse data pseudo-randomly based on coordinates
      setCommunityPulse(getCommunityPulseForLocation(tempPin.lat, tempPin.lng));
      
      // Load actual location data (BigDataCloud + Wikipedia)
      setIsLoadingLocation(true);
      getLocationData(tempPin.lat, tempPin.lng)
        .then(data => {
          setLocationData(data);
          setIsLoadingLocation(false);
        })
        .catch(() => {
          setLocationData(null);
          setIsLoadingLocation(false);
        });
    } else {
      setCommunityPulse(null);
      setLocationData(null);
    }
  }, [tempPin]);

  // ─── Danger calculation ──────────────────
  const dangerWarning = useMemo(() => {
    if (!tempPin || conflictPoints.length === 0) return null;
    let minDist = Infinity;
    for (const cp of conflictPoints) {
      const d = haversineKm(tempPin.lat, tempPin.lng, cp.lat, cp.lng);
      if (d < minDist) minDist = d;
    }
    if (minDist < 100) return { type: 'conflict', msg: `Увага! Територія в зоні збройного конфлікту (${Math.round(minDist)} км від осередку). Кінцевий стан непередбачуваний, напівекстремальний номадізм.` };
    return null;
  }, [tempPin, conflictPoints]);

  // Community Details Full Page State
  const [showCommunityDetail, setShowCommunityDetail] = useState(false);
  const [showLiveDossier, setShowLiveDossier] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(['parana-683', 'lisbon-hub', 'bali-hub']);
  const [isStreetView, setIsStreetView] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [communityData, setCommunityData] = useState<any>({
    memberCount: 12,
    resourcePledges: 45000,
    stage: 'Formation',
    roles: {}
  });
  const [memberProfiles, setMemberProfiles] = useState<any[]>([
    { uid: '1', displayName: 'Alex Nomad', photoURL: 'https://picsum.photos/seed/p1/100/100' },
    { uid: '2', displayName: 'Elena Explorer', photoURL: 'https://picsum.photos/seed/p2/100/100' },
    { uid: '3', displayName: 'Marcus Pioneer', photoURL: 'https://picsum.photos/seed/p3/100/100' }
  ]);

  const joinFormationGroup = () => {
    if (!user) {
      setShowAuthOverlay(true);
      return;
    }
    setIsJoining(true);
    setTimeout(() => {
      setIsJoining(false);
      setCommunityData((prev: any) => ({ ...prev, memberCount: prev.memberCount + 1 }));
    }, 1500);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const mockJoinAsGuest = () => {
    joinFormationGroup();
  };

  // Mobile check
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Theme tokens
  const T = {
    bg: isDark ? 'bg-stone-950' : 'bg-slate-100',
    panel: isDark ? 'bg-stone-950' : 'bg-white',
    border: isDark ? 'border-white/10' : 'border-slate-200',
    text: isDark ? 'text-stone-100' : 'text-slate-900',
    sub: isDark ? 'text-stone-400' : 'text-slate-500',
    card: isDark ? 'bg-stone-900/50' : 'bg-slate-50',
    layerCard: isDark ? 'bg-[#141311]' : 'bg-white',
  };

  const mapId = isDark ? GOOGLE_MAPS_MAP_ID_DARK : GOOGLE_MAPS_MAP_ID_LIGHT;

  const toggleFog = (id: string) => setFogState(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleInterest = (id: string) => setActiveInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const persona = assignPersona({ checkins: 0, routes: 0, places: 0, slots: 0 }); // Current user persona (Pointer)

  // FILTERED LOCATIONS LOGIC
  // In search mode: show locations when filters are applied (fog reveals them)
  const hasSearchFilters = activeInterests.length > 0 || Object.values(fogState).some(Boolean);

  const filteredLocs = LOCATIONS.filter(loc => {
    // Route mode: only saved/favorited places
    if (mapMode === 'routes' && !favorites.includes(loc.id)) return false;
    // Communities mode: only community/hubs
    if (mapMode === 'communities' && loc.type !== 'hub' && loc.type !== 'community') return false;
    // Investments mode: only real estate projects
    if (mapMode === 'investments' && loc.type !== 'asset') return false;

    // In search mode: show all locs so fog can reveal matching ones
    // but hide if no filters at all (clean initial state, no clutter)
    if (mapMode === 'search' && !hasSearchFilters) return false;

    // Interest-based filtering
    if (activeInterests.length > 0) {
      const hasInterest = activeInterests.some(i => loc.interests.includes(i));
      if (!hasInterest) return false;
    }

    return true;
  });

  // Locations matching the current search filters (used for fog holes)
  const searchMatchingLocs = mapMode === 'search' ? filteredLocs.filter(loc => {
    if (activeInterests.length > 0) return activeInterests.some(i => loc.interests.includes(i));
    return true;
  }) : [];

  return (
    <div className={`h-[100dvh] w-full overflow-hidden flex flex-col md:flex-row font-sans ${T.bg} ${T.text}`}>
      

      {/* ─── Unified Identification Modal (Delayed — only on value-action) ─── */}
      <AnimatePresence>
        {showAuthOverlay && !user && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-stone-950 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden relative">
              
              {/* Sky accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-sky-400 to-blue-600" />
              
              <div className="p-10">
                <button onClick={() => setShowAuthOverlay(false)} className="absolute top-8 right-8 text-stone-600 hover:text-white transition-colors">
                  <X size={20} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center text-stone-950 shadow-[0_6px_20px_rgba(14,165,233,0.4)]">
                    <Compass size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter leading-none">Ідентифікація</h2>
                    <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest mt-1">Slow Nomad Ecosystem Access</p>
                  </div>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const name = fd.get('name') as string;
                  const email = fd.get('email') as string;
                  const role = fd.get('role') as string;
                  try {
                    // 1. Create anonymous session
                    await signIn();
                    // 2. Save to Firestore leads
                    await addDoc(collection(db, 'leads'), {
                      name, email, role,
                      timestamp: serverTimestamp(),
                      source: 'In-App Identification'
                    });
                    setShowAuthOverlay(false);
                  } catch (err) {
                    console.error('Auth error:', err);
                    alert('Помилка підключення. Перевірте консоль.');
                  }
                }} className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] uppercase font-black tracking-widest text-stone-500 mb-2 block">Ім'я</label>
                      <input name="name" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors placeholder:text-stone-700" placeholder="Олекс..." />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-black tracking-widest text-stone-500 mb-2 block">Email</label>
                      <input name="email" type="email" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors placeholder:text-stone-700" placeholder="alex@..." />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-black tracking-widest text-stone-500 mb-2 block">Роль / Намір</label>
                    <select name="role" className="w-full bg-stone-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors cursor-pointer">
                      <option value="nomad">🌍 Slow Nomad — шукаю місця для проживання</option>
                      <option value="investor">💰 Інвестор — розгляд активів і доходності</option>
                      <option value="owner">🏠 Власник Активу — розміщення об'єкта</option>
                      <option value="community">🤝 Лідер Ком'юніті — побудова локального вузла</option>
                    </select>
                  </div>

                  <button type="submit"
                    className="w-full py-4 mt-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl font-black text-base shadow-[0_8px_24px_rgba(14,165,233,0.3)] hover:scale-[1.01] transition-all tracking-wide uppercase">
                    Увійти в Систему →
                  </button>
                </form>

                <p className="text-center text-stone-700 text-[9px] uppercase tracking-widest mt-6">
                  Безпечна анонімна сесія · KYC за потреби
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuestionnaire && <QuestionnaireModal onClose={() => setShowQuestionnaire(false)} onOpenAI={() => { setShowQuestionnaire(false); setShowAIRecommender(true); }} isDark={isDark} />}
        {showAIRecommender && (
          <ModalWrapper onClose={() => setShowAIRecommender(false)} bg={T.bg} border={T.border}>
            <div className="max-h-[85vh] overflow-y-auto w-[800px] max-w-[95vw]" style={{ scrollbarWidth: 'none' }}>
              <AIRecommender isDark={isDark} />
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* ─── DESKTOP LEFT PANEL / MOBILE BOTTOM TABS CONTENT (HUD LAYER) ─── */}
      <div className={`${isStreetView ? 'hidden' : ''} ${isMobile ? (activeTab==='map' ? 'hidden' : 'flex-1 overflow-y-auto pb-20 relative z-30 bg-black/80') : 'absolute left-0 top-0 bottom-0 w-[340px] flex flex-col z-40 bg-[#0a0a0a]/50 backdrop-blur-3xl shadow-[20px_0_40px_rgba(0,0,0,0.5)] border-r border-white/5'}`}>
        
        {/* Header - Desktop Only */}
        {!isMobile && (
          <div className={`p-5 border-b ${T.border} flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={resetMap} title="Віддалити мапу">
              <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-stone-950">
                <Compass size={18} />
              </div>
              <h1 className={`font-bold tracking-tighter text-base leading-none ${T.text}`}>Slow Nomad</h1>
            </div>
            <button onClick={() => setIsDark(!isDark)} className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${isDark ? 'bg-stone-900 border-white/10 text-stone-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'}`}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        )}

        {/* DYNAMIC LEFT PANEL WIDGETS BASED ON MODE */}
        {(!isMobile || activeTab === 'layers') && (
          <div className="flex-1 overflow-y-auto p-4 shrink-0 transition-all duration-300" style={{ scrollbarWidth: 'none' }}>
            
            {/* 1. SEARCH MODE: FOG OF WAR & INTERESTS (NOMAD DNA WIZARD) */}
            {mapMode === 'search' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500 flex flex-col h-full min-h-[400px]">
                <div className="mb-4 shrink-0 px-2">
                  <h2 className="font-bold text-lg mb-1 tracking-tight text-white/90">Nomad DNA Builder</h2>
                  <p className="text-xs text-stone-400">Сформуй персональну карту для життя. {currentWizardStep + 1} / {LAYER_CLUSTERS.length}</p>
                </div>
                
                {/* Progress bar */}
                <div className="flex gap-1 mb-6 px-2 shrink-0">
                  {LAYER_CLUSTERS.map((c, i) => (
                    <div key={c.id} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= currentWizardStep ? 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]' : 'bg-white/10'}`} />
                  ))}
                </div>

                {/* Current Category Content */}
                <div className="flex-1 overflow-y-auto mb-4 px-2" style={{ scrollbarWidth: 'none' }}>
                  {(() => {
                    const cluster = LAYER_CLUSTERS[currentWizardStep];
                    if (!cluster) return null;
                    return (
                      <motion.div
                        key={cluster.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                          <span className="text-3xl drop-shadow-md">{cluster.icon}</span>
                          <div>
                            <h3 className="font-black tracking-widest text-sm uppercase text-sky-400">{cluster.label}</h3>
                            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">
                              {cluster.id === 'safety' ? 'Жорсткі обмеження та ризики' : 
                               cluster.id === 'climate' ? 'Природні умови та стихії' : 
                               cluster.id === 'rights' ? 'Цінності та комплаєнс' : 
                               cluster.id === 'economy' ? 'Інтернет, податки, житло' : 
                               cluster.id === 'culture' ? 'Суспільна толерантність' : 
                               cluster.id === 'nature' ? 'Візуальна естетика' : 
                               'Сенси та пріоритети'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {cluster.items.map(item => {
                            if (item.type === 'interest') {
                              const isActive = activeInterests.includes(item.id);
                              return (
                                <button key={item.id} onClick={() => toggleInterest(item.id)}
                                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                                    isActive ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.15)]' : `${T.layerCard} ${T.border}`
                                  }`}>
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg opacity-80">{item.icon}</span>
                                    <span className={`text-sm tracking-wide ${isActive ? 'font-bold text-sky-400' : 'text-stone-300'}`}>{item.label}</span>
                                  </div>
                                  <div className={`w-10 h-5 rounded-full transition-colors relative ${isActive ? 'bg-sky-500' : 'bg-white/10'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${isActive ? 'left-[22px]' : 'left-0.5'}`} />
                                  </div>
                                </button>
                              );
                            } else {
                              const isActive = fogState[item.id];
                              return (
                                <button key={item.id} onClick={() => toggleFog(item.id)}
                                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                                    isActive ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.15)]' : `${T.layerCard} ${T.border}`
                                  }`}>
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg">{item.icon}</span>
                                    <span className={`text-sm tracking-wide ${isActive ? 'font-bold text-sky-400' : 'text-stone-300'}`}>{item.label}</span>
                                  </div>
                                  {item.status === 'coming-soon' ? (
                                    <span className={`text-[10px] font-black tracking-widest text-[#FFF]/30 bg-black/50 px-2 py-1 rounded-md`}>СКОРО</span>
                                  ) : (
                                    <div className={`w-10 h-5 rounded-full transition-colors relative ${isActive ? 'bg-sky-500' : 'bg-white/10'}`}>
                                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${isActive ? 'left-[22px]' : 'left-0.5'}`} />
                                    </div>
                                  )}
                                </button>
                              );
                            }
                          })}
                        </div>
                      </motion.div>
                    );
                  })()}
                </div>

                {/* Next/Prev buttons */}
                <div className="pt-4 px-2 border-t border-white/10 flex gap-2 shrink-0">
                   {currentWizardStep > 0 && (
                     <button onClick={() => setCurrentWizardStep(p=>p-1)} className="px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all text-white/70 hover:text-white uppercase tracking-wider">Назад</button>
                   )}
                   {currentWizardStep < LAYER_CLUSTERS.length - 1 ? (
                     <button onClick={() => setCurrentWizardStep(p=>p+1)} className="flex-1 py-3.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-[13px] shadow-[0_0_15px_rgba(2,132,199,0.3)] transition-all uppercase tracking-widest">Наступний Крок</button>
                   ) : (
                     <button onClick={() => {
                        if (isMobile) setActiveTab('map');
                        if (mapRef.current) mapRef.current.easeTo({ zoom: 3, duration: 1500, padding: { left: isMobile ? 0 : 340, right: 0, top: 0, bottom: 0 } });
                     }} className="flex-1 py-3.5 bg-gradient-to-r from-sky-500 to-emerald-500 hover:brightness-110 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all">Генерація Карти</button>
                   )}
                </div>
              </div>
            )}

            {/* 2. ROUTES MODE: AFFILIATES & TICKETS */}
            {mapMode === 'routes' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
                <h2 className="font-black text-xs tracking-widest uppercase text-sky-500 mb-4 px-2">Мій шлях (Бронювання)</h2>
                
                <div className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-white">Перельоти (Skyscanner)</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold">-10% Promo</span>
                  </div>
                  <p className="text-xs text-stone-400 mb-4">Знайди квитки між твоїми збереженими локаціями по найкращій ціні.</p>
                  <button className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all group-hover:shadow-[0_0_15px_rgba(2,132,199,0.5)]">Шукати квитки ✈️</button>
                </div>
                
                <div className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-white">Житло (Booking)</span>
                    <span className="text-[10px] font-bold text-stone-500">Affiliate</span>
                  </div>
                  <p className="text-xs text-stone-400 mb-4">Орендуй перевірене житло у точках маршруту.</p>
                  <button className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all group-hover:shadow-[0_0_15px_rgba(79,70,229,0.5)]">Бронювати 🏠</button>
                </div>

                <div className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                   <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-white">Insurance (Сало)</span>
                    <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-1 rounded-full font-bold">Nomad</span>
                  </div>
                  <p className="text-xs text-stone-400 mb-4">Медична страховка, що діє по всьому світу.</p>
                  <button className="w-full py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-white text-xs font-bold border border-white/5 transition-all">Оформити поліс 🛡️</button>
                </div>
              </div>
            )}

            {/* 3. COMMUNITIES MODE: EVENTS & MASTERMINDS */}
            {mapMode === 'communities' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
                 <h2 className="font-black text-xs tracking-widest uppercase text-purple-400 mb-4 px-2">Спільноти та Івенти</h2>
                 
                 <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-all cursor-pointer">
                    <h3 className="font-bold text-white mb-1">Pop-up City "Zuzalu"</h3>
                    <p className="text-xs text-stone-400 mb-3">Tech/Crypto mastermind.</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">$1,500 / тиждень</span>
                      <button className="bg-purple-600 text-white text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest hover:bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.3)]">Купити Пас</button>
                    </div>
                 </div>

                 <div className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                    <h3 className="font-bold text-white mb-1">Slow Retreat</h3>
                    <p className="text-xs text-stone-400 mb-3">Медитації та нетворкінг. 12 місць.</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Від $450</span>
                      <button className="bg-stone-700 hover:bg-stone-600 text-white text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border border-white/5">Переглянути</button>
                    </div>
                 </div>
              </div>
            )}

            {/* 4. INVESTMENTS MODE: DEAL FLOW */}
            {mapMode === 'investments' && (
               <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
                 <h2 className="font-black text-xs tracking-widest uppercase text-emerald-400 mb-4 px-2">Об'єкти (Deals)</h2>
                 
                 <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                   <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2">Фільтр дохідності</div>
                   
                   <div className="space-y-4">
                     <div>
                       <label className="text-xs text-stone-400 block mb-1">Тип активу</label>
                       <select className="w-full bg-stone-900 border border-white/10 text-white text-xs p-2 rounded-lg outline-none">
                         <option>Mixed Use</option>
                         <option>Coliving</option>
                         <option>Coworking</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-xs text-stone-400 block mb-1 flex justify-between">
                         <span>Yield (%)</span>
                         <span className="text-emerald-400 font-bold">10%+</span>
                       </label>
                       <input type="range" className="w-full accent-emerald-500" min="4" max="15" defaultValue="10" />
                     </div>
                   </div>

                   <button className="w-full mt-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">Застосувати Фільтр</button>
                 </div>

                 <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex gap-3">
                   <ShieldCheck className="text-amber-500 w-8 h-8 shrink-0" />
                   <div>
                     <h3 className="text-xs font-bold text-white">Верифіковані Брокери</h3>
                     <p className="text-[10px] text-stone-400 mt-1">Отримай контакт надійного рієлтора чи нотаріуса.</p>
                     <button className="mt-2 text-[10px] text-amber-500 uppercase tracking-widest font-black hover:underline cursor-pointer">Згенерувати Інтро →</button>
                   </div>
                 </div>
               </div>
            )}
          </div>
        )}

        {/* PROFILE TAB VIEW (Mobile) */}
        {isMobile && activeTab === 'profile' && (
          <div className="flex-1 overflow-y-auto p-6 shrink-0">
             <div className="flex items-center justify-between mb-8 text-xl font-bold">
               Мій Профіль
               <button onClick={() => setIsDark(!isDark)} className="p-2 border rounded-full">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
               </button>
             </div>
              <div className="flex items-center gap-4 mb-8">
                {user?.photoURL ? (
                  <img src={user.photoURL} className="w-16 h-16 rounded-2xl border-2 border-sky-500 shadow-lg shadow-sky-500/20" alt="" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-500 text-3xl">{persona.icon}</div>
                )}
                <div>
                  <div className="text-2xl font-black tracking-tight">{user?.displayName || 'Мандрівник'}</div>
                  <div className="text-xs text-stone-500 lowercase font-mono">{user?.email || 'unregistered@nomad'}</div>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border ${T.border} ${T.layerCard} mb-6 relative overflow-hidden group`}>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                   <Activity size={48} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-sky-500 mb-1">Поточна Персона</div>
                <div className="text-2xl font-bold my-1 flex items-center gap-2">
                  {persona.name}
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className={`text-xs ${T.sub} max-w-[200px]`}>{persona.tagline}</div>
              </div>

              <button onClick={() => logOut()} className="w-full py-4 rounded-2xl bg-red-500/5 text-red-500 border border-red-500/10 flex items-center justify-center gap-2 font-black text-xs uppercase hover:bg-red-500 hover:text-white transition-all mt-4">
                <LogOut size={16} /> Вийти з системи
              </button>
             
              <div className="space-y-4">
                {[{l:'Бронювання', v:'0'}, {l:'Крос-маршрутів', v:'0'}, {l:'Володіння слотами', v:'0'}].map(s => (
                  <div key={s.l} className={`flex justify-between py-4 border-b ${T.border}`}>
                    <span className={`text-base font-medium ${T.text}`}>{s.l}</span>
                    <span className="text-lg font-black font-mono">{s.v}</span>
                  </div>
                ))}
              </div>
           </div>
        )}
      </div>

      {/* ─── MAP AREA ─── */}
      <div 
        className={`flex-1 relative ${isDark ? 'bg-stone-900' : 'bg-slate-200'} ${isMobile && activeTab !== 'map' ? 'hidden' : 'block'}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(e) => {
          e.preventDefault();
          const target = e.dataTransfer.getData('text/plain');
          if (target === 'pegman' && mapRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const point = [e.clientX - rect.left, e.clientY - rect.top];
            const lngLat = mapRef.current.unproject(point as any);
            const pin = { lat: lngLat.lat, lng: lngLat.lng };
            setTempPin(pin);
            // Pan to the dropped point dynamically
            mapRef.current.easeTo({
              center: [pin.lng, pin.lat],
              padding: { top: 80, bottom: 40, left: 40, right: 440 },
              duration: 800,
            });
          }
        }}
      >
        {!MAPBOX_TOKEN ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-8 text-center gap-4">
            <MapPin size={40} className="text-red-400" />
            <h2 className="text-xl font-black">Mapbox Token не налаштовано</h2>
            <p className="text-stone-400 text-sm max-w-sm">Додайте <code className="bg-stone-800 px-1 rounded">VITE_MAPBOX_TOKEN=pk.eyJ1...</code> у файл <code className="bg-stone-800 px-1 rounded">.env</code> та перезапустіть сервер.</p>
          </div>
        ) : (
          <ReactMapGL
            ref={mapRef}
            {...viewState}
            onMove={e => setViewState(e.viewState)}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle={MAP_STYLES[mapStyleIdx].style}
            style={{ width: '100%', height: '100%' }}
            fog={{
              'color': 'rgb(12, 18, 32)',
              'high-color': 'rgb(4, 8, 20)',
              'horizon-blend': 0.03,
              'space-color': 'rgb(3, 5, 14)',
              'star-intensity': 0.7,
            }}
            onClick={e => {
              // Direct click on map always places/moves the scout pin
              const pin = { lat: e.lngLat.lat, lng: e.lngLat.lng };
              setTempPin(pin);
              // Fetch nearest airport
              findNearestAirport(pin.lat, pin.lng).then(setNearestAirport);
              // Center pin in remaining visible map area (accounting for 420px dossier panel on right)
              if (mapRef.current) {
                mapRef.current.easeTo({
                  center: [pin.lng, pin.lat],
                  padding: { top: 80, bottom: 40, left: 40, right: 440 },
                  duration: 600,
                });
              }
            }}
          >
{/* Navigation controls */}
            <NavigationControl position="bottom-right" />
            <GeolocateControl position="bottom-right" style={{ marginBottom: '128px' }} />

            {/* Drop Pin button — pegman style centered at bottom */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center cursor-grab active:cursor-grabbing" 
              style={{ bottom: '40px' }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', 'pegman');
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <div className="text-[10px] font-black uppercase text-white tracking-widest drop-shadow-md mb-2 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">Пегмен Розвідки</div>
              <div
                className={`w-[52px] h-[52px] flex items-center justify-center transition-all relative rounded-full border-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${
                  tempPin
                    ? 'bg-red-600 border-red-400 text-white scale-90 opacity-50 shadow-[0_0_12px_rgba(220,38,38,0.4)]'
                    : 'bg-red-600 border-white text-white hover:scale-110 hover:border-red-300'
                }`}
                title="Перетягніть Піна на мапу для розвідки!"
              >
                <UserIcon size={24} fill="currentColor" stroke="none" className="pointer-events-none drop-shadow-sm transform mt-1" />
              </div>
            </div>

            {/* ═══ NOMAD ZONE OVERLAY ═══
                 Filter-based zone indicators using Mapbox circle layers.
                 Red glow = restricted/danger zones, Blue glow = nomad-friendly.
                 NO world polygon fill — globe/satellite views stay intact. */}
            {mapMode === 'search' && (
              <NomadZoneOverlay
                locations={LOCATIONS}
                activeInterests={activeInterests}
                fogState={fogState}
                conflictPoints={conflictPoints}
              />
            )}

            {/* ③ ANIMATED route line */}
            {mapMode === 'routes' && filteredLocs.length >= 2 && (
              <MapboxRouteLine
                coords={filteredLocs.slice(0, 2).map(l => [l.lng, l.lat] as [number,number])}
                isDark={isDark}
              />
            )}

            {/* Temp Pin marker */}
            {tempPin && (
              <Marker
                longitude={tempPin.lng}
                latitude={tempPin.lat}
                anchor="bottom"
                draggable={true}
                onDragEnd={e => {
                  const pin = { lat: e.lngLat.lat, lng: e.lngLat.lng };
                  setTempPin(pin);
                  findNearestAirport(pin.lat, pin.lng).then(setNearestAirport);
                  if (mapRef.current) {
                    mapRef.current.easeTo({
                      center: [pin.lng, pin.lat],
                      padding: { top: 80, bottom: 40, left: 40, right: 440 },
                      duration: 600,
                    });
                  }
                }}
              >
                <div className="relative flex flex-col items-center justify-end h-16 cursor-grab active:cursor-grabbing group">
                  <div className="absolute bottom-0 w-8 h-3 bg-red-600/30 rounded-[50%] blur-md group-active:w-16 group-active:blur-xl group-active:opacity-20 transition-all duration-300" />
                  <motion.div 
                    animate={dangerWarning ? { scale: [1, 1.25, 1, 1.15, 1] } : { scale: 1 }}
                    transition={dangerWarning ? { repeat: Infinity, duration: 1.2, ease: "easeInOut", times: [0, 0.15, 0.3, 0.45, 1] } : undefined}
                    className="transform transition-all z-10 flex flex-col items-center origin-bottom relative pb-1 group-active:-translate-y-12 group-active:scale-110 group-active:rotate-6"
                  >
                    <UserIcon size={52} className={`${dangerWarning ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]' : 'text-[#c5221f] drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]'} transition-colors`} fill="#ea4335" strokeWidth={1} />
                    <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[14px] h-[14px] bg-[#66110f] rounded-full" />
                  </motion.div>
                </div>
              </Marker>
            )}

            {/* Airport radius circle and marker when pin is dropped */}
            {tempPin && nearestAirport && (
              <>
                <MapboxRadiusCircle 
                  center={tempPin} 
                  radiusKm={nearestAirport.radiusKm} 
                />
                <MapboxAirportLine pin={tempPin} airport={{ lat: nearestAirport.airport.lat, lng: nearestAirport.airport.lng }} />
                <Marker
                  longitude={nearestAirport.airport.lng}
                  latitude={nearestAirport.airport.lat}
                  anchor="center"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center backdrop-blur-md" title={nearestAirport.airport.name}>
                    <Plane size={16} className="text-indigo-400" />
                  </div>
                </Marker>
              </>
            )}

            {/* Location markers */}
            {filteredLocs.map(loc => {
              let fogCount = 0;
              if (fogState.conflicts && loc.risks.conflicts) fogCount++;
              if (fogState.crime && loc.risks.crime) fogCount++;
              if (fogState.property && loc.risks.property) fogCount++;
              if (fogState.disasters && loc.risks.disasters) fogCount++;
              if (fogState.short_season && loc.risks.short_season) fogCount++;
              if (fogState.visa_barriers && loc.risks.visa_barriers) fogCount++;
              const isFogged = fogCount > 0;

              // In search mode with filters: markers NOT shown here — NomadZoneOverlay handles visualization.
              // Without filters: nothing shown (clean map).
              if (mapMode === 'search') return null;

              const isSelected = selectedLoc?.id === loc.id;
              const colors = getPhaseColors(loc.phase, isFogged, isSelected, isDark);
              const isCommunity = loc.type === 'community' || loc.type === 'hub';
              return (
                <Marker key={loc.id} longitude={loc.lng} latitude={loc.lat} anchor="bottom"
                  onClick={e => { e.originalEvent.stopPropagation(); setSelectedLocation(loc); }}
                >
                  <div className="relative group cursor-pointer transition-opacity" style={{ opacity: isFogged && !isSelected ? 0.35 : 1 }}>
                    {/* ⑤ LIVE PULSE for community/hub markers */}
                    {isCommunity && !isFogged && (
                      <>
                        <div className="absolute inset-0 -m-4 rounded-full animate-ping" style={{ background: colors.glow, opacity: 0.3, animationDuration: '2s' }} />
                        <div className="absolute inset-0 -m-2 rounded-full animate-ping" style={{ background: colors.glow, opacity: 0.15, animationDuration: '3s' }} />
                      </>
                    )}
                    {/* Glow for selected */}
                    {isSelected && (
                      <div className="absolute inset-0 -m-4 rounded-full blur-xl" style={{ background: colors.glow, opacity: 0.5 }} />
                    )}
                    <div className={`w-12 h-12 flex flex-col items-center justify-center border-2 transition-all duration-300 shadow-xl ${
                      isCommunity ? 'rounded-full' : 'rounded-[16px]'
                    }`}
                      style={{ background: colors.bg, borderColor: colors.border, color: colors.text,
                        transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                        boxShadow: isSelected ? `0 0 24px 6px ${colors.glow}` : undefined
                      }}>
                      {isCommunity ? <Users size={16} strokeWidth={2.5} /> : <Home size={16} strokeWidth={2.5} />}
                      <span className="text-[10px] font-bold leading-none mt-1">{loc.phase}</span>
                    </div>
                    {!isFogged && (
                      <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter" style={{ background: colors.text, color: '#000' }}>{loc.score}</div>
                    )}
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap border shadow-2xl transition-opacity ${
                      isSelected || !isFogged ? 'opacity-100' : 'opacity-0'
                    } bg-black/80 border-white/10 text-white backdrop-blur-md`}>
                      {loc.name}
                    </div>
                  </div>
                </Marker>
              );
            })}

            {/* ④ MODE SELECTOR top bar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[50] flex bg-black/70 backdrop-blur-xl p-1 rounded-3xl border border-white/10 shadow-2xl">
              {[
                { id: 'search', icon: <Compass size={18} />, label: 'Пошук' },
                { id: 'routes', icon: <HistoryIcon size={18} />, label: 'Маршрути' },
                { id: 'communities', icon: <Users size={18} />, label: 'Спільноти' }
              ].map(m => (
                <button key={m.id} onClick={() => setMapMode(m.id as any)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-black transition-all whitespace-nowrap border ${
                  mapMode === m.id ? 'bg-sky-500/15 border-sky-500/50 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.3)]' : 'border-transparent text-stone-400 hover:text-white'
                }`}>
                  {m.icon}
                  {!isMobile && m.label}
                </button>
              ))}
            </div>

            {/* ⑤ LOGO + MAP STYLE SWITCHER — below the mode selector bar, not overlapping */}
            <div className="absolute z-[60] flex flex-col gap-2" style={{ top: '68px', left: '16px' }}>
              {/* Logo / reset */}
              <button
                onClick={() => { setViewState({longitude:10,latitude:30,zoom:2}); setTempPin(null); setSelectedLocation(null); }}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black border shadow-lg backdrop-blur-xl bg-black/70 border-white/10 text-white hover:bg-white/10 transition-all"
              >
                🌍 Slow Nomad
              </button>
              {/* Map style cycle button */}
              <button
                onClick={() => setMapStyleIdx(i => (i + 1) % MAP_STYLES.length)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border backdrop-blur-xl bg-black/60 border-white/10 text-stone-300 hover:text-white hover:bg-white/10 transition-all shadow-lg"
                title="Змінити стиль мапи"
              >
                {MAP_STYLES[mapStyleIdx].label}
                <span className="text-stone-500">→ {MAP_STYLES[(mapStyleIdx + 1) % MAP_STYLES.length].label}</span>
              </button>
            </div>
          </ReactMapGL>
        )}

        {/* Mobile Top Controls on Map */}
        {isMobile && (
          <div className="absolute top-12 left-4 right-4 flex justify-between z-10 pointer-events-none">
            <button onClick={() => setShowQuestionnaire(true)} className={`pointer-events-auto h-12 w-12 rounded-full flex items-center justify-center shadow-2xl border ${isDark ? 'bg-stone-900 border-white/10 text-white' : 'bg-white border-transparent text-black'}`}>
              <Search size={20} />
            </button>
          </div>
        )}
      </div>

      {/* ─── BOTTOM NAVIGATION (MOBILE) ─── */}
      {isMobile && !isStreetView && (
        <div className={`absolute bottom-0 left-0 right-0 h-20 ${T.panel} border-t ${T.border} flex justify-around items-center px-4 pb-4 z-50`}>
          <NavBtn id="map" icon={<MapIcon size={22} />} label="Карта" active={activeTab} set={setActiveTab} />
          <NavBtn id="layers" icon={<Layers size={22} />} label="Шари" active={activeTab} set={setActiveTab} />
          <NavBtn id="profile" icon={<UserCircle size={22} />} label="Я" active={activeTab} set={setActiveTab} />
        </div>
      )}

      {/* ─── TERRITORY DOSSIER PANEL (Pin Drop) ─── */}
      <AnimatePresence>
        {tempPin && !selectedLoc && !isStreetView && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, x: 20 }} 
            animate={{ opacity: 1, scale: 1, x: 0 }} 
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute top-[16px] right-[16px] bottom-[16px] w-[380px] z-[200] max-w-full rounded-3xl bg-[#0c1015]/40 backdrop-blur-3xl border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className={`px-5 py-4 flex items-center justify-between border-b border-white/10 shrink-0 bg-black/20`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${dangerWarning ? 'bg-red-500 animate-pulse' : 'bg-red-600'} rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.5)]`}>
                  <MapPin size={16} className="text-white" fill="white" strokeWidth={0} />
                </div>
                <div>
                  <h2 className="font-black text-sm text-white/90 leading-none">ЩО ТА ХТО ТУТ?</h2>
                  <p className="text-[10px] text-white/50 mt-0.5 tracking-wider font-mono">{tempPin.lat.toFixed(4)}, {tempPin.lng.toFixed(4)}</p>
                </div>
              </div>
              <button onClick={() => setTempPin(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all text-white/60">
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              
              {/* DANGER WARNING */}
              <AnimatePresence>
                {dangerWarning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-500/20 border-b border-red-500/30 px-5 py-4"
                  >
                    <div className="flex items-start gap-3 text-red-400 animate-pulse">
                      <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                      <div>
                        <div className="font-black text-xs tracking-widest uppercase mb-1">Спрацював Тригер Небезпеки</div>
                        <div className="text-[11px] leading-relaxed opacity-90">{dangerWarning.msg}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* PULSE */}
              {communityPulse && (
                <div className="px-5 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity size={12} className={communityPulse.activityColor} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Пульс Ком'юніті</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10 backdrop-blur-md">
                      <div className="text-base mb-1">🧳</div>
                      <div className="text-xs font-black text-emerald-400">{communityPulse.nomadsCount}</div>
                      <div className="text-[9px] text-white/50 mt-0.5 leading-tight">Номади тут</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10 backdrop-blur-md">
                      <div className="text-base mb-1">📝</div>
                      <div className="text-xs font-black text-amber-400">{communityPulse.notesCount}</div>
                      <div className="text-[9px] text-white/50 mt-0.5 leading-tight">Нотатки</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10 backdrop-blur-md">
                      <div className="text-base mb-1">📡</div>
                      <div className={`text-xs font-black ${communityPulse.activityColor}`}>{communityPulse.activityLabel}</div>
                      <div className="text-[9px] text-white/50 mt-0.5 leading-tight">Активність</div>
                    </div>
                  </div>
                  
                  {/* Notes List */}
                  {communityPulse.recentNotes.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {communityPulse.recentNotes.map((note, idx) => (
                        <div key={idx} className="bg-black/30 rounded-lg p-3 border border-white/5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <img src={note.author.photoUrl} alt={note.author.name} className="w-5 h-5 rounded-full bg-stone-800" />
                            <div className="text-[10px] font-bold text-white/80">{note.author.name} <span className="text-white/40 font-normal ml-1">· {note.author.role}</span></div>
                          </div>
                          <p className="text-[10px] text-white/60 leading-relaxed italic">"{note.text}"</p>
                          <div className="text-[8px] text-white/30 text-right mt-1">{note.time}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* LOCAL INFRASTRUCTURE (Teleport Alternative) */}
              <div className="px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Building size={12} className="text-sky-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Локальна Інфраструктура</span>
                </div>
                {isLoadingLocation ? (
                  <div className="text-[10px] text-white/40 animate-pulse text-center py-2">Синхронізація з гео-базами...</div>
                ) : locationData && locationData.scores.length > 0 ? (
                  <div>
                    <div className="text-[10px] text-white/60 mb-2">
                       Найближче місто: <span className="text-white font-bold">{locationData.city}</span> ({locationData.countryCode})
                    </div>
                    <div className="space-y-2">
                      {locationData.scores.map(s => (
                        <div key={s.name}>
                          <div className="flex justify-between text-[9px] mb-1">
                            <span className="text-white/60 uppercase">{s.name}</span>
                            <span className="font-bold text-white">{s.score}/10</span>
                          </div>
                          <div className="bg-black/40 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full" style={{ width: `${s.score * 10}%`, backgroundColor: s.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2">
                    <Compass size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-amber-200/80 leading-relaxed">
                      Обране місце для номадів з готовністю до відсутності інфраструктури. Глобальна API не має даних щодо міст поряд.
                    </div>
                  </div>
                )}
              </div>

              {/* AIRPORT */}
              <div className="px-5 py-4 border-b border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">✈️ Найближчий Аеропорт</p>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
                  <div>
                    {nearestAirport ? (
                      <>
                        <div className="text-sm font-black text-white">
                          ~{nearestAirport.distanceKm} km · {getAirportTypeLabel(nearestAirport.airport.type)}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {nearestAirport.airport.name}
                          {nearestAirport.airport.iata && <span className="text-indigo-400 ml-1">({nearestAirport.airport.iata})</span>}
                        </div>
                        <div className="text-[9px] text-stone-600 mt-0.5">
                          Радіус покриття: {nearestAirport.radiusKm} км
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-black text-white/90">Пошук...</div>
                        <div className="text-[10px] text-white/50 mt-0.5">Завантажую базу аеропортів</div>
                      </>
                    )}
                  </div>
                  <div className={`text-[9px] font-black px-2 py-1 rounded-full border ${nearestAirport ? 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30' : 'text-white/40 bg-white/5 border-white/10'}`}>
                    {nearestAirport ? 'АКТИВНО' : '...'}
                  </div>
                </div>
              </div>

              {/* ROUTES IN RADIUS */}
              <div className="px-5 py-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <HistoryIcon size={12} className="text-sky-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Маршрути Поряд</span>
                  </div>
                  <span className="text-[9px] text-sky-500 font-bold">3 у радіусі</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Winter Sun Route', stops: '8 зупинок', duration: '3 міс', dot: 'bg-sky-500' },
                    { name: 'Sahara Edge', stops: '5 зупинок', duration: '6 тижнів', dot: 'bg-amber-500' },
                    { name: 'Mediterr. Arc', stops: '12 зупинок', duration: '4 міс', dot: 'bg-emerald-500' },
                  ].map(r => (
                    <div key={r.name} className="flex items-center justify-between p-2.5 bg-stone-900/60 rounded-lg border border-white/5 cursor-pointer hover:border-sky-500/30 transition-all group">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${r.dot} shrink-0`}></div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">{r.name}</div>
                          <div className="text-[9px] text-stone-600">{r.stops}</div>
                        </div>
                      </div>
                      <div className="text-[9px] text-stone-500 font-mono">{r.duration}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PLACES - WHAT TO SEE (Wikipedia Dynamic) */}
              <div className="px-5 py-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Compass size={12} className="text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Що Тут Є</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {isLoadingLocation ? (
                    <div className="text-[10px] text-white/40 col-span-2 text-center py-2">Сканація місцевості...</div>
                  ) : locationData && locationData.places.length > 0 ? (
                    locationData.places.map(p => (
                      <div key={p.label} className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-md cursor-pointer hover:border-amber-500/50 hover:bg-white/10 transition-all group">
                        <div className="text-xl mb-2">{p.emoji}</div>
                        <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors leading-tight line-clamp-2">{p.label}</div>
                        <div className="text-[9px] text-white/40 mt-1">{p.type}</div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center text-[10px] text-white/30 italic">Реєстр точок інтересу пустий</div>
                  )}
                </div>
              </div>

              {/* COMMUNITIES */}
              <div className={`px-5 py-4 border-b ${T.border}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users size={12} className="text-purple-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Ком'юніті Поряд</span>
                  </div>
                </div>
                {filteredLocs.filter(l => l.type === 'community').slice(0, 2).length > 0 ? (
                  <div className="space-y-2">
                    {filteredLocs.filter(l => l.type === 'community').slice(0, 2).map(c => (
                      <div key={c.id} onClick={() => setSelectedLocation(c)} className="flex items-center gap-3 p-2.5 bg-stone-900/60 rounded-lg border border-white/5 cursor-pointer hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-sm shrink-0">👥</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">{c.name}</div>
                        </div>
                        <ChevronRight size={12} className="text-stone-600 group-hover:text-purple-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-stone-600 text-xs">Ком'юніті не знайдено — заснуй перше!</div>
                )}
              </div>

              {/* PEOPLE */}
              <div className={`px-5 py-4 border-b ${T.border}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <UserIcon size={12} className="text-rose-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Номади На Місці</span>
                  </div>
                  <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold">LIVE</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['alex_n', 'marina_dv', 'tomas_k', 'yuki_m', '+19'].map((u, i) => (
                    <div key={u} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${i < 4 ? 'bg-stone-900 border-white/10 text-stone-300 hover:border-rose-500/40' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                      <div className="w-3 h-3 bg-gradient-to-br from-emerald-400 to-sky-500 rounded-full"></div>
                      {u}
                    </div>
                  ))}
                </div>
              </div>

              {/* INFRASTRUCTURE */}
              <div className={`px-5 py-4 border-b ${T.border}`}>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={12} className="text-teal-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Комфорт Проживання</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Інтернет', score: 72, emoji: '📶' },
                    { label: 'Безпека', score: 65, emoji: '🛡️' },
                    { label: 'Клімат', score: 81, emoji: '☀️' },
                    { label: 'Ціни', score: 90, emoji: '💸' },
                  ].map(s => (
                    <div key={s.label} className="bg-stone-900 rounded-xl p-2.5 border border-white/5">
                      <div className="text-base mb-1">{s.emoji}</div>
                      <div className={`text-sm font-black ${s.score > 75 ? 'text-emerald-400' : s.score > 55 ? 'text-amber-400' : 'text-red-400'}`}>{s.score}</div>
                      <div className="text-[8px] text-stone-600 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTTLE NOTES */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={12} className="text-orange-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Нотатки у Пляшці 🍾</span>
                </div>
                <div className="space-y-2">
                  {[
                    { author: 'Paulo V.', text: 'Зупинився тут на 2 тижні. Інтернет ок, але картою не платять.', ago: '3 дні тому' },
                    { author: 'Katya M.', text: 'Дивовижний захід сонця! Готелі дешеві, але торгуйтесь.', ago: '2 тижні тому' },
                  ].map(n => (
                    <div key={n.author} className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black text-orange-400">{n.author}</span>
                        <span className="text-[9px] text-stone-600">{n.ago}</span>
                      </div>
                      <p className="text-[11px] text-stone-300 leading-relaxed">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BOTTOM CTAs */}
            <div className={`p-4 border-t ${T.border} space-y-2 shrink-0`}>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-white/10">
                  📌 Зберегти Пін
                </button>
                <button className="py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-white/10">
                  🍾 Залишити нотатку
                </button>
              </div>
              <button onClick={() => setShowLiveDossier(true)} className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-black text-sm shadow-[0_0_25px_rgba(79,70,229,0.35)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 border border-indigo-400/30">
                🪄 Згенерувати Повне Досьє
              </button>
              <button className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border border-emerald-500/20">
                <Users size={14} /> Заснувати Ком'юніті тут
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ─── LOCATION DETAILS PANEL ─── */}
      <AnimatePresence>
        {selectedLoc && !isStreetView && (
          <motion.div
            initial={{ x: isMobile ? 0 : '100%', y: isMobile ? '100%' : 0 }} 
            animate={{ x: 0, y: 0 }} 
            exit={{ x: isMobile ? 0 : '100%', y: isMobile ? '100%' : 0 }}
            className={`absolute ${isMobile ? 'bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl' : 'top-0 bottom-0 right-0 w-[440px]'} ${T.panel} border-l border-t ${T.border} flex flex-col z-[100] shadow-2xl`}
          >
            {isMobile && <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-slate-300 dark:bg-stone-700 z-50" />}
            
            <div className="relative h-48 shrink-0">
              <img src={selectedLoc.image} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <button onClick={() => setSelectedLocation(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white">
                <X size={14} />
              </button>
              
              <div className="absolute bottom-4 left-5 right-5">
                <div role="button" onClick={() => setShowCommunityDetail(true)} className="flex items-end justify-between cursor-pointer group/title">
                  <div className="hover:opacity-80 transition-opacity">
                    <h2 className="text-2xl font-bold text-white tracking-tight leading-tight group-hover/title:text-sky-400 flex items-center gap-2">
                      {selectedLoc.name}
                      <ArrowRight size={18} className="opacity-0 group-hover/title:opacity-100 group-hover/title:translate-x-1 transition-all" />
                    </h2>
                    <p className="text-sky-400 text-xs font-mono">{selectedLoc.country}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white leading-none">{selectedLoc.score}</div>
                  </div>
                </div>
              </div>
            </div>

            {showChat ? (
              <div className="flex-1 flex flex-col relative w-full h-[400px]">
                <button onClick={() => setShowChat(false)} className="absolute top-2 right-2 z-10 px-3 py-1 bg-stone-800 text-xs font-bold rounded-lg text-white">Back</button>
                <CommunityChat communityId={`loc_${selectedLoc.id}`} location={{ id: selectedLoc.id, name: selectedLoc.name, city: selectedLoc.name, country: selectedLoc.country, description: `A digital nomad hub in ${selectedLoc.country}.`, intellectualTags: ['Coworking', 'Networking', 'Slow Travel'] }} />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'none' }}>
                <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className={`p-4 rounded-xl border ${T.border} ${T.layerCard}`}>
                   <div className={`text-[10px] uppercase tracking-widest ${T.sub} mb-1`}>Yield</div>
                   <div className={`text-xl font-mono font-bold ${T.text}`}>{selectedLoc.yield}</div>
                 </div>
                 <div className={`p-4 rounded-xl border ${T.border} ${T.layerCard}`}>
                   <div className={`text-[10px] uppercase tracking-widest ${T.sub} mb-1`}>Entry</div>
                   <div className={`text-xl font-mono font-bold ${T.text}`}>{selectedLoc.entry}</div>
                 </div>
               </div>

               <h3 className={`font-bold text-sm ${T.text} mb-3`}>Статус локації</h3>
               <div className={`p-4 rounded-xl border ${T.border} ${T.layerCard} mb-8`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-sky-500 text-sky-500 font-bold text-lg">
                      {selectedLoc.phase}
                    </div>
                    <div>
                      <div className="font-bold text-sm">Фаза {selectedLoc.phase} / 8</div>
                      <div className={`text-xs ${T.sub}`}>Tier {selectedLoc.tier} Network Hub</div>
                    </div>
                  </div>
               </div>

               <h3 className={`font-bold text-sm ${T.text} mb-3`}>Якість & Швидкість</h3>
               <div className="flex flex-wrap gap-2 mb-8">
                  {Object.entries(selectedLoc.highlights).map(([key, val]) => {
                    if(!val) return null;
                    const labels: Record<string, string> = { nomad_visa: 'Nomad Visa', good_internet: 'Internet', high_yield: 'Yield > 8%', air_quality: 'Clean Air', happiness: 'High Happiness' };
                    return (
                      <span key={key} className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${isDark ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                        {labels[key]}
                      </span>
                    )
                  })}
               </div>

                 <div className="flex flex-col gap-3">
                  {selectedLoc.slug && (
                    <button 
                      onClick={() => { window.location.href = `/${selectedLoc.slug}`; }}
                      className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-700 text-white rounded-xl font-black text-sm shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      🧪 View Exclusive Dossier
                    </button>
                  )}
                  <button 
                    onClick={() => setShowLiveDossier(true)}
                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-black text-sm shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    🪄 Live Dossier з координат
                  </button>
                  <button onClick={() => { if (!user) setShowAuthOverlay(true); else setShowChat(true); }} className="w-full py-4 bg-stone-800 text-white rounded-xl font-bold text-sm border border-stone-700 hover:bg-stone-700 transition-colors flex items-center justify-center gap-2">
                    <MessageSquare size={16} /> Чат Локації & AI Steward
                  </button>
                  <button onClick={() => { if (!user) setShowAuthOverlay(true); else alert(`Бронювання ініційовано для ${user.displayName}`); }} className="w-full py-4 bg-sky-500 text-white rounded-xl font-bold text-sm shadow-[0_4px_20px_rgba(56,189,248,0.4)] hover:bg-sky-400">
                    Забронювати слот
                  </button>
                </div>
            </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCommunityDetail && selectedLoc && (
          <CommunityDetailPage 
            location={selectedLoc}
            communityData={communityData}
            memberProfiles={memberProfiles}
            onClose={() => setShowCommunityDetail(false)}
            joinFormationGroup={joinFormationGroup}
            isJoining={isJoining}
            user={user}
            toggleFavorite={toggleFavorite}
            favorites={favorites}
            mockJoinAsGuest={mockJoinAsGuest}
            isDark={true}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLiveDossier && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-6xl rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden bg-stone-950 border-2 border-white/10 relative"
            >
              <div className="max-h-[90vh] overflow-y-auto w-full relative" style={{ scrollbarWidth: 'none' }}>
                <button 
                  onClick={() => setShowLiveDossier(false)} 
                  className="absolute top-6 right-6 z-50 p-3 bg-white/10 backdrop-blur-xl rounded-full hover:bg-white/20 text-white transition-all shadow-xl"
                >
                  <X size={24} />
                </button>
                <LiveDossierBuilder />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* Unified System: Partner Engagement Dashboard */}
      <AnimatePresence>
        {showAdminLeads && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-stone-950 border-2 border-white/10 rounded-[40px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter text-white">Partner Engagement</h2>
                  <p className="text-stone-500 text-xs uppercase tracking-widest mt-1">Real-time leads from Pitch Deck</p>
                </div>
                <button onClick={() => setShowAdminLeads(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-stone-600">
                    <Database size={48} className="mb-4 opacity-20" />
                    <p className="font-bold text-sm uppercase tracking-widest">No leads yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {leads.map((lead: any) => (
                      <div key={lead.id} className="bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center justify-between hover:border-sky-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                            <UserIcon size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{lead.name}</h4>
                            <p className="text-sm text-stone-400 font-mono">{lead.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-sky-500 uppercase mb-1">{lead.source || 'Direct'}</div>
                          <div className="text-xs text-stone-500">{lead.timestamp?.seconds ? new Date(lead.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* System Status - Desktop UI Unification */}
      {!isMobile && (
        <div className="fixed bottom-0 left-0 right-0 h-8 bg-stone-950 border-t border-white/5 z-[300] flex items-center px-6">
          <div className="flex items-center gap-6 text-[9px] font-black font-mono text-stone-500 uppercase tracking-widest w-full">
            <div className="flex items-center gap-2 text-sky-500">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              Live Ecosystem Mode
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-2"><Activity size={10} /> Sync: Optimal</div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-2"><ShieldCheck size={10} /> Secure: AES-256</div>
            <div className="flex-1" />
            <button onClick={() => setShowAdminLeads(true)} className={`flex items-center gap-2 transition-all ${leads.length > 0 ? 'text-amber-500' : 'hover:text-white'}`}>
              <Database size={10} />
              Partner Leads: {leads.length}
              {leads.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}

function NavBtn({ id, icon, label, active, set }: { id: string, icon: any, label: string, active: string, set: (id: any) => void }) {
  const isAct = active === id;
  return (
    <button onClick={() => set(id)} className={`flex flex-col items-center gap-1 transition-colors ${isAct ? 'text-sky-500' : 'text-slate-400 dark:text-stone-500'}`}>
      {icon}
      <span className={`text-[10px] font-bold ${isAct ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
    </button>
  );
}
