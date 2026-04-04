import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

export default function SetListModal({ onClose }) {
  const { getSetList } = useGame();
  const [sets, setSets] = useState(null);
  const [activeTab, setActiveTab] = useState("1");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getSetList();
        setSets(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [getSetList]);

  if (loading) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-yellow-400 font-black tracking-widest animate-pulse">MOBILIZING INTEL...</div>
    </div>
  );

  if (!sets) return null;

  const currentSet = sets[activeTab];
  const allSets = Object.keys(sets).sort((a, b) => parseInt(a) - parseInt(b));

  // Filter list by search - Added safety guards to prevent crash
  const filteredList = currentSet?.list?.filter(p => 
    (p?.name?.toLowerCase() || "").includes(search.toLowerCase()) || 
    (p?.role?.toLowerCase() || "").includes(search.toLowerCase())
  ) || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-[#020617]/90 backdrop-blur-xl animate-fade-in">
      <div className="bg-[#0f172a] w-full max-w-6xl h-full rounded-[3rem] border border-white/5 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
           <div>
              <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Upcoming <span className="text-yellow-400">Tactical Sets</span>
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">350 Player Intelligence Dossier</p>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="relative">
                 <input 
                    type="text" 
                    placeholder="SEARCH PLAYER..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-2xl px-6 py-3 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-yellow-400/50 w-64 transition-all"
                 />
                 <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
              </div>
              <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-xl">✕</button>
           </div>
        </div>

        {/* Tab Bar */}
        <div className="flex bg-black/20 p-2 gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
           {allSets.map(s => (
             <button
                key={s}
                onClick={() => setActiveTab(s)}
                className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                  activeTab === s ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg' : 'text-slate-500 border-transparent hover:bg-white/5'
                }`}
             >
                {sets[s].name}
             </button>
           ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredList.map((p, i) => (
                <div key={p.id} className={`glass-dark p-4 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                   p.status === 'ACTIVE' ? 'border-yellow-400 bg-yellow-400/10 scale-[1.02] shadow-lg z-10' : 
                   p.status === 'SOLD' ? 'opacity-30 border-green-500/20 grayscale translate-y-1' :
                   p.status === 'UNSOLD' ? 'opacity-30 border-red-500/20 grayscale' : 'border-white/5 hover:border-white/20'
                }`}>
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">LOT #{p.id}</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${
                         p.status === 'SOLD' ? 'text-green-500' : 
                         p.status === 'UNSOLD' ? 'text-red-500' : 
                         p.status === 'ACTIVE' ? 'text-yellow-400 animate-pulse' : 'text-slate-400'
                      }`}>{p.status}</span>
                   </div>
                   <h3 className={`text-sm font-black uppercase italic ${p.status === 'ACTIVE' ? 'text-white' : 'text-slate-200'}`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      {p.name}
                   </h3>
                   <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                         p.role === 'Batsman' ? 'text-blue-400 border-blue-400/20' : 
                         p.role === 'Bowler' ? 'text-red-400 border-red-400/20' : 
                         p.role === 'Wicket Keeper' ? 'text-green-400 border-green-400/20' : 'text-yellow-400 border-yellow-400/20'
                      }`}>{p.role}</span>
                   </div>
                </div>
              ))}
           </div>
           {filteredList.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                <span className="text-6xl mb-4">🔍</span>
                <p className="text-xs font-black uppercase tracking-[0.5em]">No intelligence found</p>
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/40 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-yellow-400" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Lot</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 opacity-50" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acquired</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 opacity-50" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pass/Unsold</span>
              </div>
           </div>
           <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic leading-none">
              Strategic Asset Preview Interface v2.0
           </p>
        </div>
      </div>
    </div>
  );
}
