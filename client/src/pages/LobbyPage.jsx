import { useGame } from '../context/GameContext';

export default function LobbyPage({ onStartAuction }) {
  const { roomId, myTeamId, roomInfo, teams, startAuction, setError } = useGame();

  const teamIds = roomInfo?.teamIds || [];
  const getTeamMeta = (id) => teams.find(t => t.id === id);
  const teamCount = teamIds.length;
  const minTeams = 4;

  // Anyone can start when min teams are met — server has no admin restriction
  const canStart = teamCount >= minTeams;

  const handleStart = async () => {
    try {
      await startAuction();
      onStartAuction();
    } catch(e) { setError(e); }
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(roomId);
    alert('Room Code Copied!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <div className="w-full max-w-4xl animate-fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="text-left">
            <h1 className="text-5xl font-black text-white italic leading-tight uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              AUCTION <span className="text-yellow-400">WAR ROOM</span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-slate-500 font-bold tracking-[0.3em] uppercase text-[10px]">
                System Synchronized • Waiting for Mobilization
              </p>
            </div>
          </div>

          <div className="glass-dark px-10 py-6 rounded-3xl border-white/5 shadow-2xl relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400/50" />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 text-center">Invasion Code</p>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black text-white tracking-[0.2em]">{roomId}</span>
              <button onClick={copyCode} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-xl">
                📋
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rules & Status Sidebar */}
          <div className="space-y-6">
            <div className="glass-dark p-6 rounded-[2rem] border-white/5 shadow-xl">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                Session Logistics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Deployment</span>
                  <span className="text-sm font-black text-white">{teamCount} / 10 TEAMS</span>
                </div>
                <div className="flex justify-between items-center bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Capital Cap</span>
                  <span className="text-sm font-black text-yellow-500">₹100.00 CR</span>
                </div>
                <div className="flex justify-between items-center bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Bidding Window</span>
                  <span className="text-sm font-black text-white">10 SECONDS</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-400/5 border border-yellow-400/10 p-5 rounded-2xl">
              <p className="text-[10px] text-slate-400 leading-relaxed italic font-medium">
                * Note: Minimum {minTeams} franchises required to initialize the auction engine. 
                Full squad requires 7 Batsmen, 5 Bowlers, and 3 All-rounders.
              </p>
            </div>
          </div>

          {/* Teams Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {teamIds.map((id, idx) => {
                const meta = getTeamMeta(id);
                const isMe = id === myTeamId;
                return (
                  <div key={id} className="animate-badge-pop" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div className={`glass-dark p-6 rounded-[1.8rem] border transition-all duration-500 flex flex-col items-center group relative overflow-hidden ${
                      isMe ? 'border-yellow-400/40 shadow-[0_0_30px_rgba(249,205,28,0.1)]' : 'border-white/5 hover:border-white/20'
                    }`}>
                      {isMe && <div className="absolute top-2 right-2 text-[8px] font-black bg-yellow-400 text-black px-2 py-0.5 rounded-full">YOU</div>}
                      <div className="w-16 h-16 mb-4 relative group-hover:scale-110 transition-transform duration-500">
                        <div className="absolute inset-0 rounded-full blur-2xl opacity-10 group-hover:opacity-30 transition-opacity" style={{ backgroundColor: meta?.color || '#F9CD1C' }} />
                        <img src={meta?.logo} alt={id} className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
                      </div>
                      <span className="text-xs font-black text-white tracking-widest">{id}</span>
                      <span className="text-[8px] text-slate-500 mt-1 uppercase font-black tracking-tighter truncate w-full text-center">
                        {meta?.name}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {/* Dummy Slots */}
              {[...Array(Math.max(0, 6 - teamCount))].map((_, i) => (
                <div key={`empty-${i}`} className="glass-dark p-6 rounded-[1.8rem] border-dashed border-white/5 flex flex-col items-center justify-center opacity-30 grayscale">
                  <div className="w-12 h-12 border-2 border-white/5 rounded-full flex items-center justify-center mb-3">
                    <span className="text-lg font-black text-white/10 italic">?</span>
                  </div>
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Mobilizing...</span>
                </div>
              ))}
            </div>

            {/* Start Button */}
            <div className="mt-12">
              <button
                disabled={!canStart}
                onClick={handleStart}
                className={`btn-neon-gold w-full py-6 text-xl shadow-2xl relative overflow-hidden group transition-all duration-500 ${
                  !canStart ? 'grayscale opacity-30 cursor-not-allowed scale-95' : 'hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  🚀 {canStart ? 'INITIALIZE AUCTION SEQUENCE' : `PENDING ${minTeams - teamCount} MORE FRANCHISES`}
                </span>
                {canStart && (
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
