import React, { useState } from 'react';
import { Sparkles, Loader2, MapPin, DollarSign, Tag } from 'lucide-react';
import { getRecommendations } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';

const PREDEFINED_TAGS = [
  'Co-working', 'Yoga', 'Surfing', 'Photography', 'Hiking', 
  'Fast WiFi', 'Quiet', 'Social', 'Vegan Friendly', 'Pet Friendly',
  'Mountain View', 'Beachfront', 'City Center', 'Eco-friendly'
];

export default function AIRecommender() {
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const toggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter(t => t !== tag));
    } else {
      setInterests([...interests, tag]);
    }
  };

  const fetchRecs = async () => {
    if (interests.length === 0) return;
    setLoading(true);
    try {
      const recs = await getRecommendations(interests);
      setResults(recs);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
          <Sparkles size={20} className="text-stone-900" />
        </div>
        <div>
          <h2 className="text-2xl font-light tracking-tight">AI Nomad Guide</h2>
          <p className="text-stone-400 text-sm">Find your next home based on your vibe</p>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-4">Select your interests</p>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleInterest(tag)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all border ${
                  interests.includes(tag) 
                    ? 'bg-emerald-500 border-emerald-500 text-stone-900' 
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:border-stone-500'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchRecs}
          disabled={loading || interests.length === 0}
          className="w-full bg-emerald-500 text-stone-900 font-semibold py-4 rounded-2xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Find My Slow Travel Spot'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {results.map((res, i) => (
          <motion.div
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-stone-800 p-6 rounded-2xl border border-stone-700 hover:border-emerald-500/50 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                {res.vibe}
              </span>
              <div className="flex items-center text-stone-400 text-xs">
                <DollarSign size={12} />
                <span>{res.cost}/mo</span>
              </div>
            </div>
            <h3 className="text-lg font-medium mb-1">{res.name}</h3>
            <div className="flex items-center gap-1 text-stone-400 text-xs mb-3">
              <MapPin size={12} />
              <span>{res.location}</span>
            </div>
            <p className="text-stone-300 text-sm leading-relaxed">
              {res.reason}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
