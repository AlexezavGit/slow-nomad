import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map as MapIcon, Users, Home, Compass, X, CheckCircle2, 
  Search, ArrowRight, Sun, Moon, Layers, MessageSquare, ChevronRight, UserCircle,
  History as HistoryIcon, TrendingUp, Shield
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

// Import our new data architecture
import { PERSONAS, assignPersona } from './data/personas';
import { LAYER_CLUSTERS, buildInitialFogState, FogState } from './data/layers';
import { LOCATIONS, getPhaseColors, Location } from './data/locations';
import AIRecommender from './components/AIRecommender';
import CommunityChat from './components/CommunityChat';
import { CommunityDetailPage } from './components/CommunityDetailPage';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_MAP_ID_DARK = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || '';
const GOOGLE_MAPS_MAP_ID_LIGHT = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID_LIGHT || GOOGLE_MAPS_MAP_ID_DARK; // Fallback to dark if light not set

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

// ─── MAP CONTROLLER ───────────────────────────────────────────────────────────
function MapController({ center }: { center: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (map && center) { map.panTo(center); map.setZoom(13); }
  }, [map, center]);
  return null;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedLoc, setSelectedLocation] = useState<Location | null>(null);
  const [mapMode, setMapMode] = useState<'search' | 'communities' | 'personal' | 'governance'>('search');
  const [activeTab, setActiveTab] = useState<'map' | 'layers' | 'pins' | 'profile'>('map');
  const [isDark, setIsDark] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showAIRecommender, setShowAIRecommender] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // State for data layers
  const [fogState, setFogState] = useState<FogState>(buildInitialFogState());
  const [activeInterests, setActiveInterests] = useState<string[]>([]);
  const [layersExpanded, setLayersExpanded] = useState<Record<string, boolean>>({ safety: true, climate: true });
  
  // Community Details Full Page State
  const [showCommunityDetail, setShowCommunityDetail] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
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
  const filteredLocs = LOCATIONS.filter(loc => {
    // Mode based filtering
    if (mapMode === 'communities' && loc.type === 'hub') return false;
    if (mapMode === 'personal' && !favorites.includes(loc.id)) return false;
    if (mapMode === 'governance' && !loc.financials) return false;

    // Interest based filtering
    if (activeInterests.length > 0) {
      const hasInterest = activeInterests.some(i => loc.interests.includes(i));
      if (!hasInterest) return false;
    }

    return true;
  });

  return (
    <div className={`h-[100dvh] w-full overflow-hidden flex flex-col md:flex-row font-sans ${T.bg} ${T.text}`}>

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

      {/* ─── DESKTOP LEFT PANEL / MOBILE BOTTOM TABS CONTENT ─── */}
      <div className={`${isMobile ? (activeTab==='map' ? 'hidden' : 'flex-1 overflow-y-auto pb-20') : 'w-[320px] flex flex-col z-40 shadow-2xl'} ${T.panel} border-r ${T.border}`}>
        
        {/* Header - Desktop Only */}
        {!isMobile && (
          <div className={`p-5 border-b ${T.border} flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-3">
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

        {/* LAYERS TAB VIEW */}
        {(!isMobile || activeTab === 'layers') && (
          <div className="flex-1 overflow-y-auto p-4 shrink-0" style={{ scrollbarWidth: 'none' }}>
            <h2 className="font-bold text-lg mb-4">Шари карти</h2>
            
            {LAYER_CLUSTERS.map(cluster => (
              <div key={cluster.id} className="mb-4">
                <button onClick={() => setLayersExpanded(p => ({...p, [cluster.id]: !p[cluster.id]}))}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <span>{cluster.icon}</span>
                    <span className="uppercase tracking-widest">{cluster.label}</span>
                  </div>
                  <ChevronRight size={16} className={`transition-transform ${layersExpanded[cluster.id] ? 'rotate-90' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {layersExpanded[cluster.id] && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="pt-2 pb-4 space-y-2 px-2">
                        {cluster.items.map(item => {
                          if (item.type === 'interest') return null; // Handled separately
                          const isActive = fogState[item.id];
                          return (
                            <button key={item.id} onClick={() => toggleFog(item.id)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                isActive 
                                  ? 'border-sky-500 bg-sky-500/10' 
                                  : `${T.layerCard} ${T.border}`
                              }`}>
                              <div className="flex items-center gap-2">
                                <span>{item.icon}</span>
                                <span className={`text-xs ${isActive ? 'font-bold text-sky-500' : T.text}`}>{item.label}</span>
                              </div>
                              {item.status === 'coming-soon' ? (
                                <span className={`text-[9px] ${T.sub}`}>СКОРО</span>
                              ) : (
                                <div className={`w-8 h-4 rounded-full transition-colors relative ${isActive ? 'bg-sky-500' : isDark ? 'bg-stone-800' : 'bg-slate-200'}`}>
                                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isActive ? 'left-[18px]' : 'left-0.5'}`} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <div className="mt-6 mb-2">
              <h3 className="font-bold text-xs uppercase tracking-widest text-sky-500 mb-3 px-2">Інтереси</h3>
              <div className="flex flex-wrap gap-2 px-2">
                {LAYER_CLUSTERS.find(c => c.id === 'interests')?.items.map(item => {
                  const isActive = activeInterests.includes(item.id);
                  return (
                    <button key={item.id} onClick={() => toggleInterest(item.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        isActive ? 'border-sky-500 bg-sky-500 text-white' : `${T.border} ${T.sub} hover:border-sky-500/50 hover:text-sky-500`
                      }`}>
                      {item.icon} {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className={`mt-8 pt-5 border-t ${T.border}`}>
               <button onClick={() => setShowQuestionnaire(true)}
                 className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl font-bold text-sm shadow-[0_4px_20px_rgba(56,189,248,0.3)] hover:opacity-90 transition-opacity">
                 Запустити підбір (AI / Хофстеде)
               </button>
            </div>
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
             <div className={`p-6 rounded-2xl border ${T.border} ${T.layerCard} mb-6`}>
               <div className="text-4xl mb-2">{persona.icon}</div>
               <div className="text-[10px] font-bold uppercase tracking-widest text-sky-500">Поточна Персона</div>
               <div className="text-2xl font-bold my-1">{persona.name}</div>
               <div className={`text-xs ${T.sub}`}>{persona.tagline}</div>
             </div>
             
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
      <div className={`flex-1 relative ${isDark ? 'bg-stone-900' : 'bg-slate-200'} ${isMobile && activeTab !== 'map' ? 'hidden' : 'block'}`}>
        {!GOOGLE_MAPS_API_KEY ? (
           <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white p-4 text-center">
             Google Maps API Key not configured
           </div>
        ) : (
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map style={{ width: '100%', height: '100%' }} defaultCenter={{ lat: 30, lng: 10 }} defaultZoom={2} mapId={mapId} disableDefaultUI={true} colorScheme={isDark ? "DARK" : "LIGHT"}>
              <MapController center={selectedLoc ? { lat: selectedLoc.lat, lng: selectedLoc.lng } : null} />

              {/* Mode Switcher Floating UI */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[50] flex bg-black/60 backdrop-blur-xl p-1.5 rounded-3xl border border-white/20 shadow-2xl">
                {[
                  { id: 'search', icon: <Compass size={18} />, label: 'Пошук / Маршрути' },
                  { id: 'communities', icon: <Users size={18} />, label: 'Комʼюніті / Обʼєкти' },
                  { id: 'personal', icon: <HistoryIcon size={18} />, label: 'Моршрути / Місця' },
                  { id: 'governance', icon: <TrendingUp size={18} />, label: 'Доходи / Голоси' }
                ].map(m => (
                  <button key={m.id} onClick={() => setMapMode(m.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${
                    mapMode === m.id ? 'bg-sky-500 text-stone-950 shadow-lg' : 'text-stone-300 hover:text-white'
                  }`}>
                    {m.icon}
                    {!isMobile && m.label}
                  </button>
                ))}
              </div>

              {filteredLocs.map(loc => {
                // Calculate fog level based on active risks
                let fogCount = 0;
                if (fogState.conflicts && loc.risks.conflicts) fogCount++;
                if (fogState.crime && loc.risks.crime) fogCount++;
                if (fogState.property && loc.risks.property) fogCount++;
                if (fogState.disasters && loc.risks.disasters) fogCount++;
                if (fogState.short_season && loc.risks.short_season) fogCount++;
                if (fogState.visa_barriers && loc.risks.visa_barriers) fogCount++;
                
                const isFogged = fogCount > 0;
                const isSelected = selectedLoc?.id === loc.id;
                const colors = getPhaseColors(loc.phase, isFogged, isSelected, isDark);

                return (
                  <AdvancedMarker key={loc.id} position={{ lat: loc.lat, lng: loc.lng }} onClick={() => setSelectedLocation(loc)} zIndex={isSelected ? 100 : isFogged ? 1 : 10}>
                    <div className="relative group cursor-pointer transition-opacity" style={{ opacity: isFogged && !isSelected ? 0.4 : 1 }}>
                      {!isFogged && !isSelected && (
                        <div className="absolute inset-0 -m-3 rounded-full blur-lg animate-pulse" style={{ background: colors.glow }} />
                      )}
                      
                      {/* Marker Shape */}
                      <div className="w-12 h-12 rounded-[20px] flex flex-col items-center justify-center border-2 transition-transform duration-300 shadow-xl"
                        style={{ background: colors.bg, borderColor: colors.border, color: colors.text, transform: isSelected ? 'scale(1.15)' : 'scale(1)' }}>
                        <Home size={18} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold leading-none mt-1">{loc.phase}</span>
                      </div>
                      
                      {!isFogged && (
                        <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter" style={{ background: colors.text, color: isDark ? '#000' : '#fff' }}>
                          {loc.score}
                        </div>
                      )}
                      
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap border-2 shadow-2xl ${
                        isSelected || !isFogged ? 'opacity-100' : 'opacity-0'
                      } ${isDark ? 'bg-stone-900 border-white/20 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                        {loc.name}
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}
            </Map>
          </APIProvider>
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
      {isMobile && (
        <div className={`absolute bottom-0 left-0 right-0 h-20 ${T.panel} border-t ${T.border} flex justify-around items-center px-4 pb-4 z-50`}>
          <NavBtn id="map" icon={<MapIcon size={22} />} label="Карта" active={activeTab} set={setActiveTab} />
          <NavBtn id="layers" icon={<Layers size={22} />} label="Шари" active={activeTab} set={setActiveTab} />
          <NavBtn id="profile" icon={<UserCircle size={22} />} label="Я" active={activeTab} set={setActiveTab} />
        </div>
      )}

      {/* ─── LOCATION DETAILS PANEL ─── */}
      <AnimatePresence>
        {selectedLoc && (
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
                 <button onClick={() => setShowChat(true)} className="w-full py-4 bg-stone-800 text-white rounded-xl font-bold text-sm border border-stone-700 hover:bg-stone-700 transition-colors flex items-center justify-center gap-2">
                   <MessageSquare size={16} /> Чат Локації & AI Steward
                 </button>
                 <button className="w-full py-4 bg-sky-500 text-white rounded-xl font-bold text-sm shadow-[0_4px_20px_rgba(56,189,248,0.4)] hover:bg-sky-400">
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
            user={{ uid: 'current-user', displayName: 'Alexey' }}
            toggleFavorite={toggleFavorite}
            favorites={favorites}
            mockJoinAsGuest={mockJoinAsGuest}
            isDark={isDark}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mapMode === 'personal' && !selectedLoc && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[90vw] md:w-[600px] bg-stone-950/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="font-bold text-sm uppercase tracking-widest text-emerald-500 mb-4">My Nomad Journey</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                <div className="text-[10px] text-stone-400 uppercase mb-1">Active Routes</div>
                <div className="text-xl font-mono font-bold">2</div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                <div className="text-[10px] text-stone-400 uppercase mb-1">Places Stayed</div>
                <div className="text-xl font-mono font-bold">8</div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                <div className="text-[10px] text-stone-400 uppercase mb-1">Current Luck</div>
                <div className="text-xl font-mono font-bold text-emerald-500">HIGH</div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                <div className="text-[10px] text-stone-400 uppercase mb-1">Upcoming Slots</div>
                <div className="text-xl font-mono font-bold text-sky-500">1</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mapMode === 'governance' && !selectedLoc && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[90vw] md:w-[600px] bg-stone-950/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="font-bold text-sm uppercase tracking-widest text-sky-500 mb-4">Governance Dashboard</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[10px] text-stone-400 uppercase mb-1">Total Yield</div>
                <div className="text-xl font-mono font-bold">$1,240 <span className="text-emerald-500 text-[10px]">/mo</span></div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[10px] text-stone-400 uppercase mb-1">Vesting Steps</div>
                <div className="text-xl font-mono font-bold">12 / 80</div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[10px] text-stone-400 uppercase mb-1">Proposals</div>
                <div className="text-xl font-mono font-bold text-amber-500">3 NEW</div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[10px] text-stone-400 uppercase mb-1">Voting Power</div>
                <div className="text-xl font-mono font-bold">4.2%</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
