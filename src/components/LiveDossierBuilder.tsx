import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, Sun, Shield, DollarSign, 
  MapPin, Coffee, ShoppingCart, TreePine, 
  Activity, Globe, Edit3, Share2, Users, EyeOff, Eye, ChevronDown
} from 'lucide-react';

interface LayerData {
  id: string;
  category: string;
  title: string;
  value: string | number | null;
  unit: string;
  source: string;
  icon: React.ReactNode;
  list?: {
    name: string;
    rating?: number;
    reviews?: string;
    type?: string;
    photoUrl?: string;
  }[];
}

export default function LiveDossierBuilder() {
  const [loading, setLoading] = useState(false);
  const [dossierReady, setDossierReady] = useState(false);
  
  // State to manage visibility of blocks
  const [visibleBlocks, setVisibleBlocks] = useState({
    amenities: true,
    climate: true,
    safety: true,
    economy: true,
  });

  // Mocked state of fetched data from our backend sync layers
  const [data, setData] = useState<LayerData[]>([]);

  const toggleBlock = (block: keyof typeof visibleBlocks) => {
    setVisibleBlocks(prev => ({ ...prev, [block]: !prev[block] }));
  };

  const generateDossier = () => {
    setLoading(true);
    // Simulate real backend API fetch from our `api_sync.js`
    setTimeout(() => {
      setData([
        { 
          id: "amenity_dining", category: "amenities", title: "Кафе та Ресторани", value: 42, unit: "в радіусі 1 км", source: "OSM", 
          icon: <Coffee className="text-yellow-400" />,
          list: [
            { name: "Café Tortoni", rating: 4.8, reviews: "12k+", type: "Історична кав'ярня", photoUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=150&h=150" },
            { name: "Don Julio", rating: 4.9, reviews: "8k+", type: "Стейкхаус (Мішлен)", photoUrl: "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=150&h=150" },
            { name: "Pizzeria El Cuartito", rating: 4.7, reviews: "9.5k+", type: "Піцерія", photoUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=150&h=150" }
          ]
        },
        { 
          id: "shop_supermarket", category: "amenities", title: "Супермаркети", value: 8, unit: "в радіусі 1 км", source: "OSM", 
          icon: <ShoppingCart className="text-blue-400" />,
          list: [
            { name: "Coto", rating: 4.2, reviews: "1.2k+", type: "Гіпермаркет", photoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&h=150" },
            { name: "Carrefour Express", rating: 4.0, reviews: "450+", type: "Міні-маркет", photoUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=150&h=150" }
          ]
        },
        { 
          id: "leisure_park", category: "amenities", title: "Паркові зони", value: 3, unit: "в радіусі 1 км", source: "OSM", 
          icon: <TreePine className="text-green-500" />,
          list: [
            { name: "Plaza San Martín", rating: 4.8, reviews: "5k+", type: "Парк", photoUrl: "https://images.unsplash.com/photo-1617228800171-886d38e3e4a9?auto=format&fit=crop&w=150&h=150" }
          ]
        },
        { id: "climate_temperature", category: "climate", title: "Температура", value: 19.4, unit: "°C (Поточна)", source: "Open-Meteo", icon: <Sun className="text-orange-400" /> },
        { id: "climate_earthquake", category: "safety", title: "Ризик землетрусів", value: 0, unit: "подій >M4.5 за 30 дн.", source: "USGS", icon: <Activity className="text-red-400" /> },
        { id: "economy_ppp", category: "economy", title: "Купівельна спроможність", value: "22,500", unit: "USD (PPP) Аргентина", source: "World Bank API", icon: <DollarSign className="text-green-400" /> },
      ]);
      setLoading(false);
      setDossierReady(true);
    }, 2500);
  };

  // Group data by category for rendering
  const blocks = {
    amenities: data.filter(d => d.category === 'amenities'),
    climate: data.filter(d => d.category === 'climate'),
    safety: data.filter(d => d.category === 'safety'),
    economy: data.filter(d => d.category === 'economy'),
  };

  const blockConfig = {
    amenities: { title: "Інфраструктура (Walkability)", icon: <Building className="w-5 h-5 text-indigo-300" /> },
    climate: { title: "Клімат та Природа", icon: <Globe className="w-5 h-5 text-blue-300" /> },
    safety: { title: "Безпека та Ризики", icon: <Shield className="w-5 h-5 text-red-300" /> },
    economy: { title: "Економічні метрики", icon: <DollarSign className="w-5 h-5 text-green-300" /> },
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 font-sans text-white">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Slow Nomad: Live Dossier
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg">
            Натисніть на мапу або оберіть координати, щоб система у реальному часі зібрала дані з відритих API та сформувала живу презентацію вашого об'єкту.
          </p>
        </div>
        
        <div className="mt-6 md:mt-0 relative">
          <button 
            onClick={generateDossier}
            disabled={loading || dossierReady}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
              dossierReady 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' 
                : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30 text-white'
            }`}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Activity className="w-5 h-5" />
              </motion.div>
            ) : dossierReady ? (
              <><MapPin className="w-5 h-5" /> Дані Синхронізовано</>
            ) : (
              <><Globe className="w-5 h-5" /> Згенерувати з API</>
            )}
          </button>
        </div>
      </div>

      {/* DOSSIER BUILDER AREA */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative w-24 h-24 mb-6">
              <motion.div className="absolute inset-0 rounded-full border-t-2 border-indigo-500" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
              <motion.div className="absolute inset-2 rounded-full border-r-2 border-purple-400" animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="text-indigo-400" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-indigo-300 animate-pulse">
              Підключення до OSM, WorldBank, Open-Meteo...
            </h3>
            <p className="text-gray-500 mt-2 text-sm">Збираємо шари в єдине досьє</p>
          </motion.div>
        )}

        {dossierReady && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-6"
          >
            {/* LEFT SIDEBAR: Builder Tools */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Конструктор
                </h3>
                <div className="space-y-3">
                  {(Object.keys(blockConfig) as Array<keyof typeof blockConfig>).map((key) => (
                    <button
                      key={key}
                      onClick={() => toggleBlock(key)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-colors ${
                        visibleBlocks[key] ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-500/30' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {blockConfig[key].icon} {blockConfig[key].title}
                      </span>
                      {visibleBlocks[key] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-md rounded-xl border border-indigo-500/30 p-5 mt-4 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="font-black text-xs uppercase tracking-widest text-indigo-200">Діяти з локацією</h3>
                </div>
                
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] text-white rounded-xl p-3 transition-all font-bold text-sm shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                    <Users className="w-5 h-5" /> Створити ком'юніті
                  </button>
                  <button className="w-full flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] text-white rounded-xl p-3 transition-all font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <Building className="w-5 h-5" /> Додати об'єкт (Deal)
                  </button>
                  <button className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white rounded-xl p-3 transition-all font-bold text-sm">
                    <MapPin className="w-5 h-5" /> Залишити артефакт
                  </button>
                  <button className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/5 rounded-xl p-3 transition-all font-bold text-sm">
                    <Share2 className="w-5 h-5" /> Поділитися
                  </button>
                </div>

                <div className="mt-5 p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-stone-400 font-medium leading-relaxed">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold mb-1.5 opacity-90 uppercase tracking-widest text-[10px]">
                    <Activity size={12} /> Екосистема слідкує
                  </div>
                  Ваші об'єкти, теми чи артефакти будуть відкриті для інших учасників мапи у реальному часі.
                </div>
              </div>
            </div>

            {/* RIGHT AREA: Dossier Blocks */}
            <div className="lg:col-span-3 space-y-6">
              <AnimatePresence>
                {(Object.keys(blockConfig) as Array<keyof typeof blockConfig>).map((key) => {
                  if (!visibleBlocks[key]) return null;
                  const blockItems = blocks[key];

                  return (
                    <motion.div
                      key={key}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.3 }}
                      className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl"
                    >
                      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-white/5">
                        {blockConfig[key].icon}
                        <h2 className="text-lg font-semibold text-gray-200">{blockConfig[key].title}</h2>
                      </div>
                      
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {blockItems.map((item, idx) => (
                          <MapBlockCard key={item.id} item={item} index={idx} />
                        ))}
                        {blockItems.length === 0 && (
                          <div className="col-span-full text-center py-6 text-gray-500 text-sm">
                            Дані для цього блоку поки недоступні
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MapBlockCard({ item, index }: { item: LayerData, index: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasList = item.list && item.list.length > 0;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, layout: { type: "spring", stiffness: 300, damping: 30 } }}
      className={`bg-white/5 rounded-xl p-4 flex flex-col border border-white/10 transition-colors ${hasList ? 'hover:border-indigo-500/50 cursor-pointer hover:bg-white/10' : 'hover:bg-white/10'} ${expanded ? 'col-span-1 md:col-span-2 lg:col-span-3 shadow-2xl bg-black/40 ring-1 ring-indigo-500/30' : ''}`}
      onClick={() => hasList && setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${expanded ? 'bg-indigo-500/20 text-indigo-400' : 'bg-black/30'}`}>
            {item.icon}
          </div>
          <span className={`font-medium ${expanded ? 'text-lg text-white' : 'text-sm text-gray-200'}`}>{item.title}</span>
        </div>
        {hasList && (
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} className="text-gray-400 hover:text-white bg-white/5 rounded-full p-1.5">
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        )}
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline gap-1">
          <span className={`${expanded ? 'text-4xl' : 'text-2xl'} font-bold font-mono text-white transition-all`}>
            {item.value !== null ? item.value : 'N/A'}
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-1 flex justify-between items-center font-bold">
          <span>{item.unit}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${expanded ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-black/40 border-white/5 text-gray-300'}`}>{item.source}</span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasList && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-5 pt-5 border-t border-white/10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.list!.map((place, i) => (
                <div key={i} className="flex gap-4 items-center bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors border border-white/5 group">
                  {place.photoUrl ? (
                    <img src={place.photoUrl} alt={place.name} className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover border border-white/10 shadow-lg group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-stone-800 flex items-center justify-center text-stone-600">No Img</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base md:text-lg text-white truncate group-hover:text-indigo-300 transition-colors">{place.name}</div>
                    <div className="text-xs text-gray-400 font-medium my-0.5 truncate">{place.type}</div>
                    {(place.rating || place.reviews) && (
                      <div className="flex items-center gap-2 mt-1.5">
                        {place.rating && (
                          <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded text-xs font-bold font-mono">
                            ⭐ {place.rating.toFixed(1)}
                          </div>
                        )}
                        {place.reviews && <div className="text-[10px] text-gray-500 uppercase tracking-widest">{place.reviews} відг.</div>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 py-3 text-xs font-black text-white bg-indigo-600 uppercase tracking-widest hover:bg-indigo-500 transition-colors rounded-xl shadow-[0_4px_20px_rgba(99,102,241,0.3)]">
              Переглянути всі {item.value} об'єктів на карті 👉
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
