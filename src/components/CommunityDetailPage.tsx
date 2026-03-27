import React from 'react';
import { motion } from 'framer-motion';
import { 
  X, MapPin, Users, Target, Zap, 
  Bookmark, ArrowRight, Check, CheckCircle2, 
  ShieldCheck, Theater, Trees, Plane,
  TrendingUp, Globe, Activity
} from 'lucide-react';
import { Location } from '../data/locations';
import { AISteward } from './AISteward';

const COMMUNITY_STAGES = [
  { id: 'ideation', label: 'Ideation', minMembers: 0, goal: 10, resourceGoal: 10000, color: 'text-stone-500', bgColor: 'bg-stone-500/20', desc: 'Initial concept and core founding team formation.' },
  { id: 'formation', label: 'Formation', minMembers: 10, goal: 25, resourceGoal: 50000, color: 'text-blue-400', bgColor: 'bg-blue-400/10', desc: 'Defining values, governance, and legal structure.' },
  { id: 'pledge', label: 'Pledge', minMembers: 25, goal: 50, resourceGoal: 250000, color: 'text-amber-400', bgColor: 'bg-amber-400/10', desc: 'Resource commitment and financial planning phase.' },
  { id: 'acquisition', label: 'Acquisition', minMembers: 50, goal: 100, resourceGoal: 1000000, color: 'text-purple-400', bgColor: 'bg-purple-400/10', desc: 'Securing physical space and infrastructure.' },
  { id: 'operational', label: 'Operational', minMembers: 100, goal: 250, resourceGoal: 5000000, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', desc: 'Active community living and ongoing development.' },
];

const getCommunityStageInfo = (memberCount: number, resourcePledges: number = 0) => {
  const stageByMembers = COMMUNITY_STAGES.slice().reverse().find(s => memberCount >= s.minMembers) || COMMUNITY_STAGES[0];
  const stageByResources = COMMUNITY_STAGES.slice().reverse().find(s => resourcePledges >= s.resourceGoal) || COMMUNITY_STAGES[0];
  
  const memberIndex = COMMUNITY_STAGES.findIndex(s => s.id === stageByMembers.id);
  const resourceIndex = COMMUNITY_STAGES.findIndex(s => s.id === stageByResources.id);
  
  const finalIndex = Math.min(memberIndex, resourceIndex);
  return COMMUNITY_STAGES[finalIndex];
};

interface CommunityDetailPageProps { 
  location: Location; 
  communityData: any; 
  memberProfiles: any[];
  onClose: () => void;
  joinFormationGroup: () => void;
  isJoining: boolean;
  user: any;
  toggleFavorite: (id: string) => void;
  favorites: string[];
  mockJoinAsGuest: () => void;
  isDark?: boolean;
}

export function CommunityDetailPage({ 
  location, 
  communityData, 
  memberProfiles,
  onClose,
  joinFormationGroup,
  isJoining,
  user,
  toggleFavorite,
  favorites,
  mockJoinAsGuest,
  isDark = false
}: CommunityDetailPageProps) {
  // Theme Tokens
  const T = {
    bg: isDark ? 'bg-stone-950' : 'bg-white',
    panel: isDark ? 'bg-stone-900/50' : 'bg-slate-50',
    border: isDark ? 'border-white/10' : 'border-slate-200',
    text: isDark ? 'text-stone-100' : 'text-slate-900',
    sub: isDark ? 'text-stone-400' : 'text-slate-500',
    accent: 'text-emerald-500',
    accentBg: 'bg-emerald-500/10',
    card: isDark ? 'bg-stone-900' : 'bg-slate-100',
  };

  const images = location.images && location.images.length > 0 ? location.images : [location.image || 'https://picsum.photos/seed/default/1200/800'];
  const intellectualTags = location.intellectualTags || [];
  const neighborhoodFeatures = location.neighborhoodFeatures || [];
  const monthlyRent = location.monthlyRent || 0;
  const purchasePrice = location.purchasePrice || 0;
  const stageInfo = getCommunityStageInfo(communityData?.memberCount || 0, communityData?.resourcePledges || 0);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`fixed inset-0 z-[200] ${T.bg} ${T.text} overflow-y-auto custom-scrollbar`}
    >
      {/* Hero Section */}
      <div className="relative h-[65vh] md:h-[60vh]">
        <img src={images[0]} className="w-full h-full object-cover" alt="" />
        <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-stone-950 via-transparent to-transparent' : 'from-black/60 to-transparent'}`} />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 md:top-8 md:right-8 w-12 h-12 bg-black/20 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center hover:bg-black/40 transition-all group z-10"
        >
          <X size={24} className="group-hover:rotate-90 transition-transform text-white" />
        </button>

        <div className="absolute bottom-8 left-6 right-6 md:bottom-12 md:left-12 md:right-12">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
            <span className="px-3 py-1 bg-emerald-500 text-stone-950 text-[10px] md:text-sm font-bold uppercase tracking-widest rounded-lg">
              {location.purpose || 'Permanent Residency'}
            </span>
            <span className="px-3 py-1 bg-white/10 backdrop-blur text-white text-[10px] md:text-sm font-bold uppercase tracking-widest rounded-lg border border-white/20">
              {location.accommodationType || 'Coliving'}
            </span>
          </div>
          <h1 className="text-4xl md:text-7xl font-bold tracking-tighter mb-4 text-white drop-shadow-lg leading-none">{location.name}</h1>
          <p className="text-lg md:text-2xl text-white/90 max-w-2xl leading-relaxed font-medium drop-shadow-md">
            {location.description || 'A vibrant community hub focused on sustainable living and cultural depth.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
        {/* Left Column: Concept & Highlights */}
        <div className="md:col-span-8 space-y-12 md:space-y-24">
          <section>
            <h2 className={`text-3xl md:text-4xl font-black mb-8 flex items-center gap-4 ${T.text}`}>
              <div className="w-8 h-1 bg-emerald-500" />
              The Concept
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 text-base md:text-lg">
              <div className="space-y-6">
                <p className={`${T.sub} leading-relaxed`}>
                  This community is designed for nomads who value {intellectualTags.join(', ') || 'community and growth'}. 
                  Our vision is to create a space where knowledge flows as freely as the digital work we produce.
                </p>
                <div className={`${T.panel} border ${T.border} rounded-[32px] p-8`}>
                  <h4 className="text-emerald-500 font-bold text-sm mb-4 uppercase tracking-widest leading-loose">Intellectual Pillars</h4>
                  <ul className="space-y-4">
                    {intellectualTags.length > 0 ? intellectualTags.map(tag => (
                      <li key={tag} className="flex items-center gap-3 font-bold text-sm md:text-base">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        {tag}
                      </li>
                    )) : (
                      <li className="text-stone-500 italic">No pillars defined yet.</li>
                    )}
                  </ul>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className={`${T.sub} font-bold text-xs uppercase tracking-widest`}>Location Highlights</h4>
                <div className="grid grid-cols-1 gap-4">
                  {neighborhoodFeatures.length > 0 ? neighborhoodFeatures.map(feature => (
                    <div key={feature} className={`flex items-start gap-4 p-5 md:p-6 ${T.panel} rounded-2xl border ${T.border}`}>
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h5 className="font-bold text-base md:text-lg leading-tight">{feature}</h5>
                        <p className={`${T.sub} text-xs md:text-sm mt-1`}>Premium access within walking distance.</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-stone-500 italic">No highlights listed.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className={`text-3xl md:text-4xl font-black mb-8 flex items-center gap-4 ${T.text}`}>
              <div className="w-8 h-1 bg-emerald-500" />
              Nearby Activities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Cultural Hub', desc: 'Museums and galleries within 15 mins.', icon: <Theater size={24} /> },
                { title: 'Nature Escape', desc: 'Hiking trails and parks nearby.', icon: <Trees size={24} /> },
                { title: 'Global Access', desc: 'International airport within 3h flight radius.', icon: <Plane size={24} /> },
              ].map((act, i) => (
                <div key={i} className={`${T.card} border ${T.border} rounded-[32px] p-8 hover:border-emerald-500/30 transition-all group`}>
                  <div className={`w-14 h-14 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'} flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-stone-950 transition-all`}>
                    {act.icon}
                  </div>
                  <h4 className="font-bold text-lg mb-2">{act.title}</h4>
                  <p className={`${T.sub} text-sm leading-relaxed`}>{act.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className={`text-3xl md:text-4xl font-black mb-8 flex items-center gap-4 ${T.text}`}>
              <div className="w-8 h-1 bg-emerald-500" />
              Guidelines & Rules
            </h2>
            <div className={`${T.card} border ${T.border} rounded-[40px] p-8 md:p-12 space-y-10`}>
              <p className={`${T.sub} leading-relaxed text-base md:text-lg italic font-medium`}>
                "To maintain a harmonious and productive environment, all members and guests are expected to adhere to our core principles of respect, collaboration, and sustainability."
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                <div className="space-y-6">
                  <h4 className="text-emerald-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={20} /> Expected Conduct
                  </h4>
                  <ul className="space-y-5">
                    {[
                      'Respect quiet hours (10 PM - 8 AM) in shared residential zones.',
                      'Contribute to communal spaces maintenance and cleanliness.',
                      'Actively participate in monthly community governance meetings.',
                      'Foster an inclusive environment free from discrimination.'
                    ].map((rule, i) => (
                      <li key={i} className="flex items-start gap-4 text-sm md:text-base font-medium">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        <span className="leading-snug">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-6">
                  <h4 className="text-emerald-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={20} /> Responsibilities
                  </h4>
                  <ul className="space-y-5">
                    {[
                      'Commit to at least 2 hours of community service per month.',
                      'Adhere to sustainable waste management protocols.',
                      'Guests must be registered and briefed on community rules.',
                      'Resolve conflicts through designated mediation channels.'
                    ].map((rule, i) => (
                      <li key={i} className="flex items-start gap-4 text-sm md:text-base font-medium">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        <span className="leading-snug">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Blueprint & Booking */}
        <div className="md:col-span-4 space-y-8">
          <div className={`${T.panel} border ${T.border} rounded-[40px] p-8 md:p-10 sticky top-8 shadow-2xl overflow-hidden`}>
            
            {/* Stage Progress HUD style */}
            <div className="mb-10 text-center">
              <div className={`text-[10px] md:text-xs font-black uppercase tracking-[0.3em] ${T.sub} mb-4`}>Phase Allocation</div>
              <div className="relative inline-flex items-center justify-center p-8 border-4 border-emerald-500/20 rounded-full">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black">{location.developmentStage || communityData?.stage || 'Ideation'}</div>
                  <div className="text-[10px] font-bold uppercase text-emerald-500">{stageInfo.goal - (communityData?.memberCount || 0)} LEFT TO STAGE {COMMUNITY_STAGES[COMMUNITY_STAGES.findIndex(s=>s.id===(stageInfo.id))+1]?.label || 'MAX'}</div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-3 px-1">
                    <span>Members Committed</span>
                    <span className="text-emerald-500 font-mono">{communityData?.memberCount || 0} / {stageInfo.goal}</span>
                  </div>
                  <div className={`h-3 ${isDark ? 'bg-stone-800' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                    <div 
                      className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000"
                      style={{ width: `${Math.min(((communityData?.memberCount || 0) / (stageInfo.goal || 50)) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-3 px-1">
                    <span>Capital Pledges</span>
                    <span className="text-emerald-500 font-mono">${(communityData?.resourcePledges || 0).toLocaleString()}</span>
                  </div>
                  <div className={`h-3 ${isDark ? 'bg-stone-800' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                    <div 
                      className="h-full bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-all duration-1000"
                      style={{ width: `${Math.min(((communityData?.resourcePledges || 0) / (stageInfo.resourceGoal || 10000)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className={`pt-8 border-t ${T.border}`}>
                <h4 className={`text-[11px] font-black ${T.sub} uppercase tracking-[0.2em] mb-6`}>Founding Pioneers</h4>
                <div className="flex flex-wrap gap-3">
                  {memberProfiles.length > 0 ? memberProfiles.map(profile => (
                    <div key={profile.uid} className="relative group">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${isDark ? 'bg-stone-800' : 'bg-white shadow-md'} overflow-hidden border-2 border-emerald-500 transition-transform group-hover:scale-110`}>
                        {profile.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center"><Users size={20}/></div>}
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white"><Check size={10} strokeWidth={4}/></div>
                    </div>
                  )) : (
                    <p className="text-stone-500 italic text-xs">Waiting for first pioneers...</p>
                  )}
                </div>
              </div>

              <div className={`pt-8 border-t ${T.border} space-y-6`}>
                 <div className="grid grid-cols-1 gap-6">
                    <div className={`${T.card} p-5 rounded-2xl border ${T.border} flex justify-between items-center bg-emerald-500/5`}>
                      <span className="text-sm font-bold uppercase tracking-widest">Monthly Stay</span>
                      <span className="text-2xl font-mono font-black text-emerald-500">${monthlyRent.toLocaleString()}</span>
                    </div>
                    <div className={`${T.card} p-5 rounded-2xl border ${T.border} flex justify-between items-center`}>
                      <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Asset Buy-In</span>
                      <span className="text-2xl font-mono font-black font-bold">${purchasePrice.toLocaleString()}</span>
                    </div>
                 </div>

                <div className="space-y-4 pt-4">
                  <button 
                    onClick={user ? joinFormationGroup : mockJoinAsGuest}
                    disabled={isJoining}
                    className="w-full py-5 rounded-[24px] font-black text-lg bg-emerald-500 text-stone-950 hover:bg-emerald-400 hover:scale-[1.02] shadow-[0_12px_40px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-3 uppercase tracking-widest group"
                  >
                    {isJoining ? (
                      <div className="w-6 h-6 border-4 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    ) : (communityData?.members?.includes(user?.uid) || communityData?.members?.some((m: string) => m.startsWith('guest-'))) ? (
                      <>Group Membership Locked <CheckCircle2 size={24} /></>
                    ) : (
                      <>Join Formation Group <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" /></>
                    )}
                  </button>
                  <button 
                    onClick={() => toggleFavorite(location.id)}
                    className={`w-full py-5 border rounded-[24px] font-bold text-base transition-all flex items-center justify-center gap-3 ${
                      favorites.includes(location.id)
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                        : `${T.panel} ${T.border} ${T.sub} border-2 hover:border-sky-500 hover:text-sky-500`
                    }`}
                  >
                    <Bookmark size={20} fill={favorites.includes(location.id) ? "currentColor" : "none"} />
                    {favorites.includes(location.id) ? 'Saved to Map' : 'Bookmark this Place'}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Steward Section (Premium glassmorphic card inside) */}
            <div className="mt-10">
              <AISteward location={location} userProfile={user} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Space for extra scroll */}
      <div className="h-24 md:h-48" />
    </motion.div>
  );
}
