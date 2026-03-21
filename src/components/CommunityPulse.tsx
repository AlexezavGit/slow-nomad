import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Globe, Loader2, RefreshCw } from 'lucide-react';
import { getCommunityInsights } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface CommunityPulseProps {
  location: any;
}

export default function CommunityPulse({ location }: CommunityPulseProps) {
  const [pulseData, setPulseData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetchedId, setLastFetchedId] = useState<string | null>(null);

  const fetchPulse = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    try {
      const prompt = `Generate a short, real-time "Community Pulse" news update (max 3 bullet points) for the community located at ${location.city}, ${location.country}. Focus on relevant news, events, or cultural updates within a 10 km radius that would interest a digital nomad or expat. Keep it concise, engaging, and format each point as a markdown bullet point (using -).`;
      const insights = await getCommunityInsights(location.name, prompt);
      setPulseData(insights || null);
    } catch (error) {
      console.error("Error fetching community pulse:", error);
      setPulseData("Unable to fetch real-time pulse data at this moment.");
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    // Only fetch when the location changes (by ID), not on every render cycle
    if (!location || location.id === lastFetchedId) return;
    setLastFetchedId(location.id);
    setPulseData(null);
    fetchPulse();
  }, [location, lastFetchedId, fetchPulse]);

  return (
    <div className="bg-stone-900/50 rounded-2xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={14} className="text-emerald-500" />
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Community Pulse</h3>
        <span className="text-[8px] text-stone-500 uppercase ml-auto flex items-center gap-1">
          <Globe size={10} /> 10km Radius
        </span>
        {!loading && pulseData && (
          <button
            onClick={fetchPulse}
            className="text-stone-600 hover:text-emerald-500 transition-colors ml-1"
            title="Refresh"
          >
            <RefreshCw size={10} />
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={20} className="text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="text-xs text-stone-300 leading-relaxed">
          {pulseData ? (
            <div className="prose prose-invert prose-xs max-w-none prose-p:my-1 prose-li:my-0.5 prose-ul:my-1">
              <ReactMarkdown>{pulseData}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-stone-500 italic">No recent updates available.</p>
          )}
        </div>
      )}
    </div>
  );
}
