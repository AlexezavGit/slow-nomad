import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Loader2 } from 'lucide-react';
import { getCommunityInsights } from '../services/gemini';

interface AIStewardProps {
  location: any;
  userProfile: any;
}

export function AISteward({ location, userProfile }: AIStewardProps) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdvice = async () => {
      setLoading(true);
      try {
        const prompt = `Act as an AI Steward for a nomad community named "${location.name}". 
        The community's vibe is described as: "${location.description}".
        The user's profile is: ${userProfile ? JSON.stringify(userProfile) : 'A prospective nomad looking for a community.'}.
        Provide a short (2-3 sentences), personalized piece of advice or insight on why this community might be a good fit for them, or what they should consider before joining. Keep it encouraging but realistic.`;
        
        const response = await getCommunityInsights(location.name, prompt);
        setAdvice(response);
      } catch (error) {
        console.error('Error fetching AI Steward advice:', error);
        setAdvice("I'm currently analyzing the community data. Please check back later for personalized insights.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdvice();
  }, [location.id, userProfile]);

  return (
    <div className="bg-stone-900 border border-sky-500/20 rounded-[32px] p-8 mt-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500">
          <Bot size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-stone-200 flex items-center gap-2">
            AI Steward
            <Sparkles size={14} className="text-sky-500" />
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Personalized Insight</p>
        </div>
      </div>

      <div className="relative z-10">
        {loading ? (
          <div className="flex items-center gap-3 text-stone-400 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Analyzing community fit...
          </div>
        ) : (
          <p className="text-sm text-stone-300 leading-relaxed italic border-l-2 border-sky-500/30 pl-4">
            "{advice}"
          </p>
        )}
      </div>
    </div>
  );
}
