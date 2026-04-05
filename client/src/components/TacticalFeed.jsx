import { useEffect, useState, useRef } from 'react';
import { useGame } from '../context/GameContext';

export default function TacticalFeed() {
  const { currentBid, currentPlayer, playerResult, teamAnalytics, myTeamId } = useGame();
  const [logs, setLogs] = useState([]);
  const scrollRef = useRef(null);

  const myAdvisor = teamAnalytics[myTeamId];
  const topTip = myAdvisor?.tips?.[0] || "Strategic analysis in progress...";

  useEffect(() => {
    if (currentBid) {
      const newLog = {
        id: Date.now(),
        type: 'BID',
        msg: `${currentBid.teamId} raised bid to ₹${currentBid.amount}Cr`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    }
  }, [currentBid]);

  useEffect(() => {
    if (playerResult) {
      const newLog = {
        id: Date.now(),
        type: playerResult.result,
        msg: playerResult.result === 'SOLD' 
          ? `SUCCESS: ${playerResult.player.name} secured by ${playerResult.teamId}`
          : `NOTICE: ${playerResult.player.name} remains UNSOLD`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    }
  }, [playerResult]);

  useEffect(() => {
    if (currentPlayer) {
      const newLog = {
        id: Date.now(),
        type: 'NEW',
        msg: `INTEL: ${currentPlayer.name} (${currentPlayer.role}) entered the arena`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    }
  }, [currentPlayer]);

  return (
    <div className="flex-1 min-h-0 flex flex-col mt-6">
      {/* AI Strategic Advisor Box */}
      <div className="mb-6 p-4 rounded-2xl bg-yellow-400/[0.03] border border-yellow-400/10 relative overflow-hidden group">
         <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400/20" />
         <div className="flex items-center gap-2 mb-2">
            <span className="text-[8px] font-black text-yellow-400 uppercase tracking-[0.3em]">Strategic Advice</span>
            <div className="w-1 h-1 rounded-full bg-yellow-400 animate-ping" />
         </div>
         <p className="text-[10px] font-bold text-white leading-relaxed italic group-hover:text-yellow-400 transition-colors duration-300">
           "{topTip}"
         </p>
      </div>

      <div className="flex items-center gap-2 mb-3 px-2">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Tactical Feed</span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar"
      >
        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-[10px] text-slate-400">
            Awaiting signal...
          </div>
        )}
        {logs.map(log => (
          <div key={log.id} className="glass p-3 rounded-xl border-white/5 animate-fade-up">
            <div className="flex justify-between items-start mb-1">
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                log.type === 'BID' ? 'bg-yellow-400/10 text-yellow-500' :
                log.type === 'SOLD' ? 'bg-green-400/10 text-green-500' :
                log.type === 'UNSOLD' ? 'bg-red-400/10 text-red-500' :
                'bg-blue-400/10 text-blue-500'
              }`}>
                {log.type}
              </span>
              <span className="text-[8px] font-bold text-slate-600">{log.time}</span>
            </div>
            <p className="text-[10px] font-medium text-slate-300 leading-tight">
              {log.msg}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
