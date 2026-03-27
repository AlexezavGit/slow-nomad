import React, { useState } from 'react';
import { Sparkles, Loader2, MapPin, DollarSign, Tag, User, Target, ArrowRight } from 'lucide-react';
import { getRecommendations } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';

const JOURNEY_TYPES = [
  { id: 'seeker', name: 'Шукач', description: 'Знайти місце та спільноту' },
  { id: 'proposer', name: 'Пропонувальник', description: 'Мають об\'єкт/ідею' },
  { id: 'explorer', name: 'Дослідник', description: 'Першопрохідець нових місць' },
  { id: 'custodian', name: 'Кустодіан', description: 'Управляючий об\'єктом' },
  { id: 'retirement-architect', name: 'Пенсійний архітектор', description: 'Будує мережу активів' },
  { id: 'cross-booker', name: 'Крос-букер', description: 'Оптимізує переміщення' },
  { id: 'hotelier', name: 'Готельєр', description: 'Приєднує готовий об\'єкт' },
  { id: 'thematic-traveler', name: 'Тематичний мандрівник', description: 'Подорож за темою' },
  { id: 'passive-investor', name: 'Пасивний інвестор', description: 'Тільки ROI' }
];

const PREDEFINED_TAGS = [
  'Co-working', 'Yoga', 'Surfing', 'Photography', 'Hiking',
  'Fast WiFi', 'Quiet', 'Social', 'Vegan Friendly', 'Pet Friendly',
  'Mountain View', 'Beachfront', 'City Center', 'Eco-friendly',
  'Medical Tourism', 'Wine Tourism', 'Religious Sites', 'Diving'
];

const THEMATIC_TOPICS = [
  'Медицина', 'Релігія', 'Вино', 'Серфінг', 'Дайвінг', 'Фотографія', 'Йога', 'Екологія'
];

interface AIRecommenderProps {
  isDark?: boolean;
}

export default function AIRecommender({ isDark = false }: AIRecommenderProps) {
  const [interests, setInterests] = useState<string[]>([]);
  const [journeyType, setJourneyType] = useState<string>('');
  const [thematicTopic, setThematicTopic] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Theme Tokens
  const T = {
    bg: isDark ? 'bg-stone-950' : 'bg-white',
    panel: isDark ? 'bg-stone-900' : 'bg-slate-50',
    border: isDark ? 'border-white/10' : 'border-slate-200',
    text: isDark ? 'text-stone-100' : 'text-slate-900',
    sub: isDark ? 'text-stone-400' : 'text-slate-500',
    card: isDark ? 'bg-stone-800' : 'bg-white',
  };

  const toggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter(t => t !== tag));
    } else {
      setInterests([...interests, tag]);
    }
  };

  const fetchRecs = async () => {
    if (interests.length === 0 && !journeyType) return;
    setLoading(true);
    try {
      const journeyContext = journeyType ? `Journey type: ${JOURNEY_TYPES.find(j => j.id === journeyType)?.description}. ` : '';
      const thematicContext = thematicTopic ? `Thematic focus: ${thematicTopic}. ` : '';
      const enhancedInterests = [...interests];
      if (thematicTopic) enhancedInterests.push(thematicTopic);

      const recs = await getRecommendations(enhancedInterests, journeyContext + thematicContext);
      setResults(recs || []);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${T.bg} ${T.text} p-6 md:p-10 rounded-3xl shadow-2xl border ${T.border}`}>
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
          <Sparkles size={28} className="text-stone-950" />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-none">AI Nomad Guide</h2>
          <p className={`${T.sub} text-sm md:text-base mt-1 font-medium`}>Find your next home based on your vibe</p>
        </div>
      </div>

      <div className="space-y-10 mb-10">
        {/* Journey Type Selector */}
        <div>
          <p className={`${T.sub} text-xs md:text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2`}>
            <User size={14} />
            Who are you today?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {JOURNEY_TYPES.map(journey => (
              <button
                key={journey.id}
                onClick={() => setJourneyType(journey.id)}
                className={`p-4 md:p-5 rounded-2xl text-left transition-all border-2 ${
                  journeyType === journey.id
                    ? 'bg-sky-500 border-sky-500 text-stone-950 shadow-lg'
                    : `${T.panel} ${T.border} ${T.sub} hover:border-sky-500/50`
                }`}
              >
                <div className="font-black text-sm md:text-base mb-1">{journey.name}</div>
                <div className="text-[10px] md:text-xs opacity-80 font-medium leading-tight">{journey.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Thematic Topic Selector */}
        {journeyType === 'thematic-traveler' && (
          <div>
            <p className={`${T.sub} text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2`}>
              <Target size={14} />
              Thematic Focus
            </p>
            <div className="flex flex-wrap gap-3">
              {THEMATIC_TOPICS.map(topic => (
                <button
                  key={topic}
                  onClick={() => setThematicTopic(topic)}
                  className={`px-6 py-3 rounded-full text-sm font-black transition-all border-2 ${
                    thematicTopic === topic
                      ? 'bg-purple-500 border-purple-500 text-white'
                      : `${T.panel} ${T.border} ${T.sub} hover:border-purple-500/50`
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className={`${T.sub} text-xs font-black uppercase tracking-widest mb-6`}>What do you need?</p>
          <div className="flex flex-wrap gap-3">
            {PREDEFINED_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleInterest(tag)}
                className={`px-5 py-3 rounded-full text-xs md:text-sm font-black transition-all border-2 ${
                  interests.includes(tag)
                    ? 'bg-sky-500 border-sky-500 text-stone-950 shadow-md'
                    : `${T.panel} ${T.border} ${T.sub} hover:border-sky-500/50`
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchRecs}
          disabled={loading || (interests.length === 0 && !journeyType)}
          className="w-full bg-sky-500 text-stone-950 font-black py-5 rounded-[24px] text-xl hover:bg-sky-400 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
        >
          {loading ? <Loader2 className="animate-spin" size={28} /> : (
            <>
              Explore Opportunities
              <ArrowRight size={24} />
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((res, i) => (
          <motion.div
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`${T.card} p-8 rounded-[32px] border-2 ${T.border} hover:border-sky-500/50 transition-all shadow-xl`}
          >
            <div className="flex justify-between items-start mb-6">
              <span className="bg-sky-500/20 text-sky-500 text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-sky-500/20">
                {res.vibe}
              </span>
              <div className="flex items-center text-emerald-500 font-black text-sm md:text-base">
                <DollarSign size={16} />
                <span>{res.cost}/mo</span>
              </div>
            </div>
            <h3 className="text-2xl font-black mb-1 tracking-tight leading-none">{res.name}</h3>
            <div className={`flex items-center gap-2 ${T.sub} text-xs md:text-sm mb-4 font-bold`}>
              <MapPin size={14} />
              <span>{res.location}</span>
            </div>
            <p className={`${T.sub} text-base leading-relaxed font-medium`}>
              {res.reason}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
