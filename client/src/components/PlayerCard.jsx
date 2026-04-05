export default function PlayerCard({ player, currentBid, teams }) {

  if (!player) return (
    <div className="h-[500px] flex items-center justify-center glass-dark rounded-[2.5rem] border-white/5 opacity-20">
      <p className="text-xs font-black tracking-widest uppercase italic">System Synchronizing...</p>
    </div>
  );

  const getTeamMeta = (id) => teams?.find(t => t.id === id);
  const bidTeam = currentBid ? getTeamMeta(currentBid.teamId) : null;

  return (
    <div className="relative group animate-fade-up">
      {/* Dynamic Glow behind card based on player tier/team */}
      <div className="absolute -inset-10 bg-yellow-400/5 blur-[100px] rounded-[3rem] opacity-50 pointer-events-none" />
      
      <div className="glass-dark p-8 rounded-[2.5rem] border-white/10 shadow-2xl relative overflow-hidden animate-float">
        {/* Shine effect */}
        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] pointer-events-none opacity-5"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 50%)' }} />

        {/* Role & Set Badge - Repositioned to corner with cleaner look */}
        <div className="absolute top-4 left-6 z-20 flex items-center gap-3">
          <span className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-[0.2em] shadow-lg border backdrop-blur-md ${
            player.role === 'Batsman' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 
            player.role === 'Bowler' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
            player.role === 'Wicket Keeper' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
          }`}>
            {player.role}
          </span>
          {player.setName && (
            <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest border-l border-white/10 pl-3">
               SET {player.setNum}
            </span>
          )}
        </div>

        {/* Player Identity - Focal Point */}
        <div className="text-center relative z-20 mb-6 pt-10">
          <div className="inline-block px-3 py-0.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 mb-4">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">{player.nationality}</span>
          </div>
          
          <div className="min-h-[100px] flex flex-col justify-center mb-4">
            <h2 className={`font-black text-white italic tracking-tighter leading-[0.85] uppercase transition-all duration-500 ${
              player.name.length > 15 ? 'text-3xl' : 'text-5xl'
            }`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {player.name}
            </h2>
          </div>

          <div className="flex items-center justify-center gap-4">
             <span className="h-px w-6 bg-gradient-to-r from-transparent to-yellow-400/20" />
             <p className="text-yellow-400/80 font-black text-[9px] tracking-[0.6em] uppercase">
               {player.tier} <span className="text-white/20 mx-1">•</span> {player.ipl_team}
             </p>
             <span className="h-px w-6 bg-gradient-to-l from-transparent to-yellow-400/20" />
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-2 px-2 mb-8">
          {[
            { label: 'MTCH', val: player.stats?.matches },
            { label: 'RUNS', val: player.stats?.runs },
            { label: 'AVG', val: player.stats?.avg },
            { label: 'SR', val: player.stats?.sr },
            { label: 'WKTS', val: player.stats?.wickets },
            { label: 'ECON', val: player.stats?.economy },
          ].map((s, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl group/stat hover:bg-white/[0.08] transition-all">
              <p className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-1 group-hover/stat:text-yellow-400/60">{s.label}</p>
              <p className="text-sm font-black text-white">{s.val || '-'}</p>
            </div>
          ))}
        </div>

        {/* Bid Status / Base Price Footer */}
        <div className="pt-6 border-t border-white/5">
          {currentBid ? (
            <div className="animate-badge-pop">
              <div className="flex justify-between items-center bg-white/[0.04] p-4 rounded-2xl border border-white/5 overflow-hidden relative">
                <div className="absolute inset-0 opacity-10" style={{ background: bidTeam?.color }} />
                <div className="flex items-center gap-3 relative z-10">
                  <img src={bidTeam?.logo} alt={currentBid.teamId} className="w-8 h-8 object-contain filter drop-shadow-md" />
                  <span className="text-sm font-black text-white tracking-widest uppercase">{bidTeam?.name || currentBid.teamId}</span>
                </div>
                <div className="text-right relative z-10">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Current Valuation</p>
                  <p className="text-2xl font-black italic shimmer-text" style={{ fontFamily: 'Rajdhani, sans-serif' }}>₹{currentBid.amount.toFixed(2)} CR</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center px-4 py-2 bg-yellow-400/5 rounded-2xl border border-yellow-400/10">
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Starting Valuation</span>
                <span className="text-sm font-black text-yellow-400 uppercase tracking-widest italic">Base Appraisal</span>
              </div>
              <span className="text-3xl font-black text-white italic" style={{ fontFamily: 'Rajdhani, sans-serif' }}>₹{player.base_price} CR</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
