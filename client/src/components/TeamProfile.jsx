import { useEffect, useMemo } from 'react';
import { useGame } from '../context/GameContext';

export default function TeamProfile({ teamId, onClose }) {
  const { fetchSquad, squads, teams, roomInfo } = useGame();

  useEffect(() => {
    if (teamId) fetchSquad(teamId);
  }, [teamId]);

  const meta = useMemo(() => teams.find(t => t.id === teamId), [teams, teamId]);
  const teamState = roomInfo?.teams?.[teamId];
  const squadData = squads[teamId];
  const squad = squadData?.squad || [];

  const grouped = useMemo(() => ({
    Batsman: squad.filter(p => p.role === 'Batsman'),
    Bowler: squad.filter(p => p.role === 'Bowler'),
    'All-rounder': squad.filter(p => p.role === 'All-rounder'),
    'Wicket Keeper': squad.filter(p => p.role === 'Wicket Keeper'),
  }), [squad]);

  if (!teamId) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end overflow-hidden"
      style={{ background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}>
      
      <div
        className="w-full max-w-xl h-full glass-dark border-l border-white/10 shadow-2xl p-0 flex flex-col animate-fade-up relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative Background Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.02] blur-[100px] rounded-full -mr-48 -mt-48 pointer-events-none" />

        {/* Header Section */}
        <div className="p-8 border-b border-white/5 relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-black/40 p-4 border border-white/5 shadow-2xl relative group">
               <div className="absolute inset-0 rounded-3xl blur-xl opacity-20" style={{ background: meta?.color }} />
               <img src={meta?.logo} alt={teamId} className="w-full h-full object-contain relative z-10 filter drop-shadow-md" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                 {meta?.name || teamId}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tactical Asset Log • {squad.length}/25 Secured</span>
              </div>
            </div>
          </div>
          <button 
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body Section */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar relative z-10 space-y-10">
          
          {/* Purse Intelligence */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-6 rounded-[2rem] border-white/5 relative group overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400" />
               <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest mb-1">Reserve Capital</p>
               <p className="text-4xl font-black text-white italic shimmer-text" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                 ₹{(teamState?.purse ?? squadData?.purse ?? 0).toFixed(2)}<span className="text-lg text-slate-500 ml-1 italic">CR</span>
               </p>
            </div>
            <div className="glass-dark p-6 rounded-[2rem] border-white/5 flex flex-col justify-center">
               <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest mb-1">Squad Saturation</p>
               <div className="flex items-end gap-2">
                 <p className="text-3xl font-black text-white italic leading-none">{squad.length}</p>
                 <span className="text-xs font-black text-slate-600 uppercase mb-1">/ 25 ASSETS</span>
               </div>
            </div>
          </div>

          {/* Asset Allocation Metrics */}
          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2 mb-4">Strategic Quotas</h3>
             <div className="grid grid-cols-4 gap-4">
                {[
                  { role: 'Batsman', label: 'BAT', icon: '🏏', color: '#00D2FF', max: 25 },
                  { role: 'Bowler', label: 'BOWL', icon: '⚡', color: '#FF3B5C', max: 25 },
                  { role: 'All-rounder', label: 'AR', icon: '⭐', color: '#F9CD1C', max: 25 },
                  { role: 'Wicket Keeper', label: 'WK', icon: '🧤', color: '#10B981', max: 25 },
                ].map(r => {
                  const count = grouped[r.role]?.length || 0;
                  const progress = (count / r.max) * 100;
                  return (
                    <div key={r.role} className="glass p-4 rounded-3xl border-white/5 group hover:border-white/10 transition-colors">
                       <div className="flex justify-between items-center mb-3">
                         <span className="text-lg opacity-80">{r.icon}</span>
                         <span className="text-xs font-black text-white italic" style={{ color: r.color }}>{count}</span>
                       </div>
                       <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, background: r.color }} />
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Grouped Asset List */}
          <div className="space-y-8">
            {Object.entries(grouped).map(([role, players]) => (
              <div key={role} className={players.length === 0 ? 'hidden' : ''}>
                <div className="flex items-center gap-4 mb-4 px-2">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{role} Division</h4>
                   <div className="h-px flex-1 bg-white/[0.03]" />
                </div>
                <div className="space-y-3">
                  {players.map(p => (
                    <div key={p.id} className="group relative glass p-4 rounded-2xl border-white/5 hover:bg-white/[0.04] transition-all duration-300">
                       <div className="flex justify-between items-center relative z-10">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 group-hover:border-yellow-400/30 transition-colors">
                               <span className="text-xs font-black text-white italic uppercase tracking-tighter" style={{ color: meta?.color }}>{p.nationality.slice(0, 3)}</span>
                            </div>
                            <div>
                               <p className="text-sm font-black text-white italic uppercase tracking-tight">{p.name}</p>
                               <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{p.role} • {p.ipl_team}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-yellow-500 italic shimmer-text" style={{ fontFamily: 'Rajdhani, sans-serif' }}>₹{p.soldPrice?.toFixed(2)} CR</p>
                            <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mt-0.5">Value secured</p>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {squad.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center opacity-20">
               <div className="text-8xl mb-6 grayscale">🏟️</div>
               <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-500">Asset log null</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
