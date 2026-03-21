import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Map as MapIcon, 
  Users, 
  Search, 
  Filter, 
  DollarSign, 
  Home, 
  Briefcase, 
  Heart,
  ChevronRight,
  X,
  LogIn,
  LogOut,
  TrendingUp,
  Database,
  ShieldCheck,
  ArrowRight,
  Plane,
  Theater,
  Trees,
  Cpu,
  CheckCircle2,
  Layers,
  Activity,
  Globe,
  Music,
  Church,
  Scale,
  Smile,
  ShoppingBag,
  Eye,
  EyeOff,
  Bookmark,
  Check,
  Bot,
  MapPin,
  Target,
  Zap,
  Building
} from 'lucide-react';
import { auth, signIn, logOut, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, getDocFromServer, deleteField } from 'firebase/firestore';
import CommunityChat from './components/CommunityChat';
import CommunityPulse from './components/CommunityPulse';
import { CreateCommunityModal } from './components/CreateCommunityModal';
import { AISteward } from './components/AISteward';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { getCommunityInsights } from './services/gemini';

const INTEREST_TAGS = ['Religion Knowledge', 'Theater Festivals', 'Scientific Research', 'Sustainable Living', 'Digital Governance', 'Artistic Residency', 'Educational Hub', 'Fast WiFi', 'Quiet', 'Social'];
const PURPOSE_TYPES = ['Permanent Residency', 'Real Estate Buyout', 'Business Investment', 'Retirement Path', 'Knowledge Route'];

interface Location {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  monthlyRent: number;
  purchasePrice: number;
  type: string;
  purpose: string;
  tags: string[];
  intellectualTags: string[];
  description: string;
  amenities: string[];
  neighborhoodFeatures: string[];
  images: string[];
  rating: number;
  accommodationType: string;
  economicIndicators?: {
    gdpGrowth: string;
    topIndustries: string[];
    businessTypes: string[];
    innovationScore: number;
  };
  technicalSpecs?: {
    encryption: string;
    uplink: string;
    latency: string;
    nodes: string;
  };
  vibe?: string;
  climate?: string;
  developmentStage?: string;
  estimatedLoanPayment?: number;
}

const MOCK_LOCATIONS: Location[] = [
  { 
    id: 'bali', 
    name: 'The Outpost', 
    city: 'Canggu', 
    country: 'Indonesia', 
    lat: -8.6478, 
    lng: 115.1385, 
    monthlyRent: 850, 
    purchasePrice: 125000,
    type: 'Coliving',
    accommodationType: 'Coliving',
    purpose: 'Permanent Residency', 
    tags: ['Sustainable Living', 'Fast WiFi'],
    intellectualTags: ['Knowledge Hub'],
    description: 'A vibrant community hub focused on sustainable living and digital innovation. Perfect for long-term residents who value growth and connection.',
    amenities: ['Fast WiFi', 'Pool', 'Coworking Space', 'Kitchen', 'Laundry'],
    neighborhoodFeatures: ['Beachfront', 'Walkable', 'Nightlife'],
    images: [
      'https://picsum.photos/seed/bali1/800/600',
      'https://picsum.photos/seed/bali2/800/600',
      'https://picsum.photos/seed/bali3/800/600'
    ],
    rating: 4.8,
    economicIndicators: {
      gdpGrowth: '5.2%',
      topIndustries: ['Technology', 'Tourism', 'Agriculture'],
      businessTypes: ['Digital Nomad Hubs', 'Eco-Resorts', 'Agro-Tech'],
      innovationScore: 85
    },
    technicalSpecs: {
      encryption: 'AES_256',
      uplink: '102.4 GB/S',
      latency: '24ms',
      nodes: '1284'
    },
    vibe: 'Chill',
    climate: 'Tropical',
    developmentStage: 'Operational',
    estimatedLoanPayment: 650
  },
  { 
    id: 'lisbon', 
    name: 'Alfama Nest', 
    city: 'Lisbon', 
    country: 'Portugal', 
    lat: 38.7223, 
    lng: -9.1393, 
    monthlyRent: 1200, 
    purchasePrice: 450000,
    type: 'Apartment',
    accommodationType: 'Apartment',
    purpose: 'Real Estate Buyout', 
    tags: ['Quiet', 'Artistic Residency'],
    intellectualTags: ['Historic', 'Theater Festivals'],
    description: 'Experience the historic charm of Lisbon in this beautifully renovated apartment in Alfama. Dedicated to artistic residency and cultural exchange.',
    amenities: ['Kitchen', 'WiFi', 'Washer', 'Balcony', 'Coffee Maker'],
    neighborhoodFeatures: ['Historic', 'Walkable', 'Public Transit'],
    images: [
      'https://picsum.photos/seed/lisbon1/800/600',
      'https://picsum.photos/seed/lisbon2/800/600',
      'https://picsum.photos/seed/lisbon3/800/600'
    ],
    rating: 4.9,
    economicIndicators: {
      gdpGrowth: '2.3%',
      topIndustries: ['Tourism', 'Real Estate', 'Tech Startups'],
      businessTypes: ['Art Galleries', 'Boutique Hotels', 'Fintech'],
      innovationScore: 78
    },
    vibe: 'Historic',
    climate: 'Mediterranean',
    developmentStage: 'Ideation',
    estimatedLoanPayment: 2100
  },
  { 
    id: 'medellin', 
    name: 'Selina Nomad', 
    city: 'Medellin', 
    country: 'Colombia', 
    lat: 6.2442, 
    lng: -75.5812, 
    monthlyRent: 750, 
    purchasePrice: 180000,
    type: 'Villa',
    accommodationType: 'Villa',
    purpose: 'Business Investment', 
    tags: ['Social', 'Digital Governance'],
    intellectualTags: ['Theater Festivals'],
    description: 'Join a thriving community of entrepreneurs and creatives in the City of Eternal Spring. Focused on digital governance and social innovation.',
    amenities: ['Coworking Space', 'Bar', 'Yoga Studio', 'Cinema', 'Fast WiFi'],
    neighborhoodFeatures: ['Nightlife', 'Parks', 'Public Transit'],
    images: [
      'https://picsum.photos/seed/medellin1/800/600',
      'https://picsum.photos/seed/medellin2/800/600',
      'https://picsum.photos/seed/medellin3/800/600'
    ],
    rating: 4.7,
    economicIndicators: {
      gdpGrowth: '3.5%',
      topIndustries: ['Innovation', 'Textiles', 'Services'],
      businessTypes: ['Software Houses', 'Creative Agencies', 'Social Enterprises'],
      innovationScore: 82
    },
    vibe: 'Energetic',
    climate: 'Temperate',
    developmentStage: 'Land Acquisition',
    estimatedLoanPayment: 900
  },
  { 
    id: 'chiang-mai', 
    name: 'Punspace Loft', 
    city: 'Chiang Mai', 
    country: 'Thailand', 
    lat: 18.7883, 
    lng: 98.9853, 
    monthlyRent: 600, 
    purchasePrice: 95000,
    type: 'Coliving',
    accommodationType: 'Coliving',
    purpose: 'Knowledge Route', 
    tags: ['Fast WiFi', 'Quiet'],
    intellectualTags: ['Religion Knowledge', 'Educational Hub'],
    description: 'A peaceful sanctuary in the heart of Chiang Mai. Dedicated to religion knowledge and educational exchange.',
    amenities: ['Ergonomic Chairs', 'Meeting Rooms', 'Coffee Bar', 'Quiet Zone', 'Fast WiFi'],
    neighborhoodFeatures: ['Walkable', 'Parks', 'Historic'],
    images: [
      'https://picsum.photos/seed/construction1/800/600',
      'https://picsum.photos/seed/construction2/800/600'
    ],
    rating: 4.6,
    economicIndicators: {
      gdpGrowth: '4.1%',
      topIndustries: ['Education', 'Tourism', 'Handicrafts'],
      businessTypes: ['Language Schools', 'Wellness Retreats', 'Craft Workshops'],
      innovationScore: 72
    },
    vibe: 'Peaceful',
    climate: 'Tropical',
    developmentStage: 'Construction',
    estimatedLoanPayment: 450
  },
  { 
    id: 'mexico-city', 
    name: 'Roma Norte Hub', 
    city: 'Mexico City', 
    country: 'Mexico', 
    lat: 19.4194, 
    lng: -99.1611, 
    monthlyRent: 1100, 
    purchasePrice: 320000,
    type: 'Apartment',
    accommodationType: 'Apartment',
    purpose: 'Permanent Residency', 
    tags: ['Scientific Research', 'Social'],
    intellectualTags: ['Theater Festivals'],
    description: 'Live in the most artistic neighborhood of CDMX. Roma Norte offers endless inspiration and a vibrant social scene for long-term residents.',
    amenities: ['Rooftop', 'Fast WiFi', 'Fully Equipped Kitchen', 'Art Studio'],
    neighborhoodFeatures: ['Walkable', 'Parks', 'Nightlife', 'Public Transit'],
    images: [
      'https://picsum.photos/seed/mexico1/800/600',
      'https://picsum.photos/seed/mexico2/800/600'
    ],
    rating: 4.8,
    economicIndicators: {
      gdpGrowth: '2.8%',
      topIndustries: ['Manufacturing', 'Services', 'Culture'],
      businessTypes: ['Design Studios', 'Gastronomy', 'Media Production'],
      innovationScore: 80
    },
    vibe: 'Artistic',
    climate: 'Temperate',
    developmentStage: 'Operational',
    estimatedLoanPayment: 1600
  },
  { 
    id: 'cape-town', 
    name: 'Table Mountain View', 
    city: 'Cape Town', 
    country: 'South Africa', 
    lat: -33.9249, 
    lng: 18.4241, 
    monthlyRent: 950, 
    purchasePrice: 280000,
    type: 'Villa',
    accommodationType: 'Villa',
    purpose: 'Real Estate Buyout', 
    tags: ['Artistic Residency', 'Scientific Research'],
    intellectualTags: ['Environmental Science'],
    description: 'A stunning villa with views of Table Mountain. Ideal for researchers and artists looking for a permanent base in South Africa.',
    amenities: ['Pool', 'Garden', 'Fast WiFi', 'Studio Space'],
    neighborhoodFeatures: ['Nature', 'Hiking', 'Quiet'],
    images: [
      'https://picsum.photos/seed/capetown1/800/600',
      'https://picsum.photos/seed/capetown2/800/600'
    ],
    rating: 4.9,
    economicIndicators: {
      gdpGrowth: '1.9%',
      topIndustries: ['Finance', 'Tourism', 'Tech'],
      businessTypes: ['Venture Capital', 'Software Dev', 'Renewable Energy'],
      innovationScore: 75
    },
    vibe: 'Scenic',
    climate: 'Mediterranean',
    developmentStage: 'Ideation',
    estimatedLoanPayment: 1400
  },
  { 
    id: 'buenos-aires', 
    name: 'Palermo Soho Loft', 
    city: 'Buenos Aires', 
    country: 'Argentina', 
    lat: -34.5833, 
    lng: -58.4333, 
    monthlyRent: 700, 
    purchasePrice: 150000,
    type: 'Apartment',
    accommodationType: 'Apartment',
    purpose: 'Business Investment', 
    tags: ['Digital Governance', 'Social'],
    intellectualTags: ['Theater Festivals', 'Literature'],
    description: 'A premium real estate opportunity in the heart of Buenos Aires. Perfect for long-term investment or a permanent residency in a cultural capital.',
    amenities: ['Balcony', 'Fast WiFi', 'Modern Kitchen', 'Concierge'],
    neighborhoodFeatures: ['Walkable', 'Culture', 'Nightlife'],
    images: [
      'https://picsum.photos/seed/bsas1/800/600',
      'https://picsum.photos/seed/bsas2/800/600',
      'https://picsum.photos/seed/bsas3/800/600',
      'https://picsum.photos/seed/bsas4/800/600',
      'https://picsum.photos/seed/bsas5/800/600'
    ],
    rating: 4.8,
    economicIndicators: {
      gdpGrowth: '2.1%',
      topIndustries: ['Agriculture', 'Services', 'Software'],
      businessTypes: ['E-commerce', 'Agro-Tech', 'Creative Services'],
      innovationScore: 70
    },
    vibe: 'Cultural',
    climate: 'Temperate',
    developmentStage: 'Land Acquisition',
    estimatedLoanPayment: 750
  }
];

const AMENITIES = ['Fast WiFi', 'Coworking Space', 'Pool', 'Kitchen', 'Laundry', 'Gym', 'Air Conditioning', 'Pet Friendly'];
const NEIGHBORHOOD_FEATURES = ['Walkable', 'Public Transit', 'Parks', 'Nightlife', 'Quiet', 'Beachfront', 'Mountain View', 'Historic'];

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || '';

function MapController({ selectedLocation }: { selectedLocation: Location | null }) {
  const map = useMap();

  useEffect(() => {
    if (map && selectedLocation) {
      map.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng });
      map.setZoom(15);
    }
  }, [map, selectedLocation]);

  return null;
}

function MapRef({ onMapLoad, onCenterChange }: { onMapLoad: (map: any) => void, onCenterChange: (center: { lat: number, lng: number }) => void }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      onMapLoad(map);
      const listener = map.addListener('center_changed', () => {
        const center = map.getCenter();
        if (center) {
          onCenterChange({ lat: center.lat(), lng: center.lng() });
        }
      });
      return () => google.maps.event.removeListener(listener);
    }
  }, [map, onMapLoad, onCenterChange]);
  return null;
}

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
  
  // Use the lower of the two to be conservative, or the higher to be optimistic? 
  // User wants it to "better reflect community growth". Let's use a combined approach.
  const memberIndex = COMMUNITY_STAGES.findIndex(s => s.id === stageByMembers.id);
  const resourceIndex = COMMUNITY_STAGES.findIndex(s => s.id === stageByResources.id);
  
  const finalIndex = Math.min(memberIndex, resourceIndex);
  return COMMUNITY_STAGES[finalIndex];
};

function CommunityDetailPage({ 
  location, 
  communityData, 
  memberProfiles,
  onClose,
  joinFormationGroup,
  isJoining,
  user,
  toggleFavorite,
  favorites,
  mockJoinAsGuest
}: { 
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
}) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-stone-950 overflow-y-auto custom-scrollbar"
    >
      {/* Hero Section */}
      <div className="relative h-[60vh]">
        <img src={location.images[0]} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
        
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all group"
        >
          <X size={24} className="group-hover:rotate-90 transition-transform" />
        </button>

        <div className="absolute bottom-12 left-12 right-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-emerald-500 text-stone-950 text-[10px] font-bold uppercase tracking-widest rounded-lg">
              {location.purpose}
            </span>
            <span className="px-3 py-1 bg-white/10 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/10">
              {location.accommodationType}
            </span>
          </div>
          <h1 className="text-6xl font-bold tracking-tighter mb-4">{location.name}</h1>
          <p className="text-xl text-stone-400 max-w-2xl leading-relaxed">
            {location.description}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-12 py-24 grid grid-cols-12 gap-16">
        {/* Left Column: Concept & Highlights */}
        <div className="col-span-8 space-y-24">
          <section>
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-4">
              <div className="w-8 h-1 bg-emerald-500" />
              The Concept
            </h2>
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-6">
                <p className="text-stone-400 leading-relaxed">
                  This community is designed for nomads who value {location.intellectualTags?.join(', ') || 'community and growth'}. 
                  Our vision is to create a space where knowledge flows as freely as the digital work we produce.
                </p>
                <div className="bg-stone-900/50 border border-white/5 rounded-3xl p-8">
                  <h4 className="text-emerald-500 font-bold text-sm mb-4 uppercase tracking-widest">Intellectual Pillars</h4>
                  <ul className="space-y-4">
                    {location.intellectualTags?.map(tag => (
                      <li key={tag} className="flex items-center gap-3 text-stone-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-stone-500 font-bold text-xs uppercase tracking-widest">Location Highlights</h4>
                <div className="grid grid-cols-1 gap-4">
                  {location.neighborhoodFeatures.map(feature => (
                    <div key={feature} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <MapIcon size={20} />
                      </div>
                      <div>
                        <h5 className="text-stone-200 font-bold text-sm">{feature}</h5>
                        <p className="text-stone-500 text-[11px]">Premium access within walking distance.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-4">
              <div className="w-8 h-1 bg-emerald-500" />
              Nearby Activities
            </h2>
            <div className="grid grid-cols-3 gap-6">
              {[
                { title: 'Cultural Hub', desc: 'Museums and galleries within 15 mins.', icon: <Theater size={20} /> },
                { title: 'Nature Escape', desc: 'Hiking trails and parks nearby.', icon: <Trees size={20} /> },
                { title: 'Global Access', desc: 'International airport within 3h flight radius.', icon: <Plane size={20} /> },
              ].map((act, i) => (
                <div key={i} className="bg-stone-900 border border-white/5 rounded-3xl p-6 hover:border-emerald-500/30 transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-stone-950 transition-all">
                    {act.icon}
                  </div>
                  <h4 className="text-stone-200 font-bold mb-2">{act.title}</h4>
                  <p className="text-stone-500 text-xs leading-relaxed">{act.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-4">
              <div className="w-8 h-1 bg-emerald-500" />
              Community Guidelines & Conduct
            </h2>
            <div className="bg-stone-900 border border-white/5 rounded-[32px] p-8 space-y-8">
              <p className="text-stone-400 leading-relaxed text-sm">
                To maintain a harmonious and productive environment, all members and guests are expected to adhere to our core principles of respect, collaboration, and sustainability.
              </p>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-emerald-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={16} /> Expected Conduct
                  </h4>
                  <ul className="space-y-3">
                    {[
                      'Respect quiet hours (10 PM - 8 AM) in shared residential zones.',
                      'Contribute to communal spaces maintenance and cleanliness.',
                      'Actively participate in monthly community governance meetings.',
                      'Foster an inclusive environment free from discrimination.'
                    ].map((rule, i) => (
                      <li key={i} className="flex items-start gap-3 text-stone-300 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-emerald-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={16} /> Shared Responsibilities
                  </h4>
                  <ul className="space-y-3">
                    {[
                      'Commit to at least 2 hours of community service per month.',
                      'Adhere to sustainable waste management and recycling protocols.',
                      'Guests must be registered and briefed on community rules.',
                      'Resolve conflicts through designated mediation channels.'
                    ].map((rule, i) => (
                      <li key={i} className="flex items-start gap-3 text-stone-300 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Co-Owners & Financials */}
        <div className="col-span-4 space-y-8">
          <div className="bg-stone-900 border border-white/5 rounded-[32px] p-8 sticky top-8">
            <h3 className="text-xl font-bold mb-8">Community Blueprint</h3>
            
            <div className="space-y-8">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-4">
                  <span>Formation Status</span>
                  <span className="text-emerald-500">{location.developmentStage || communityData?.stage || 'Ideation'}</span>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-2">
                      <span>Members</span>
                      <span>{communityData?.memberCount || 0} / {getCommunityStageInfo(communityData?.memberCount || 0, communityData?.resourcePledges || 0).goal}</span>
                    </div>
                    <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                        style={{ width: `${Math.min(((communityData?.memberCount || 0) / (getCommunityStageInfo(communityData?.memberCount || 0, communityData?.resourcePledges || 0).goal || 50)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-2">
                      <span>Resource Pledges</span>
                      <span>${(communityData?.resourcePledges || 0).toLocaleString()} / ${(getCommunityStageInfo(communityData?.memberCount || 0, communityData?.resourcePledges || 0).resourceGoal || 10000).toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                        style={{ width: `${Math.min(((communityData?.resourcePledges || 0) / (getCommunityStageInfo(communityData?.memberCount || 0, communityData?.resourcePledges || 0).resourceGoal || 10000)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-6">Founding Members</h4>
                <div className="space-y-4">
                  {memberProfiles.map(profile => (
                    <div key={profile.uid} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-stone-800 overflow-hidden border border-white/10">
                        {profile.photoURL ? (
                          <img src={profile.photoURL} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-600">
                            <Users size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-stone-200">{profile.displayName}</div>
                        <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">
                          {communityData.roles?.[profile.uid] || 'Member'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 text-xs">Monthly Contribution</span>
                  <span className="text-white font-mono font-bold">${location.monthlyRent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 text-xs">Equity Share (Buy)</span>
                  <span className="text-white font-mono font-bold">${location.purchasePrice}</span>
                </div>
                {location.estimatedLoanPayment && (
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 text-xs">Est. Monthly Loan</span>
                    <span className="text-white font-mono font-bold">${location.estimatedLoanPayment}</span>
                  </div>
                )}
                <div className="flex gap-3">
                  <button 
                    onClick={() => toggleFavorite(location.id)}
                    className={`flex-1 py-4 border rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      favorites.includes(location.id)
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                        : 'bg-stone-900 border-white/10 text-stone-400 hover:border-white/30'
                    }`}
                  >
                    <Bookmark size={18} fill={favorites.includes(location.id) ? "currentColor" : "none"} />
                    {favorites.includes(location.id) ? 'Saved' : 'Favorite'}
                  </button>
                  <button 
                    onClick={user ? joinFormationGroup : mockJoinAsGuest}
                    disabled={isJoining}
                    className={`flex-[2] py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
                      communityData?.members?.includes(user?.uid) || (communityData?.members?.some((m: string) => m.startsWith('guest-')))
                        ? 'bg-stone-800 text-stone-400 border border-white/10'
                        : 'bg-emerald-500 text-stone-950 hover:bg-emerald-400 shadow-emerald-500/20'
                    }`}
                  >
                    {isJoining ? (
                      <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    ) : (communityData?.members?.includes(user?.uid) || communityData?.members?.some((m: string) => m.startsWith('guest-'))) ? (
                      <>Joined Group <Check size={18} /></>
                    ) : (
                      <>Join Formation Group <ArrowRight size={18} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Rental Policy Section */}
            <div className="bg-stone-900 border border-white/5 rounded-[32px] p-8 mt-8">
              <h3 className="text-lg font-serif italic text-stone-200 mb-6">Rental & Cross-Booking Policy</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">Member Exclusive</h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Short-term rentals are restricted to active community members. This enables seamless cross-booking between our global locations, fostering a truly mobile and connected lifestyle.
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">External Guests</h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Standard short-term rentals for non-members are directed to external platforms like Airbnb or Booking.com to maintain the integrity and privacy of our formation groups.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Steward Section */}
            <AISteward location={location} userProfile={user} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [activeLayer, setActiveLayer] = useState<'none' | 'economic' | 'social' | 'cultural' | 'politics' | 'religion' | 'acceptance' | 'strata' | 'entertainment' | 'communities' | 'accommodation'>('none');
  const [openLegendId, setOpenLegendId] = useState<string | null>(null);
  const [visibleSources, setVisibleSources] = useState<string[]>(['NomadList', 'Teleport', 'WorldBank', 'UNESCO', 'Airbnb', 'Meetup']);
  const [communityInsights, setCommunityInsights] = useState<string | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [filters, setFilters] = useState({
    interests: [] as string[],
    amenities: [] as string[],
    neighborhoodFeatures: [] as string[],
    purpose: 'All',
    minPrice: 0,
    maxPrice: 5000,
    minRating: 0,
    vibe: 'Any',
    climate: 'Any'
  });
  const [communityData, setCommunityData] = useState<any>(null);
  const [memberProfiles, setMemberProfiles] = useState<any[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [showCommunityDetail, setShowCommunityDetail] = useState(false);
  const [priceType, setPriceType] = useState<'rent' | 'buy'>('rent');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [searchRadius, setSearchRadius] = useState(1000); // km
  const [isSearchAroundActive, setIsSearchAroundActive] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showLocationList, setShowLocationList] = useState(!GOOGLE_MAPS_API_KEY);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [googleMap, setGoogleMap] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userDocRef = doc(db, 'users', u.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, { uid: u.uid, displayName: u.displayName, email: u.email, photoURL: u.photoURL, favorites: [] });
        } else {
          setFavorites(userDoc.data().favorites || []);
        }
        setUser(u);
      } else {
        setUser(null);
        setFavorites([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error: any) {
      console.error("Sign in error:", error);
      if (error.code === 'auth/popup-blocked') {
        setAlertMessage("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setAlertMessage("This domain is not authorized for Firebase Authentication. Please add it in the Firebase Console under Authentication > Settings > Authorized domains.");
      } else {
        setAlertMessage(`Sign-in failed: ${error.message}`);
      }
    }
  };

  const toggleFavorite = async (locationId: string) => {
    if (!user) {
      handleSignIn();
      return;
    }

    const newFavorites = favorites.includes(locationId)
      ? favorites.filter(id => id !== locationId)
      : [...favorites, locationId];
    
    setFavorites(newFavorites);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        favorites: newFavorites
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      const communityDocRef = doc(db, 'communities', selectedLocation.id);
      const unsub = onSnapshot(communityDocRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setCommunityData(data);
          
          // Fetch member profiles
          if (data.members && data.members.length > 0) {
            try {
              const profiles = await Promise.all(
                data.members.slice(0, 10).map(async (uid: string) => {
                  const uDoc = await getDoc(doc(db, 'users', uid));
                  return uDoc.exists() ? uDoc.data() : { uid, displayName: 'Nomad' };
                })
              );
              setMemberProfiles(profiles);
            } catch (error) {
              handleFirestoreError(error, OperationType.GET, 'users');
            }
          } else {
            setMemberProfiles([]);
          }
        } else {
          try {
            const initialStage = getCommunityStageInfo(0).label;
            await setDoc(communityDocRef, { 
              locationId: selectedLocation.id, 
              stage: initialStage, 
              members: [], 
              memberCount: 0,
              roles: {}
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `communities/${selectedLocation.id}`);
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `communities/${selectedLocation.id}`);
      });
      return () => unsub();
    }
  }, [selectedLocation]);

  const joinFormationGroup = async () => {
    if (!user || !selectedLocation) return;
    setIsJoining(true);
    try {
      const communityDocRef = doc(db, 'communities', selectedLocation.id);
      const isMember = communityData?.members?.includes(user.uid);
      
      const newMembers = isMember 
        ? communityData.members.filter((m: string) => m !== user.uid)
        : [...(communityData?.members || []), user.uid];
      
      const memberCount = newMembers.length;
      const resourcePledges = (communityData?.resourcePledges || 0) + (isMember ? -5000 : 5000); // Mock pledge
      const stageInfo = getCommunityStageInfo(memberCount, resourcePledges);

      const updates: any = {
        members: isMember ? arrayRemove(user.uid) : arrayUnion(user.uid),
        memberCount: memberCount,
        resourcePledges: Math.max(0, resourcePledges),
        stage: stageInfo.label
      };

      // Assign 'Admin' role to the first member
      if (!isMember && memberCount === 1) {
        updates[`roles.${user.uid}`] = 'Admin';
      } else if (isMember) {
        // Remove role if leaving
        updates[`roles.${user.uid}`] = deleteField();
      }

      await updateDoc(communityDocRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `communities/${selectedLocation.id}`);
    } finally {
      setIsJoining(false);
    }
  };

  const mockJoinAsGuest = () => {
    if (!selectedLocation) return;
    setIsJoining(true);
    setTimeout(() => {
      setCommunityData((prev: any) => ({
        ...prev,
        memberCount: (prev?.memberCount || 0) + 1,
        resourcePledges: (prev?.resourcePledges || 0) + 5000,
        members: [...(prev?.members || []), 'guest-' + Math.random().toString(36).substr(2, 9)],
        stage: getCommunityStageInfo((prev?.memberCount || 0) + 1, (prev?.resourcePledges || 0) + 5000).label
      }));
      setIsJoining(false);
    }, 1000);
  };

  const assignRole = async (memberUid: string, role: string) => {
    if (!user || !selectedLocation || !communityData) return;
    const isAdmin = communityData.roles?.[user.uid] === 'Admin';
    if (!isAdmin) return;

    try {
      const communityDocRef = doc(db, 'communities', selectedLocation.id);
      await updateDoc(communityDocRef, {
        [`roles.${memberUid}`]: role
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `communities/${selectedLocation.id}`);
    }
  };

  const toggleInterest = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(tag) 
        ? prev.interests.filter(t => t !== tag) 
        : [...prev.interests, tag]
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity) 
        ? prev.amenities.filter(a => a !== amenity) 
        : [...prev.amenities, amenity]
    }));
  };

  const toggleNeighborhoodFeature = (feature: string) => {
    setFilters(prev => ({
      ...prev,
      neighborhoodFeatures: prev.neighborhoodFeatures.includes(feature) 
        ? prev.neighborhoodFeatures.filter(f => f !== feature) 
        : [...prev.neighborhoodFeatures, feature]
    }));
  };

  // Fetch Community Insights when location is selected
  useEffect(() => {
    async function fetchInsights() {
      if (!selectedLocation) {
        setCommunityInsights(null);
        return;
      }

      setIsInsightsLoading(true);
      try {
        const insights = await getCommunityInsights(selectedLocation.name);
        setCommunityInsights(insights);
      } catch (error) {
        console.error('Error fetching community insights:', error);
        setCommunityInsights("Unable to load community insights at this time.");
      } finally {
        setIsInsightsLoading(false);
      }
    }

    fetchInsights();
  }, [selectedLocation]);

  const filteredLocations = MOCK_LOCATIONS.filter(loc => {
    const matchesInterests = filters.interests.length === 0 || 
      filters.interests.every(interest => loc.tags.includes(interest) || loc.intellectualTags?.includes(interest));
    const matchesPurpose = filters.purpose === 'All' || loc.purpose === filters.purpose;
    
    const price = priceType === 'rent' ? loc.monthlyRent : loc.purchasePrice;
    const matchesPrice = price >= filters.minPrice && price <= filters.maxPrice;
    
    const matchesRating = loc.rating >= filters.minRating;
    
    const matchesAmenities = filters.amenities.length === 0 || 
      filters.amenities.every(amenity => loc.amenities.includes(amenity));
    
    const matchesNeighborhood = filters.neighborhoodFeatures.length === 0 || 
      filters.neighborhoodFeatures.some(feature => loc.neighborhoodFeatures.includes(feature));
    
    const matchesVibe = filters.vibe === 'Any' || loc.vibe === filters.vibe;
    const matchesClimate = filters.climate === 'Any' || loc.climate === filters.climate;

    const searchOrigin = selectedLocation || { lat: mapCenter.lat, lng: mapCenter.lng };
    const matchesRadius = !isSearchAroundActive || 
      calculateDistance(searchOrigin.lat, searchOrigin.lng, loc.lat, loc.lng) <= searchRadius;

    return matchesInterests && matchesPurpose && matchesPrice && matchesRating && matchesAmenities && matchesNeighborhood && matchesVibe && matchesClimate && matchesRadius;
  });

  return (
    <div className="h-screen w-full bg-stone-950 text-stone-100 overflow-hidden flex flex-col font-sans">
      {/* Top Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto bg-stone-900/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-stone-950">
            <Compass size={18} />
          </div>
          <span className="font-bold tracking-tighter text-xl">Slow Nomad</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-4">
          <button 
            onClick={() => setShowCreateCommunity(true)}
            className="bg-stone-800 border border-white/10 text-white px-4 py-2 rounded-2xl font-bold text-xs shadow-lg hover:bg-stone-700 transition-all flex items-center gap-2"
          >
            <Building size={14} />
            Create Community
          </button>
          {user ? (
            <div className="flex items-center gap-4 bg-stone-900/80 backdrop-blur-xl px-3 py-2 rounded-2xl border border-white/10 shadow-2xl">
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 hover:text-emerald-500 transition-colors"
              >
                <img src={user.photoURL} className="w-8 h-8 rounded-full border border-white/20" alt="" />
                <span className="text-xs font-bold hidden md:block">{user.displayName}</span>
              </button>
              <div className="w-px h-4 bg-white/10" />
              <button onClick={logOut} className="text-stone-400 hover:text-white transition-colors"><LogOut size={18} /></button>
            </div>
          ) : (
            <button onClick={handleSignIn} className="bg-emerald-500 text-stone-950 px-6 py-2 rounded-2xl font-bold text-sm shadow-lg hover:bg-emerald-400 transition-all">Sign In</button>
          )}
        </div>
      </nav>

      {/* Create Community Modal */}
      <AnimatePresence>
        {showCreateCommunity && (
          <CreateCommunityModal 
            onClose={() => setShowCreateCommunity(false)} 
            onSubmit={(data) => {
              console.log('Community data:', data);
              // Here you would typically save to Firestore
              setAlertMessage(`Community "${data.name}" created successfully!`);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Alert Modal */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-stone-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <p className="text-stone-200 mb-6">{alertMessage}</p>
              <button 
                onClick={() => setAlertMessage(null)}
                className="bg-emerald-500 text-stone-950 px-6 py-2 rounded-2xl font-bold text-sm w-full hover:bg-emerald-400 transition-colors"
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile / Favorites Overlay */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-24 right-6 bottom-24 w-80 z-[60] bg-stone-900/95 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl p-8 overflow-y-auto custom-scrollbar flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Your Profile</h3>
              <button onClick={() => setShowProfile(false)} className="text-stone-500 hover:text-white"><X size={20} /></button>
            </div>

            <div className="flex flex-col items-center mb-12">
              <img src={user?.photoURL} className="w-24 h-24 rounded-full border-4 border-white/10 mb-4" alt="" />
              <h4 className="text-lg font-bold">{user?.displayName}</h4>
              <p className="text-stone-500 text-xs">{user?.email}</p>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-6">
                <Bookmark size={16} className="text-emerald-500" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Favorite Locations</h4>
              </div>
              
              <div className="space-y-4">
                {favorites.length === 0 ? (
                  <p className="text-stone-600 text-xs italic">No favorites yet. Explore the map to find your next home.</p>
                ) : (
                  favorites.map(favId => {
                    const loc = MOCK_LOCATIONS.find(l => l.id === favId);
                    if (!loc) return null;
                    return (
                      <button 
                        key={favId}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setShowProfile(false);
                        }}
                        className="w-full flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group"
                      >
                        <img src={loc.images[0]} className="w-12 h-12 rounded-xl object-cover" alt="" />
                        <div className="text-left">
                          <div className="text-sm font-bold text-stone-200 group-hover:text-emerald-500 transition-colors">{loc.name}</div>
                          <div className="text-[10px] text-stone-500">{loc.city}, {loc.country}</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10">
                <div className="flex items-center gap-3 mb-2">
                  <Bot size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Steward Advice</span>
                </div>
                <p className="text-[10px] text-stone-400 leading-relaxed italic">
                  "You seem to prefer {favorites.length > 0 ? (MOCK_LOCATIONS.find(l => l.id === favorites[0])?.intellectualTags[0] ?? 'cultural') : 'cultural'} hubs. I recommend checking out Buenos Aires for its vibrant theater scene."
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Map Interface */}
      <div className="relative flex-1 bg-stone-950 overflow-hidden">
        {GOOGLE_MAPS_API_KEY ? (
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
              <Map
                style={{ width: '100%', height: '100%' }}
                defaultCenter={{ lat: 20, lng: 0 }}
                defaultZoom={3}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                mapId={GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'}
                colorScheme="DARK"
              >
                <MapController selectedLocation={selectedLocation} />
                <MapRef onMapLoad={setGoogleMap} onCenterChange={setMapCenter} />
                {filteredLocations.map(loc => {
                  let markerColor = 'bg-stone-900';
                  let icon = <Home size={18} />;
                  let label = '';

                  if (activeLayer === 'economic') {
                    const price = priceType === 'rent' ? loc.monthlyRent : loc.purchasePrice;
                    const priceRatio = price / (priceType === 'rent' ? 5000 : 1000000);
                    markerColor = priceRatio > 0.6 ? 'bg-red-500' : priceRatio > 0.3 ? 'bg-yellow-500' : 'bg-emerald-500';
                    label = loc.id === 'bali' ? 'Tech/Tourism' : loc.id === 'lisbon' ? 'Services/Art' : loc.id === 'medellin' ? 'Innovation' : 'Growth';
                    icon = <Briefcase size={18} />;
                  } else if (activeLayer === 'social') {
                    markerColor = 'bg-blue-500';
                    icon = <Users size={18} />;
                    label = 'Active';
                  } else if (activeLayer === 'cultural') {
                    markerColor = 'bg-purple-500';
                    icon = <Compass size={18} />;
                    label = loc.tags[0];
                  } else if (activeLayer === 'politics') {
                    markerColor = 'bg-slate-500';
                    icon = <Scale size={18} />;
                    label = 'Stable';
                  } else if (activeLayer === 'religion') {
                    markerColor = 'bg-amber-500';
                    icon = <Church size={18} />;
                    label = 'Diverse';
                  } else if (activeLayer === 'acceptance') {
                    markerColor = 'bg-pink-500';
                    icon = <Smile size={18} />;
                    label = 'High';
                  } else if (activeLayer === 'strata') {
                    markerColor = 'bg-indigo-500';
                    icon = <Globe size={18} />;
                    label = 'Mixed';
                  } else if (activeLayer === 'entertainment') {
                    markerColor = 'bg-orange-500';
                    icon = <Music size={18} />;
                    label = 'Vibrant';
                  } else if (activeLayer === 'communities') {
                    markerColor = 'bg-cyan-500';
                    icon = <Users size={18} />;
                    label = loc.id === 'bali' ? 'Operational' : 'Formation';
                  } else if (activeLayer === 'accommodation') {
                    markerColor = 'bg-rose-500';
                    icon = <ShoppingBag size={18} />;
                    label = 'Available';
                  } else if (selectedLocation?.id === loc.id) {
                    markerColor = 'bg-emerald-500';
                  }

                  return (
                    <AdvancedMarker
                      key={loc.id}
                      position={{ lat: loc.lat, lng: loc.lng }}
                      onClick={() => setSelectedLocation(loc)}
                    >
                      <div className={`relative group transition-all duration-500 ${selectedLocation?.id === loc.id ? 'scale-125 z-50' : 'hover:scale-110'}`}>
                        {selectedLocation?.id === loc.id && (
                          <div className="absolute inset-0 -m-4 border-2 border-emerald-500/40 rounded-2xl animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                        )}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-2xl border-2 transition-all duration-300 ${
                          selectedLocation?.id === loc.id 
                            ? 'border-white text-stone-950 shadow-[0_0_30px_rgba(16,185,129,0.8)] ' + markerColor
                            : 'border-white/20 text-white ' + markerColor
                        }`}>
                          {icon}
                        </div>
                        {activeLayer !== 'none' && (
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-stone-900/90 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md text-[8px] font-bold text-white whitespace-nowrap">
                            {label}
                          </div>
                        )}
                      </div>
                    </AdvancedMarker>
                  );
                })}
              </Map>
          </APIProvider>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-10">
            <div className="max-w-md w-full bg-stone-900/80 backdrop-blur-xl border border-emerald-500/20 p-8 rounded-3xl text-center shadow-2xl">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
                <MapIcon size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-4">Map Configuration Required</h2>
              <p className="text-stone-400 text-sm mb-8 leading-relaxed">
                To enable the interactive global map, please add your Google Maps API Key to the project secrets.
              </p>
              <div className="bg-black/40 rounded-2xl p-4 text-left font-mono text-[10px] text-emerald-500/80 mb-8">
                1. Go to Google Cloud Console<br/>
                2. Enable Maps JavaScript API<br/>
                3. Add VITE_GOOGLE_MAPS_API_KEY to Secrets
              </div>
              <button 
                onClick={() => window.open('https://console.cloud.google.com/google/maps-apis/credentials', '_blank')}
                className="w-full bg-emerald-500 text-stone-950 py-3 rounded-xl font-bold text-sm hover:bg-emerald-400 transition-all"
              >
                Get API Key
              </button>
            </div>
          </div>
        )}

        {/* Map Legend & Source Toggles - Moved to avoid overlap with sidebar */}
        <div className="absolute top-24 right-6 z-40 flex flex-col gap-4 w-64 pointer-events-none transition-opacity duration-500 opacity-40 hover:opacity-100 group/legend">
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-stone-900/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-emerald-500" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-300">Data Sources</h3>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Connected</span>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { id: 'NomadList', label: 'NomadList', icon: <Globe size={12} />, status: 'Connected' },
                { id: 'Teleport', label: 'Teleport', icon: <Activity size={12} />, status: 'Connected' },
                { id: 'WorldBank', label: 'World Bank', icon: <Scale size={12} />, status: 'Connected' },
                { id: 'UNESCO', label: 'UNESCO', icon: <Church size={12} />, status: 'Connected' },
                { id: 'Airbnb', label: 'Airbnb', icon: <Home size={12} />, status: 'Connected' },
                { id: 'Meetup', label: 'Meetup', icon: <Users size={12} />, status: 'Connected' },
              ].map(source => (
                <div key={source.id} className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${visibleSources.includes(source.id) ? 'text-emerald-500 bg-emerald-500/10' : 'text-stone-500 bg-stone-800'}`}>
                      {source.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-medium ${visibleSources.includes(source.id) ? 'text-stone-200' : 'text-stone-500'}`}>{source.label}</span>
                      <span className="text-[7px] text-emerald-500/60 font-mono uppercase">{source.status}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setVisibleSources(prev => prev.includes(source.id) ? prev.filter(s => s !== source.id) : [...prev, source.id])}
                    className={`p-1 rounded transition-colors ${visibleSources.includes(source.id) ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-stone-600 hover:bg-stone-700'}`}
                  >
                    {visibleSources.includes(source.id) ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Mission Control Widgets */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex gap-4 pointer-events-none transition-opacity duration-500 opacity-40 hover:opacity-100">
          <div className="bg-stone-900/80 backdrop-blur-xl border border-emerald-500/20 px-4 py-1.5 rounded-full flex items-center gap-3 shadow-2xl pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="text-[7px] font-bold uppercase tracking-widest text-emerald-500/60">Latency</span>
              <span className="text-xs font-mono font-bold text-emerald-400">24ms</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[7px] font-bold uppercase tracking-widest text-emerald-500/60">Nodes</span>
              <span className="text-xs font-mono font-bold text-emerald-400">1,284</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[7px] font-bold uppercase tracking-widest text-emerald-500/60">System</span>
              <span className="text-xs font-mono font-bold text-emerald-400">Stable</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <button 
              onClick={() => setShowBriefing(true)}
              className="flex items-center gap-2 hover:text-emerald-400 transition-colors pointer-events-auto"
            >
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[7px] font-bold uppercase tracking-widest text-stone-300">Briefing</span>
            </button>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-4">
          <div className="flex gap-2 bg-stone-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl pointer-events-auto">
            {[
              { id: 'cultural', label: 'Culture', icon: <Compass size={20} />, desc: 'Shows cultural sites, museums, and historical landmarks.' },
              { id: 'economic', label: 'Economy', icon: <TrendingUp size={20} />, desc: 'Displays economic indicators, GDP data, and cost of living.' },
              { id: 'communities', label: 'Local', icon: <Users size={20} />, desc: 'Highlights active nomad communities and local meetups.' },
              { id: 'entertainment', label: 'Entertainment', icon: <Music size={20} />, desc: 'Shows nightlife, events, and entertainment venues.' }
            ].map((layer, idx) => (
              <div key={layer.id} className="relative flex items-center">
                {idx > 0 && <div className="w-px h-8 bg-white/10 self-center mx-1" />}
                <button 
                  onClick={() => setOpenLegendId(openLegendId === layer.id ? null : layer.id)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group relative ${
                    activeLayer === layer.id ? 'text-emerald-500 bg-emerald-500/10' : 'text-stone-400 hover:text-emerald-500 hover:bg-emerald-500/10'
                  }`}
                >
                  {layer.icon}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-stone-900 text-[8px] font-bold text-emerald-500 px-2 py-1 rounded border border-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{layer.label}</div>
                  <div className="absolute -right-2 -top-2 bg-stone-800 text-[8px] font-bold text-stone-400 px-1.5 py-0.5 rounded border border-white/10">{searchRadius}km</div>
                </button>

                {openLegendId === layer.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 bg-stone-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{layer.label} Legend</h4>
                      <button 
                        onClick={() => setActiveLayer(activeLayer === layer.id ? 'none' : layer.id as any)}
                        className={`w-8 h-4 rounded-full transition-colors relative ${activeLayer === layer.id ? 'bg-emerald-500' : 'bg-stone-700'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${activeLayer === layer.id ? 'left-4.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-400 mb-3">{layer.desc}</p>
                    {selectedLocation && activeLayer === layer.id && (
                      <div className="bg-stone-800/50 rounded-xl p-3 border border-white/5">
                        <h5 className="text-[10px] font-bold text-white mb-1">{selectedLocation.name} Data</h5>
                        <p className="text-[9px] text-stone-400">
                          {layer.id === 'economic' && `Monthly Rent: $${selectedLocation.monthlyRent}`}
                          {layer.id === 'cultural' && `Tags: ${selectedLocation.tags.join(', ')}`}
                          {layer.id === 'communities' && `Members: ${selectedLocation.members?.length || 0}`}
                          {layer.id === 'entertainment' && `Rating: ${selectedLocation.rating}/5.0`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Map Status Bar */}
        <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-4 items-end">
          {activeLayer !== 'none' && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-stone-900/90 backdrop-blur-xl border border-emerald-500/30 p-4 rounded-2xl shadow-2xl w-64"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                  {activeLayer === 'economic' ? 'Economic Indicators' : activeLayer === 'communities' ? 'Community Listing' : 'Layer Active'}
                </h4>
              </div>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                {activeLayer === 'economic' 
                  ? 'Visualizing regional business specializations and economic growth sectors. Green nodes indicate high innovation potential.' 
                  : activeLayer === 'communities' 
                  ? 'Listing active and forming nomad communities. Cyan nodes represent established operational hubs.' 
                  : 'Displaying specialized data layer for regional analysis.'}
              </p>
            </motion.div>
          )}
          
          <div className="bg-stone-900/90 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-6 transition-opacity duration-500 opacity-40 hover:opacity-100">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-300">System Secure</span>
              </div>
              <span className="text-[8px] font-mono text-stone-500 mt-0.5">ENCRYPTION_AES_256</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold text-emerald-500">102.4 GB/S</span>
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-stone-500">Uplink Speed</span>
            </div>
          </div>
        </div>

        {/* Fallback World Map (only if Google Maps is missing) */}
        {!GOOGLE_MAPS_API_KEY && (
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          </div>
        )}

        {/* Fallback Pins (only if Google Maps is missing) */}
        {!GOOGLE_MAPS_API_KEY && filteredLocations.map(loc => (
          <motion.div
            key={loc.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1, zIndex: 50 }}
            className="absolute cursor-pointer z-10"
            style={{ 
              top: `${50 - (loc.lat * 0.8)}%`, 
              left: `${50 + (loc.lng * 0.4)}%` 
            }}
            onClick={() => setSelectedLocation(loc)}
          >
            <div className="relative group">
              <div className="absolute inset-0 -m-4 border border-emerald-500/30 rounded-full animate-[ping_3s_linear_infinite]" />
              
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl border-2 transition-all duration-300 ${
                selectedLocation?.id === loc.id 
                  ? 'bg-emerald-500 border-white text-stone-950 scale-110 shadow-[0_0_40px_rgba(16,185,129,0.6)]' 
                  : 'bg-stone-900 border-emerald-500/50 text-emerald-500 hover:border-emerald-500'
              }`}>
                <Home size={20} />
              </div>

              <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-stone-900/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all duration-300 shadow-2xl ${
                selectedLocation?.id === loc.id ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
              }`}>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-white">{loc.name}</span>
                  <span className="text-emerald-500 font-mono">${priceType === 'rent' ? loc.monthlyRent : loc.purchasePrice}/{priceType === 'rent' ? 'MO' : 'BUY'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Left Sidebar: Filters */}
        <div className="absolute top-24 left-6 bottom-6 w-80 z-40 flex flex-col gap-4 transition-opacity duration-500 opacity-40 hover:opacity-100 sidebar-container">
          <div className="bg-stone-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-y-auto custom-scrollbar flex-1">
            <div className="flex items-center gap-2 mb-6 text-emerald-500">
              <Filter size={18} />
              <h2 className="font-bold uppercase tracking-widest text-xs">Search Parameters</h2>
            </div>

            <div className="space-y-8">
              {/* View Toggle */}
              <section>
                <div className="flex bg-stone-800 p-1 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setShowLocationList(false)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${!showLocationList ? 'bg-emerald-500 text-stone-950 shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}
                  >
                    Map View
                  </button>
                  <button 
                    onClick={() => setShowLocationList(true)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${showLocationList ? 'bg-emerald-500 text-stone-950 shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}
                  >
                    List View
                  </button>
                </div>
              </section>

              {showLocationList ? (
                /* Location List View */
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Available Communities</h3>
                    <span className="text-[10px] font-mono text-emerald-500">{filteredLocations.length} found</span>
                  </div>
                  <div className="space-y-3">
                    {filteredLocations.map(location => (
                      <button
                        key={location.id}
                        onClick={() => {
                          setSelectedLocation(location);
                          if (googleMap) {
                            googleMap.panTo({ lat: location.lat, lng: location.lng });
                            googleMap.setZoom(14);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-2xl transition-all border ${
                          selectedLocation?.id === location.id 
                            ? 'bg-emerald-500/10 border-emerald-500 shadow-lg' 
                            : 'bg-stone-800/50 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold text-stone-200">{location.name}</span>
                          <span className="text-[8px] font-mono text-emerald-500/60">{location.city}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-stone-900 text-stone-500 border border-white/5">{location.purpose}</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-stone-900 text-stone-500 border border-white/5">{location.accommodationType}</span>
                        </div>
                      </button>
                    ))}
                    {filteredLocations.length === 0 && (
                      <div className="text-center py-12 bg-stone-800/20 rounded-3xl border border-dashed border-white/5">
                        <Search size={24} className="mx-auto text-stone-700 mb-2" />
                        <p className="text-[10px] text-stone-500">No matches found.</p>
                      </div>
                    )}
                  </div>
                </section>
              ) : (
                /* Filters View */
                <>
                  {/* Active Layer Controls */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Layers size={14} className="text-emerald-500" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Active Map Layer</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'economic', label: 'Economy', icon: <TrendingUp size={12} /> },
                        { id: 'communities', label: 'Local', icon: <Users size={12} /> },
                        { id: 'cultural', label: 'Culture', icon: <Compass size={12} /> },
                        { id: 'entertainment', label: 'Entertainment', icon: <Music size={12} /> },
                      ].map(layer => (
                        <button
                          key={layer.id}
                          onClick={() => setActiveLayer(activeLayer === layer.id ? 'none' : layer.id as any)}
                          className={`p-2 rounded-xl text-[8px] font-bold flex flex-col items-center gap-1 transition-all border ${
                            activeLayer === layer.id 
                              ? 'bg-emerald-500 border-emerald-500 text-stone-950' 
                              : 'bg-stone-800 border-white/5 text-stone-400 hover:border-white/20'
                          }`}
                        >
                          {layer.icon}
                          {layer.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Dials Search */}
                  <section>
                    <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest mb-3 block">Dials Search</label>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">
                          <span>Max Budget</span>
                          <span className="text-emerald-500">${filters.maxPrice}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="10000" 
                          step="100"
                          value={filters.maxPrice}
                          onChange={(e) => setFilters(f => ({ ...f, maxPrice: parseInt(e.target.value) }))}
                          className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">
                          <span>Vibe</span>
                          <span className="text-emerald-500">{filters.vibe}</span>
                        </div>
                        <select 
                          className="w-full bg-stone-800 border border-white/5 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                          value={filters.vibe}
                          onChange={(e) => setFilters(f => ({ ...f, vibe: e.target.value }))}
                        >
                          <option value="Any">Any</option>
                          <option value="Chill">Chill</option>
                          <option value="Historic">Historic</option>
                          <option value="Energetic">Energetic</option>
                          <option value="Peaceful">Peaceful</option>
                          <option value="Artistic">Artistic</option>
                          <option value="Scenic">Scenic</option>
                          <option value="Cultural">Cultural</option>
                        </select>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">
                          <span>Climate</span>
                          <span className="text-emerald-500">{filters.climate}</span>
                        </div>
                        <select 
                          className="w-full bg-stone-800 border border-white/5 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                          value={filters.climate}
                          onChange={(e) => setFilters(f => ({ ...f, climate: e.target.value }))}
                        >
                          <option value="Any">Any</option>
                          <option value="Tropical">Tropical</option>
                          <option value="Mediterranean">Mediterranean</option>
                          <option value="Temperate">Temperate</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Radius Search */}
                  <section>
                    <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest mb-3 block">Radius Search</label>
                    <button 
                      onClick={() => {
                        setIsSearchAroundActive(!isSearchAroundActive);
                      }}
                      className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border mb-3 ${
                        isSearchAroundActive 
                          ? 'bg-emerald-500 text-stone-950 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                      }`}
                    >
                      <Compass size={14} className={isSearchAroundActive ? 'animate-spin' : ''} />
                      {isSearchAroundActive ? 'Radius Filter Active' : 'Search Around'}
                    </button>
                    {isSearchAroundActive && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                          <span>Radius</span>
                          <span className="text-emerald-500">{searchRadius} km</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="5000" 
                          step="10"
                          value={searchRadius}
                          onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    )}
                  </section>

                  {/* Interests */}
                  <section>
                    <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest mb-3 block">Interests</label>
                    <div className="flex flex-wrap gap-2">
                      {INTEREST_TAGS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleInterest(tag)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                            filters.interests.includes(tag) 
                              ? 'bg-emerald-500 border-emerald-500 text-stone-950' 
                              : 'bg-stone-800 border-white/5 text-stone-400 hover:border-white/20'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Purpose */}
                  <section>
                    <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest mb-3 block">Purpose</label>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => setFilters(f => ({ ...f, purpose: 'All' }))}
                        className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                          filters.purpose === 'All' 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                            : 'bg-stone-800 border-white/5 text-stone-400'
                        }`}
                      >
                        All Purposes
                      </button>
                      {PURPOSE_TYPES.map(p => (
                        <button
                          key={p}
                          onClick={() => setFilters(f => ({ ...f, purpose: p }))}
                          className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                            filters.purpose === p 
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                              : 'bg-stone-800 border-white/5 text-stone-400'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Amenities */}
                  <section>
                    <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest mb-3 block">Required Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {AMENITIES.map(amenity => (
                        <button 
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                            filters.amenities.includes(amenity) 
                              ? 'bg-emerald-500 border-emerald-500 text-stone-950' 
                              : 'bg-stone-800 border-white/5 text-stone-400 hover:border-white/20'
                          }`}
                        >
                          {amenity}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Neighborhood Features */}
                  <section>
                    <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest mb-3 block">Neighborhood Features</label>
                    <div className="flex flex-wrap gap-2">
                      {NEIGHBORHOOD_FEATURES.map(feature => (
                        <button 
                          key={feature}
                          onClick={() => toggleNeighborhoodFeature(feature)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                            filters.neighborhoodFeatures.includes(feature) 
                              ? 'bg-emerald-500 border-emerald-500 text-stone-950' 
                              : 'bg-stone-800 border-white/5 text-stone-400 hover:border-white/20'
                          }`}
                        >
                          {feature}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Price Range */}
                  <section>
                    <div className="flex justify-between mb-3">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest">Price Range</label>
                        <span className="text-[8px] text-stone-600 uppercase font-bold">Rent or Buy</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setPriceType('rent');
                            setFilters(f => ({ ...f, minPrice: 0, maxPrice: 5000 }));
                          }}
                          className={`text-[8px] font-bold uppercase px-2 py-1 rounded transition-all ${priceType === 'rent' ? 'bg-emerald-500 text-stone-950' : 'bg-stone-800 text-stone-500 hover:text-stone-300'}`}
                        >
                          RENT
                        </button>
                        <div className="relative group/tooltip">
                          <button 
                            onClick={() => {
                              setPriceType('buy');
                              setFilters(f => ({ ...f, minPrice: 0, maxPrice: 1000000 }));
                            }}
                            className={`text-[8px] font-bold uppercase px-2 py-1 rounded transition-all ${priceType === 'buy' ? 'bg-emerald-500 text-stone-950' : 'bg-stone-800 text-stone-500 hover:text-stone-300'}`}
                          >
                            PURCHASE
                          </button>
                          <div className="absolute bottom-full mb-2 right-0 w-48 p-2 bg-stone-900 border border-white/10 rounded-lg text-[8px] text-stone-400 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                            Filter by total real estate purchase price for permanent residency or investment.
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-emerald-500 text-xs font-bold">
                        ${filters.minPrice.toLocaleString()} - ${filters.maxPrice.toLocaleString()}
                        <span className="ml-1 opacity-50 text-[8px] uppercase">{priceType === 'rent' ? 'Rent' : 'Buy'}</span>
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-stone-600 uppercase font-bold">Min {priceType === 'rent' ? 'Rent' : 'Price'}</span>
                        <input 
                          type="range" min="0" max={priceType === 'rent' ? 5000 : 1000000} step={priceType === 'rent' ? 100 : 10000}
                          value={filters.minPrice}
                          onChange={(e) => setFilters(f => ({ ...f, minPrice: parseInt(e.target.value) }))}
                          className="w-full accent-emerald-500 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-stone-600 uppercase font-bold">Max {priceType === 'rent' ? 'Rent' : 'Price'}</span>
                        <input 
                          type="range" min="0" max={priceType === 'rent' ? 5000 : 1000000} step={priceType === 'rent' ? 100 : 10000}
                          value={filters.maxPrice}
                          onChange={(e) => setFilters(f => ({ ...f, maxPrice: parseInt(e.target.value) }))}
                          className="w-full accent-emerald-500 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Minimum Rating */}
                  <section>
                    <div className="flex justify-between mb-3">
                      <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest">Min Rating</label>
                      <span className="text-emerald-500 text-xs font-bold">{filters.minRating} ★</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setFilters(f => ({ ...f, minRating: star }))}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all border ${
                            filters.minRating >= star 
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                              : 'bg-stone-800 border-white/5 text-stone-400'
                          }`}
                        >
                          {star}+
                        </button>
                      ))}
                      <button
                        onClick={() => setFilters(f => ({ ...f, minRating: 0 }))}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${
                          filters.minRating === 0 
                            ? 'bg-stone-700 border-white/20 text-white' 
                            : 'bg-stone-800 border-white/5 text-stone-400'
                        }`}
                      >
                        Any
                      </button>
                    </div>
                  </section>
                </>
              )}

              {/* Dynamic Layer Info */}
              {activeLayer === 'communities' && (
                <section className="pt-8 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={14} className="text-cyan-500" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Community Pulse</h3>
                  </div>
                  <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-4 space-y-3">
                    {selectedLocation ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-stone-400 uppercase font-bold">Local Hub Status</span>
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            {selectedLocation.id === 'bali' ? 'Operational' : 'In Formation'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-stone-400 uppercase font-bold">Member Density</span>
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            {selectedLocation.id === 'bali' ? 'High' : 'Medium'}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-white/5">
                          <span className="text-[8px] text-stone-500 uppercase font-bold block mb-1">Intellectual Focus</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedLocation.intellectualTags?.map(tag => (
                              <span key={tag} className="text-[7px] px-1.5 py-0.5 rounded bg-stone-900 text-stone-400 border border-white/5">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-stone-400 uppercase font-bold">Active Operational Hubs</span>
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            {MOCK_LOCATIONS.filter(l => l.id === 'bali').length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-stone-400 uppercase font-bold">In Formation Phase</span>
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            {MOCK_LOCATIONS.length - 1}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-white/5">
                          <span className="text-[8px] text-stone-500 uppercase font-bold block mb-1">Top Network Interests</span>
                          <div className="flex flex-wrap gap-1">
                            {Array.from(new Set(MOCK_LOCATIONS.flatMap(l => l.intellectualTags || []))).slice(0, 3).map(tag => (
                              <span key={tag} className="text-[7px] px-1.5 py-0.5 rounded bg-stone-900 text-stone-400 border border-white/5">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </section>
              )}

              {activeLayer === 'economic' && (
                <section className="pt-8 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={14} className="text-emerald-500" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Economic Brief</h3>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-3">
                    {selectedLocation ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-stone-400 uppercase font-bold">Local GDP Growth</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {selectedLocation.economicIndicators?.gdpGrowth || '+2.4%'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-stone-400 uppercase font-bold">Innovation Score</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {selectedLocation.economicIndicators?.innovationScore || 75}/100
                          </span>
                        </div>
                        <div className="pt-2 border-t border-white/5">
                          <span className="text-[8px] text-stone-500 uppercase font-bold block mb-1">Top Industries</span>
                          <p className="text-[8px] text-stone-400 leading-tight">
                            {selectedLocation.economicIndicators?.topIndustries?.join(', ') || 'N/A'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-stone-400 uppercase font-bold">Avg GDP Growth (Network)</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">+2.9%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-stone-400 uppercase font-bold">Network Innovation Score</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {Math.round(MOCK_LOCATIONS.reduce((acc, loc) => acc + (loc.economicIndicators?.innovationScore || 0), 0) / MOCK_LOCATIONS.length)}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-white/5">
                          <span className="text-[8px] text-stone-500 uppercase font-bold block mb-1">Primary Industries</span>
                          <p className="text-[8px] text-stone-400 leading-tight">
                            {Array.from(new Set(MOCK_LOCATIONS.flatMap(l => l.economicIndicators?.topIndustries || []))).slice(0, 4).join(', ')}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </section>
              )}

              {/* Data Sources Info */}
              <section className="pt-4 border-t border-white/5">
                <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10">
                  <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Database size={12} />
                    System Architecture
                  </h3>
                  <p className="text-[9px] text-stone-500 leading-relaxed">
                    This interface is currently in <b className="text-emerald-500/80">Simulation Mode</b>. It is architected to synthesize data from:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {[
                      'Google Places (Photos & Business)',
                      'Numbeo (Economic & Social)',
                      'UNESCO (Cultural Heritage)',
                      'Zillow/Local (Real Estate)',
                    ].map(source => (
                      <li key={source} className="text-[8px] text-stone-400 flex items-center gap-2">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                        {source}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[8px] text-stone-500 mt-3 italic">
                    * Community Pulse insights are generated in real-time by Gemini AI.
                  </p>
                </div>
              </section>

              {/* Location List (Visible when showLocationList is true) */}
              {showLocationList && (
                <section className="pt-8 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={14} className="text-emerald-500" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Available Locations</h3>
                  </div>
                  <div className="space-y-3">
                    {filteredLocations.length === 0 ? (
                      <div className="text-center py-8 px-4 border border-white/5 rounded-2xl bg-stone-800/50">
                        <Compass size={24} className="mx-auto text-stone-600 mb-3" />
                        <p className="text-xs text-stone-400">No communities found matching your criteria.</p>
                        <p className="text-[10px] text-stone-500 mt-1">Try adjusting your dials or expanding your search radius.</p>
                      </div>
                    ) : (
                      filteredLocations.map(location => (
                        <button
                          key={location.id}
                          onClick={() => {
                            setSelectedLocation(location);
                            if (googleMap) {
                              googleMap.panTo({ lat: location.lat, lng: location.lng });
                              googleMap.setZoom(14);
                            }
                          }}
                          className={`w-full text-left p-3 rounded-2xl transition-all border ${
                            selectedLocation?.id === location.id 
                              ? 'bg-emerald-500/10 border-emerald-500 shadow-lg' 
                              : 'bg-stone-800/50 border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-stone-200">{location.name}</span>
                            <span className="text-[8px] font-mono text-emerald-500/60">{location.city}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-stone-900 text-stone-500 border border-white/5">{location.purpose}</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-stone-900 text-stone-500 border border-white/5">{location.vibe}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Details & Community */}
        <AnimatePresence>
          {selectedLocation && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="absolute top-24 right-6 bottom-6 w-96 z-40 flex flex-col gap-4 transition-opacity duration-500 opacity-40 hover:opacity-100"
            >
              <div className="bg-stone-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-0 shadow-2xl overflow-hidden flex flex-col h-full">
                {/* Header Image */}
                <div className="relative h-48">
                  <img src={`https://picsum.photos/seed/${selectedLocation.id}/800/600`} className="w-full h-full object-cover" alt="" />
                  <button 
                    onClick={() => setSelectedLocation(null)}
                    className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center hover:bg-black/80 transition-all"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute bottom-4 left-4 bg-emerald-500 text-stone-950 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                    {selectedLocation.purpose}
                  </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-8">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h1 className="text-2xl font-bold tracking-tight">{selectedLocation.name}</h1>
                      <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg text-[10px] font-bold">
                        <Heart size={10} fill="currentColor" />
                        {selectedLocation.rating}
                      </div>
                    </div>
                    <p className="text-stone-400 text-xs flex items-center gap-1">
                      <MapIcon size={12} /> {selectedLocation.city}, {selectedLocation.country}
                    </p>
                  </div>

                  {/* Community Formation - MOVED HIGHER FOR VISIBILITY */}
                  <section className="bg-emerald-500/5 rounded-3xl p-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex flex-col">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Formation Progress</h3>
                        <span className="text-[8px] text-stone-500 uppercase font-bold">Community Growth Stage</span>
                      </div>
                      <button 
                        onClick={() => setShowCommunityDetail(true)}
                        className="text-[9px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20"
                      >
                        FULL SPECS <ArrowRight size={10} />
                      </button>
                    </div>
                    
                    {/* Granular Stages Display */}
                    <div className="mb-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${getCommunityStageInfo(communityData?.memberCount || 0, communityData?.resourcePledges || 0).bgColor} ${getCommunityStageInfo(communityData?.memberCount || 0, communityData?.resourcePledges || 0).color} border border-current/20`}>
                          {communityData?.stage || 'Seed'}
                        </span>
                        <span className="text-[8px] text-stone-500 font-mono uppercase">Stage {COMMUNITY_STAGES.findIndex(s => s.label === (communityData?.stage || 'Ideation')) + 1} of 5</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 h-1.5">
                        {COMMUNITY_STAGES.map((s, i) => (
                          <div 
                            key={s.id} 
                            className={`h-full rounded-full transition-all duration-700 ${
                              COMMUNITY_STAGES.findIndex(st => st.label === (communityData?.stage || 'Ideation')) >= i 
                                ? s.color.replace('text-', 'bg-') 
                                : 'bg-stone-800'
                            } ${COMMUNITY_STAGES.findIndex(st => st.label === (communityData?.stage || 'Ideation')) === i ? 'animate-pulse' : ''}`} 
                          />
                        ))}
                      </div>
                      <div className="bg-stone-900/50 rounded-2xl p-3 border border-white/5">
                        <p className="text-[10px] text-stone-400 leading-relaxed italic">
                          <b className="text-emerald-500/80 uppercase text-[8px] block mb-1">Current Objective:</b>
                          {COMMUNITY_STAGES.find(s => s.label === (communityData?.stage || 'Ideation'))?.desc}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                          <span>Verified Members</span>
                          <span className="text-emerald-500">{communityData?.memberCount || 0} / {getCommunityStageInfo(communityData?.memberCount || 0, communityData?.resourcePledges || 0).goal}</span>
                        </div>
                        <div className="h-2 bg-stone-900 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(((communityData?.memberCount || 0) / getCommunityStageInfo(communityData?.memberCount || 0, communityData?.resourcePledges || 0).goal) * 100, 100)}%` }}
                            className={`h-full shadow-[0_0_15px_rgba(16,185,129,0.4)] ${getCommunityStageInfo(communityData?.memberCount || 0, communityData?.resourcePledges || 0).color.replace('text-', 'bg-')}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                          <span>Resource Pledges</span>
                          <span className="text-amber-500">${(communityData?.resourcePledges || 0).toLocaleString()} / ${(getCommunityStageInfo(communityData?.memberCount || 0, communityData?.resourcePledges || 0).resourceGoal).toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-stone-900 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(((communityData?.resourcePledges || 0) / getCommunityStageInfo(communityData?.memberCount || 0, communityData?.resourcePledges || 0).resourceGoal) * 100, 100)}%` }}
                            className="h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Member Avatars */}
                    {memberProfiles.length > 0 && (
                      <div className="mt-6 flex flex-col gap-3">
                        <div className="flex flex-wrap gap-2">
                          {memberProfiles.map((profile) => (
                            <div key={profile.uid} className="flex items-center gap-2 bg-stone-900/80 rounded-full pl-1 pr-3 py-1 border border-white/10 group relative">
                              <div className="h-7 w-7 rounded-full bg-stone-800 flex items-center justify-center overflow-hidden border border-white/10">
                                {profile.photoURL ? (
                                  <img src={profile.photoURL} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <Users size={12} className="text-stone-600" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-stone-200">{profile.displayName}</span>
                                {communityData.roles?.[profile.uid] && (
                                  <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-tighter">
                                    {communityData.roles[profile.uid]}
                                  </span>
                                )}
                              </div>
                              
                              {/* Admin Role Assignment */}
                              {communityData.roles?.[user?.uid] === 'Admin' && profile.uid !== user?.uid && (
                                <div className="absolute top-full left-0 mt-2 bg-stone-950 border border-white/10 rounded-xl p-1.5 z-50 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shadow-2xl">
                                  {['Moderator', 'Welcome', 'Admin'].map(role => (
                                    <button
                                      key={role}
                                      onClick={() => assignRole(profile.uid, role)}
                                      className="text-[8px] px-2 py-1 rounded-lg bg-stone-800 hover:bg-emerald-500 hover:text-stone-950 transition-colors whitespace-nowrap font-bold uppercase"
                                    >
                                      {role}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="text-[9px] text-stone-500 font-medium">
                          {memberProfiles.slice(0, 3).map(p => p.displayName).join(', ')}
                          {communityData.members.length > 3 && ` and ${communityData.members.length - 3} others`} are active members
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 mt-8">
                      <button 
                        onClick={user ? joinFormationGroup : handleSignIn}
                        disabled={isJoining}
                        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-xl ${
                          !user 
                            ? 'bg-emerald-500 text-stone-950 hover:bg-emerald-400 shadow-emerald-500/20'
                            : communityData?.members?.includes(user?.uid)
                              ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 hover:bg-emerald-500/30'
                              : 'bg-white text-stone-950 hover:bg-stone-200 shadow-white/10'
                        } disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95`}
                      >
                        {isJoining ? (
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : !user ? (
                          <>
                            <LogIn size={18} />
                            Sign In to Join
                          </>
                        ) : communityData?.members?.includes(user?.uid) ? (
                          <>
                            <CheckCircle2 size={18} />
                            Joined Formation Group
                          </>
                        ) : (
                          <>
                            <TrendingUp size={18} />
                            Join Formation Group
                          </>
                        )}
                      </button>
                      
                      {!user && (
                        <button 
                          onClick={mockJoinAsGuest}
                          disabled={isJoining}
                          className="w-full py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-stone-500 border border-white/5 hover:border-white/20 hover:text-stone-300 transition-all flex items-center justify-center gap-2 bg-stone-900/50"
                        >
                          <Users size={14} />
                          Join as Guest (Simulation)
                        </button>
                      )}
                    </div>
                  </section>

                  {/* Community Pulse */}
                  <CommunityPulse location={selectedLocation} />

                  {/* Location Tags */}
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedLocation.tags.map((tag: string) => (
                        <button
                          key={tag}
                          onClick={() => toggleInterest(tag)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                            filters.interests.includes(tag) 
                              ? 'bg-emerald-500 border-emerald-500 text-stone-950' 
                              : 'bg-stone-800 border-white/5 text-stone-400 hover:border-white/20'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Intellectual Tags */}
                  {selectedLocation.intellectualTags && selectedLocation.intellectualTags.length > 0 && (
                    <section>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-3">Intellectual Focus</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedLocation.intellectualTags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Technical Specs */}
                  {selectedLocation.technicalSpecs && (
                    <section className="bg-stone-800/50 rounded-2xl p-4 border border-white/5">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
                        <Cpu size={12} />
                        Technical Infrastructure
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] text-stone-500 uppercase font-bold tracking-tighter">Uplink</span>
                          <span className="text-[11px] text-stone-200 font-mono">{selectedLocation.technicalSpecs.uplink}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] text-stone-500 uppercase font-bold tracking-tighter">Latency</span>
                          <span className="text-[11px] text-stone-200 font-mono">{selectedLocation.technicalSpecs.latency}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] text-stone-500 uppercase font-bold tracking-tighter">Encryption</span>
                          <span className="text-[11px] text-stone-200 font-mono">{selectedLocation.technicalSpecs.encryption}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] text-stone-500 uppercase font-bold tracking-tighter">Nodes</span>
                          <span className="text-[11px] text-stone-200 font-mono">{selectedLocation.technicalSpecs.nodes}</span>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Description */}
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">Overview</h3>
                    <p className="text-stone-300 text-xs leading-relaxed">
                      {selectedLocation.description}
                    </p>
                  </section>

                  {/* Amenities */}
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">Amenities</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedLocation.amenities.map((item: string) => (
                        <div key={item} className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                          <span className="text-[10px] text-stone-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Image Gallery */}
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">Gallery</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {selectedLocation.images.map((img: string, i: number) => (
                        <img 
                          key={i} 
                          src={img} 
                          className="w-24 h-24 rounded-xl object-cover flex-shrink-0 border border-white/10" 
                          alt="" 
                        />
                      ))}
                    </div>
                  </section>

                  {/* Chat Integration */}
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">Community Chat</h3>
                    <div className="h-64 rounded-2xl overflow-hidden border border-white/5">
                      <CommunityChat communityId={selectedLocation.id} location={selectedLocation} />
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Community Detail Full Page Overlay */}
        <AnimatePresence>
          {showCommunityDetail && selectedLocation && (
            <CommunityDetailPage 
              location={selectedLocation} 
              communityData={communityData}
              memberProfiles={memberProfiles}
              onClose={() => setShowCommunityDetail(false)} 
              joinFormationGroup={joinFormationGroup}
              isJoining={isJoining}
              user={user}
              toggleFavorite={toggleFavorite}
              favorites={favorites}
              mockJoinAsGuest={mockJoinAsGuest}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBriefing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-stone-900 border border-white/10 rounded-[40px] p-12 max-w-2xl w-full shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowBriefing(false)}
                  className="absolute top-8 right-8 text-stone-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
                
                <div className="flex items-center gap-4 mb-8">
                  <ShieldCheck className="text-emerald-500" size={32} />
                  <h2 className="text-3xl font-bold tracking-tighter">Mission Control Briefing</h2>
                </div>

                <div className="space-y-8">
                  {/* Mission Objectives */}
                  <div className="grid grid-cols-2 gap-6 mb-12">
                    <div className="bg-stone-800/50 rounded-3xl p-6 border border-white/5">
                      <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Target size={14} />
                        Strategic Goals
                      </h3>
                      <ul className="space-y-3">
                        {[
                          'Identify long-term living hubs based on shared intellectual interests.',
                          'Monitor Economic Map layers for local GDP and innovation scores.',
                          'Track Community Formation stages from Ideation to Operational.',
                          'Use "Search Around" to find resources within a specific radius.'
                        ].map((goal, i) => (
                          <li key={i} className="text-[11px] text-stone-400 flex gap-2">
                            <span className="text-emerald-500 font-bold">{i+1}.</span>
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-stone-800/50 rounded-3xl p-6 border border-white/5">
                      <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap size={14} />
                        Quick Actions
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        <button 
                          onClick={() => { setActiveLayer('economic'); setShowBriefing(false); }}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-900 hover:bg-emerald-500 hover:text-stone-950 transition-all group"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest">Economic Map</span>
                          <TrendingUp size={14} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <button 
                          onClick={() => { setActiveLayer('communities'); setShowBriefing(false); }}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-900 hover:bg-cyan-500 hover:text-stone-950 transition-all group"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest">Community Listing</span>
                          <Users size={14} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <button 
                          onClick={() => { setShowLocationList(true); setShowBriefing(false); }}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-900 hover:bg-white hover:text-stone-950 transition-all group"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest">Search Results</span>
                          <Search size={14} className="group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <section>
                    <h3 className="text-emerald-500 font-bold text-xs uppercase tracking-widest mb-3">Community Formation Logic</h3>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Communities evolve through five stages: Ideation, Formation, Pledge, Acquisition, and Operational. 
                      Progression is determined by both <strong>Member Count</strong> and <strong>Resource Pledges</strong>. 
                      A community only advances when both targets for the next stage are met.
                    </p>
                  </section>
                </div>

                <button 
                  onClick={() => setShowBriefing(false)}
                  className="w-full mt-12 py-4 bg-emerald-500 text-stone-950 rounded-2xl font-bold text-sm hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20"
                >
                  Acknowledge & Proceed
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* System Status Line */}
      <div className="fixed bottom-0 left-0 right-0 h-6 bg-stone-950 border-t border-white/10 z-[300] flex items-center px-4 overflow-x-auto whitespace-nowrap custom-scrollbar">
        <div className="flex items-center gap-6 text-[9px] font-mono text-stone-500 uppercase tracking-widest w-full">
          <div className="flex items-center gap-2 text-emerald-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Simulation Mode Active
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-2">
            <Activity size={10} />
            Uplink: 102.4 GB/S
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-2">
            <ShieldCheck size={10} />
            Encryption: AES-256
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-2">
            <Globe size={10} />
            Global Network Sync: Optimal
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        .sidebar-container {
          box-shadow: 0 0 40px rgba(0,0,0,0.5);
          border-radius: 32px;
        }
      `}</style>
    </div>
  );
}
