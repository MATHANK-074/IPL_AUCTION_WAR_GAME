import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import socket from '../socket';

export default function SetListModal({ onClose }) {
  const { getSetList } = useGame();
  const [sets, setSets] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const loadSets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Safety timeout to prevent infinite hang
    const timer = setTimeout(() => {
      setLoading(false);
      if (!sets) {
        const msg = !socket.connected 
          ? "CRITICAL CODE 404: No active connection to the auction command center." 
          : "SIGNAL TIMEOUT: The player vault remains locked. Try refreshing or checking your connection.";
        setError(msg);
      }
    }, 15000);

    try {
      console.log("🛰️ Processing Local Sets Intelligence...");
      const data = getSetList();
      
      if (!data) {
        // If data is null, it means players aren't loaded yet
        setError("DATA VOID: Player intelligence not yet synchronized. Please wait a moment and retry.");
      } else if (Object.keys(data).length === 0) {
        setError("DATA VOID: No player sets found in the database.");
      } else {
        setSets(data);
        const keys = Object.keys(data).sort((a, b) => parseInt(a) - parseInt(b));
        if (keys.length > 0) setActiveTab(keys[0]);
      }
    } catch (e) {
      console.error("Set List Processing Error:", e);
      setError(`INTEL FAILURE: ${e.message || "Failed to process visual intelligence."}`);
    } finally {
      setLoading(false);
    }
  }, [getSetList]);

  useEffect(() => {
    loadSets();
  }, []); // Only on mount

  const allSets = useMemo(() => {
    if (!sets) return [];
    return Object.keys(sets).sort((a, b) => parseInt(a) - parseInt(b));
  }, [sets]);

  const currentSet = sets?.[activeTab];
  
  const filteredList = useMemo(() => {
    return currentSet?.list?.filter(p => 
      (p?.name?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (p?.role?.toLowerCase() || "").includes(search.toLowerCase())
    ) || [];
  }, [currentSet, search]);

  // LOADING STATE
  if (loading) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <button 
        onClick={onClose} 
        className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white/40 hover:text-white z-50 text-xl"
      >
        ✕
      </button>
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
           <div className="w-16 h-16 border-4 border-yellow-400/10 border-t-yellow-400 rounded-full animate-spin" />
           <div className="absolute inset-0 flex items-center justify-center text-xs opacity-40">📡</div>
        </div>
        <div className="flex flex-col items-center">
           <div className="text-yellow-400 font-black tracking-[0.3em] text-xs uppercase animate-pulse">Mobilizing Intel...</div>
           <div className="flex items-center gap-2 mt-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                 {isConnected ? 'Connection Established' : 'Awaiting Local Server Signal'}
              </p>
           </div>
        </div>
      </div>
    </div>
  );

  // ERROR STATE
  if (error) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-xl">
       <div className="bg-[#0f172a] p-10 rounded-[2.5rem] border border-red-500/20 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
             <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-black text-white italic uppercase mb-2 tracking-tight" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Synchronization <span className="text-red-500">Failed</span></h3>
          <p className="text-[10px] text-slate-500 uppercase font-black leading-relaxed mb-8 tracking-[0.2em]">{error}</p>
          <div className="flex gap-4">
             <button onClick={onClose} className="flex-1 py-4 rounded-2xl border border-white/5 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all">Dismiss</button>
             <button onClick={loadSets} className="flex-1 py-4 rounded-2xl bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-yellow-400/20">Purge & Retry</button>
          </div>
       </div>
    </div>
  );

  if (!sets || allSets.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#020617]/95 backdrop-blur-xl animate-fade-in">
      <div className="bg-[#0f172a] w-full max-w-7xl h-[90vh] rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header Section */}
        <div className="px-8 py-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <h2 className="text-xl font-black italic text-white uppercase tracking-tight" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Strategic <span className="text-yellow-400">Previews</span>
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                   <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                      {isConnected ? 'Live Database Connection Active' : 'CRITICAL: Disconnected from command center'}
                   </p>
                </div>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="relative group">
                 <input 
                    type="text" 
                    placeholder="Search player, role..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-yellow-400/40 w-full md:w-80 transition-all focus:ring-4 focus:ring-yellow-400/5 cursor-text"
                 />
                 <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none text-sm">🔍</span>
              </div>
              <button 
                onClick={onClose} 
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-xl group"
              >
                <span className="group-hover:rotate-90 transition-transform duration-300">✕</span>
              </button>
           </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-black/20 px-6 py-3 gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
           {allSets.map(s => (
             <button
                key={s}
                onClick={() => setActiveTab(s)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 flex items-center gap-3 ${
                  activeTab === s 
                    ? 'bg-yellow-400 text-black border-yellow-400 shadow-[0_0_20px_rgba(249,205,28,0.2)]' 
                    : 'text-slate-500 border-white/5 hover:border-white/10 hover:bg-white/5'
                }`}
             >
                {sets[s].name}
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === s ? 'bg-black/20' : 'bg-white/5'}`}>
                   {sets[s].list?.length || 0}
                </span>
             </button>
           ))}
        </div>

        {/* Action/Categorization Bar */}
        <div className="px-8 py-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-6">
           <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20">
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Set {activeTab}</span>
           </div>
           <div className="h-4 w-px bg-white/10" />
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
              {currentSet?.list?.length || 0} Total Assets Found
           </p>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(249,205,28,0.03),transparent)]">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-left">
              {filteredList.map((p, i) => {
                const isWK = p.role?.toLowerCase()?.includes('wicket');
                const roleBadgeClass = isWK ? 'badge-role-wk' : 
                                      p.role === 'Batsman' ? 'badge-role-batsman' : 
                                      p.role === 'Bowler' ? 'badge-role-bowler' : 'badge-role-allrounder';

                return (
                  <div 
                    key={p.id} 
                    className={`player-set-card group animate-fade-up ${
                       p.status === 'ACTIVE' ? 'ring-2 ring-yellow-400/50 bg-yellow-400/[0.07]' : 
                       (p.status === 'SOLD' || p.status === 'UNSOLD') ? 'opacity-40 grayscale-[0.8]' : ''
                    }`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-0.5">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lot #{p.id}</span>
                           <h3 className="text-base font-black text-white italic uppercase tracking-tight leading-tight" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                             {p.name}
                           </h3>
                        </div>
                        <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                           p.status === 'SOLD' ? 'bg-green-500/20 text-green-500' : 
                           p.status === 'UNSOLD' ? 'bg-red-500/20 text-red-500' : 
                           p.status === 'ACTIVE' ? 'bg-yellow-400 text-black animate-pulse' : 'bg-white/10 text-slate-500'
                        }`}>
                           {p.status}
                        </div>
                     </div>

                     <div className="flex items-center justify-between gap-2 mt-auto">
                        <span className={`badge-role ${roleBadgeClass}`}>
                           {p.role}
                        </span>
                        <div className="text-right">
                           <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">Base</p>
                           <p className="text-lg font-black text-[#10B981] leading-none" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              ₹{p.base_price}<span className="text-xs ml-0.5">Cr</span>
                           </p>
                        </div>
                     </div>

                     {p.status === 'SOLD' && (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-green-500" />
                     )}
                     {p.status === 'ACTIVE' && (
                        <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
                           <span className="relative flex h-2 w-2">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
                           </span>
                        </div>
                     )}
                  </div>
                );
              })}
           </div>

           {filteredList.length === 0 && (
             <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-3xl mb-4 grayscale opacity-50">
                   🔍
                </div>
                <h3 className="text-lg font-black text-white/40 uppercase tracking-widest">No Intelligence Matching Selection</h3>
                <p className="text-xs text-slate-600 uppercase mt-2 font-bold">Try adjusting your search filters or selecting another set</p>
             </div>
           )}
        </div>

        {/* Legend/Status Footer */}
        <div className="px-8 py-6 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(249,205,28,0.5)]" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Bid</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-60" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Sold</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-60" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unsold</span>
              </div>
           </div>
           <div>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic border-l border-white/10 pl-6">
                 Real-time Strategic Preview Interface • Version 3.1.0
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
