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

        {/* Role Badge */}
        <div className="absolute top-6 right-6 z-20">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg border ${
            player.role === 'Batsman' ? 'role-Batsman' : 
            player.role === 'Bowler' ? 'role-Bowler' : 'role-All-rounder'
          }`}>
            {player.role}
          </span>
        </div>

        {/* Player Identity - Focal Point */}
        <div className="text-center relative z-20 mb-8 pt-4">
          <div className="inline-block px-4 py-1 bg-yellow-400/10 backdrop-blur-md rounded-full border border-yellow-400/20 mb-4">
            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em]">{player.nationality}</span>
          </div>
          
          <h2 className="text-5xl font-black text-white italic tracking-tighter leading-none mb-4 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {player.name}
          </h2>

          <div className="flex items-center justify-center gap-4">
             <span className="h-px w-8 bg-gradient-to-r from-transparent to-yellow-400/30" />
             <p className="text-yellow-400 font-black text-[10px] tracking-[0.5em] uppercase">
               {player.tier} • {player.ipl_team}
             </p>
             <span className="h-px w-8 bg-gradient-to-l from-transparent to-yellow-400/30" />
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-3 mb-8">
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
                  <img src={bidTeam?.logo} alt={currentBid.teamId} className="w-8 h-8 object-contain drop-shadow-md" />
                  <span className="text-sm font-black text-white tracking-widest uppercase">{currentBid.teamId}</span>
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
