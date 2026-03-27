import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, DollarSign, Users, Building, CheckCircle2 } from 'lucide-react';

interface CreateCommunityModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function CreateCommunityModal({ onClose, onSubmit }: CreateCommunityModalProps) {
  const [isTestLocation, setIsTestLocation] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    country: '',
    stage: 'Concept Phase',
    unitPurchasePrice: '',
    estimatedMonthlyLoanPayment: '',
    description: '',
  });

  const handleTestToggle = () => {
    const newTestState = !isTestLocation;
    setIsTestLocation(newTestState);
    if (newTestState) {
      // Populate with mock data
      const stages = ['Concept Phase', 'Land Acquired', 'Fully Operational'];
      const randomStage = stages[Math.floor(Math.random() * stages.length)];
      setFormData({
        name: 'Test Oasis Community',
        city: 'Medellin',
        country: 'Colombia',
        stage: randomStage,
        unitPurchasePrice: '150000',
        estimatedMonthlyLoanPayment: '850',
        description: 'A vibrant community for digital nomads focusing on sustainable living and deep work.',
      });
    } else {
      // Clear form
      setFormData({
        name: '',
        city: '',
        country: '',
        stage: 'Concept Phase',
        unitPurchasePrice: '',
        estimatedMonthlyLoanPayment: '',
        description: '',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-stone-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building className="text-sky-500" />
            Create Community
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 flex items-center justify-between bg-stone-800/50 p-4 rounded-xl border border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white">Test Location Mode</h3>
            <p className="text-xs text-stone-400">Auto-populate with mock data for testing</p>
          </div>
          <button 
            onClick={handleTestToggle}
            className={`w-12 h-6 rounded-full transition-colors relative ${isTestLocation ? 'bg-sky-500' : 'bg-stone-700'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isTestLocation ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest mb-1 block">Community Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-stone-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
              placeholder="e.g. The Oasis"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest mb-1 block">City</label>
              <input 
                type="text" 
                required
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                placeholder="e.g. Bali"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest mb-1 block">Country</label>
              <input 
                type="text" 
                required
                value={formData.country}
                onChange={e => setFormData({...formData, country: e.target.value})}
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                placeholder="e.g. Indonesia"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest mb-1 block">Development Stage</label>
            <select 
              value={formData.stage}
              onChange={e => setFormData({...formData, stage: e.target.value})}
              className="w-full bg-stone-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="Concept Phase">Concept Phase</option>
              <option value="Land Acquired">Land Acquired</option>
              <option value="Under Construction">Under Construction</option>
              <option value="Fully Operational">Fully Operational</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest mb-1 block">Unit Purchase Price ($)</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input 
                  type="number" 
                  required
                  value={formData.unitPurchasePrice}
                  onChange={e => setFormData({...formData, unitPurchasePrice: e.target.value})}
                  className="w-full bg-stone-800 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="150000"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest mb-1 block">Est. Monthly Loan ($)</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input 
                  type="number" 
                  required
                  value={formData.estimatedMonthlyLoanPayment}
                  onChange={e => setFormData({...formData, estimatedMonthlyLoanPayment: e.target.value})}
                  className="w-full bg-stone-800 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="850"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-stone-500 tracking-widest mb-1 block">Description</label>
            <textarea 
              required
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-stone-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors resize-none"
              placeholder="Describe the vision for this community..."
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-sky-500 text-stone-950 font-bold py-3 rounded-xl hover:bg-sky-400 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              Create Community
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
