import { useGame } from '../context/GameContext';

export default function Dashboard({ onViewSquad }) {
  const { roomInfo, teams, teamAnalytics } = useGame();

  const teamsData = roomInfo?.teams || {};
  const teamIds = Object.keys(teamsData);

  const getTeamMeta = (id) => teams.find(t => t.id === id);

  return (
    <div className="glass-dark p-6 rounded-[2.5rem] border-white/5 shadow-2xl h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">
            Franchise Recon
          </h2>
          <p className="text-sm font-black text-white italic" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Live Intelligence Feed
          </p>
        </div>
        <div className="flex -space-x-2">
           {teamIds.slice(0, 3).map(id => (
             <div key={id} className="w-6 h-6 rounded-full border-2 border-[#020617] bg-white/[0.05] p-1">
               <img src={getTeamMeta(id)?.logo} alt="" className="w-full h-full object-contain" />
             </div>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {teamIds.map(id => {
          const state = teamsData[id];
          const analytics = teamAnalytics[id] || { power: {} };
          const meta = getTeamMeta(id);
          const lowBudget = (state.purse || 0) < 10;
          const pursePercent = Math.max(0, Math.min(100, ((state.purse || 0) / 100) * 100));

          return (
            <button
              key={id}
              onClick={() => onViewSquad(id)}
              className="w-full group relative glass p-5 rounded-[2rem] border-white/5 transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.06] overflow-hidden"
            >
              {/* Dynamic light streak on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-black/40 p-2 border border-white/5 shadow-inner">
                  <img src={meta?.logo} alt={id} className="w-full h-full object-contain filter drop-shadow-md" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-black text-white tracking-widest uppercase truncate pr-2">
                      {meta?.name?.split(' ').pop() || id}
                    </span>
                    <span className={`text-base font-black italic ${lowBudget ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      ₹{state.purse?.toFixed(1)}Cr
                    </span>
                  </div>

                  {/* Purse Progress */}
                  <div className="h-1 rounded-full bg-white/10 mb-3 relative overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: `${pursePercent}%`,
                        background: lowBudget ? '#EF4444' : (meta?.color || '#F9CD1C'),
                        boxShadow: `0 0 10px ${lowBudget ? '#EF4444' : meta?.color}66`
                      }}
                    />
                  </div>

                  {/* Strategic Power Meters */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                     <PowerBar label="BAT" val={analytics.power.batting || 0} color="#00D2FF" />
                     <PowerBar label="PACE" val={analytics.power.pace || 0} color="#FF3B5C" />
                     <PowerBar label="SPIN" val={analytics.power.spin || 0} color="#F9CD1C" />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="grid grid-cols-4 gap-2">
                       <Metric val={state.roleCounts?.Batsman || 0} color="#00D2FF" label="B" />
                       <Metric val={state.roleCounts?.Bowler || 0} color="#FF3B5C" label="W" />
                       <Metric val={state.roleCounts?.['All-rounder'] || 0} color="#F9CD1C" label="A" />
                       <Metric val={state.roleCounts?.['Wicket Keeper'] || 0} color="#10B981" label="WK" />
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      {state.squad?.length || 0}/25 SQUAD
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ val, color, label }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="text-[10px] font-black text-white" style={{ color }}>{val}</span>
      <span className="text-[7px] font-bold text-slate-600 uppercase">{label}</span>
    </div>
  );
}

function PowerBar({ label, val, color }) {
  return (
    <div className="flex flex-col gap-1">
       <div className="flex justify-between items-center">
          <span className="text-[6px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
          <span className="text-[6px] font-black text-white">{val}%</span>
       </div>
       <div className="h-0.5 bg-white/5 rounded-full relative overflow-hidden">
          <div 
             className="absolute inset-y-0 left-0 transition-all duration-700" 
             style={{ width: `${val}%`, backgroundColor: color, boxShadow: `0 0 5px ${color}` }}
          />
       </div>
    </div>
  );
}
