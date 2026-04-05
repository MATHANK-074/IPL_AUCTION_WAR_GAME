import { useGame } from '../context/GameContext';
import { useState } from 'react';
import TacticalFeed from './TacticalFeed';
import { getBudgetForecast } from '../utils/strategicAnalyzer';

export default function BidPanel() {
  const { timeLeft, currentBid, currentPlayer, myTeamId, roomInfo, placeBid, useRTM, teams } = useGame();
  const [bidError, setBidError] = useState('');
  const [rtmError, setRtmError] = useState('');

  const myState = roomInfo?.teams?.[myTeamId];
  const canRTM = currentPlayer?.ipl_team === myTeamId && !myState?.rtmUsed && currentBid && currentBid.teamId !== myTeamId;

  // Next bid amount
  const basePrice = currentPlayer?.base_price || 0.5;
  const lastBid = currentBid ? currentBid.amount : basePrice - 0.25;
  const nextBid = parseFloat((lastBid + 0.25).toFixed(2));

  // Strategic Budget Forecast
  const safeMaxBid = myState ? getBudgetForecast(myState.purse, myState.squad?.length || 0) : 0;

  // Bid button disabled conditions
  const noMoney = (myState?.purse || 0) < nextBid;
  const squadFull = (myState?.squad?.length || 0) >= 25;
  const isMineHighest = currentBid?.teamId === myTeamId;
  const bidDisabled = noMoney || squadFull || isMineHighest || !currentPlayer;

  const handleBid = async () => {
    setBidError('');
    try { await placeBid(); }
    catch(e) { setBidError(e); }
  };

  const handleRTM = async () => {
    setRtmError('');
    try { await useRTM(); }
    catch(e) { setRtmError(e); }
  };

  // Timer ring
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, timeLeft) / 10;
  const strokeDashoffset = circumference * (1 - progress);
  const timerColor = timeLeft <= 3 ? '#FF3B5C' : timeLeft <= 6 ? '#F9CD1C' : '#00D2FF';

  // Session Guard: Check if the user is actually in a room (Fixes "Capital Depleted" error)
  if (!myState) return (
    <div className="glass-dark p-8 rounded-[2.5rem] border-red-500/20 flex flex-col items-center justify-center text-center gap-4 h-full">
       <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-2xl animate-pulse">⚠️</div>
       <div>
          <p className="text-white font-black uppercase tracking-widest text-xs mb-1">Session Desynchronized</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
             Server was restarted. Your previous franchise status is lost.
          </p>
       </div>
       <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-red-500/20"
       >
          Re-initialize Portal
       </button>
    </div>
  );

  return (
    <div className="glass-dark p-8 rounded-[2.5rem] border-white/5 shadow-2xl relative overflow-hidden h-full flex flex-col justify-between">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-3xl rounded-full -mr-16 -mt-16" />

      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] text-center mb-8 shrink-0">
          Auction Chronometer
        </h3>

        {/* Timer Visualization */}
        <div className="flex flex-col items-center mb-8 shrink-0">
          <div className="relative w-40 h-40 group">
            <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
              <circle cx="80" cy="80" r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth="12" fill="none" />
              <circle cx="80" cy="80" r={radius} 
                stroke={timerColor} strokeWidth="12" fill="none"
                strokeLinecap="round" strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ 
                  transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
                  filter: `drop-shadow(0 0 15px ${timerColor}66)`
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-6xl font-black italic tracking-tighter ${timeLeft <= 3 ? 'animate-timer-urgent' : ''}`}
                style={{ fontFamily: 'Rajdhani, sans-serif', color: timerColor }}>
                {timeLeft}
              </span>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-[-5px]">Seconds</span>
            </div>
          </div>
        </div>

        {/* Financial Status & Forecast */}
        <div className="glass p-5 rounded-3xl border-white/5 mb-4 relative group overflow-hidden shrink-0">
          <div className={`absolute top-0 left-0 w-full h-1 transition-colors duration-500 ${myState.purse < 10 ? 'bg-red-500' : 'bg-yellow-400'}`} />
          <div className="flex justify-between items-end gap-4 overflow-hidden">
            <div className="text-left flex-1">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Available Capital</p>
              <p className={`text-3xl font-black italic leading-none truncate ${myState.purse < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}
                style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                ₹{myState.purse.toFixed(2)}<span className="text-sm text-slate-500 ml-1">CR</span>
              </p>
            </div>
            <div className="text-right border-l border-white/10 pl-4">
               <p className="text-[7px] text-yellow-400/60 font-black uppercase tracking-widest mb-1">Strategic Max Bid</p>
               <p className="text-lg font-black text-yellow-400 leading-none" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  ₹{safeMaxBid}<span className="text-[10px] ml-0.5">Cr</span>
               </p>
            </div>
          </div>
        </div>

        {/* Live Intel / Tactical Feed */}
        <TacticalFeed />
      </div>

      {/* Control Unit */}
      <div className="space-y-4">
        {bidError && (
          <div className="bg-red-500/10 border border-red-500/20 py-2 px-4 rounded-xl animate-fade-up">
            <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-wider">{bidError}</p>
          </div>
        )}

        <button 
          onClick={handleBid} 
          disabled={bidDisabled}
          className={`w-full py-6 rounded-3xl font-black text-xl italic tracking-tighter uppercase transition-all duration-500 relative overflow-hidden group shadow-2xl ${
            isMineHighest 
              ? 'bg-green-500/10 border border-green-500/20 text-green-500 cursor-default' 
              : bidDisabled 
                ? 'bg-white/5 border border-white/10 text-slate-600 grayscale opacity-40 cursor-not-allowed'
                : 'bg-yellow-400 text-black hover:scale-[1.02] active:scale-[0.98]'
          }`}
          style={{ fontFamily: 'Rajdhani, sans-serif' }}
        >
          {isMineHighest ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> {teams?.find(t => t.id === currentBid.teamId)?.name || currentBid.teamId}
            </span>
          ) : noMoney ? (
            'CAPITAL DEPLETED'
          ) : squadFull ? (
            'SQUAD MAXIMIZED'
          ) : (
            <>
              <span className="relative z-10">PLACE BID: ₹{nextBid.toFixed(2)} CR</span>
              <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            </>
          )}
        </button>

        {canRTM && (
          <div className="animate-fade-up">
            <button 
              onClick={handleRTM}
              className="w-full py-4 rounded-3xl bg-red-600/10 border-2 border-red-500 text-red-500 font-black text-sm uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-rtm-glow hover:bg-red-600 hover:text-white"
            >
              🔄 EXECUTIVE RTM OPTION
            </button>
            <p className="text-[8px] text-slate-600 text-center uppercase mt-2 tracking-widest font-bold">Match Current Valuation: ₹{currentBid?.amount?.toFixed(2)} CR</p>
          </div>
        )}

        {/* Role Metrics */}
        {myState && (
          <div className="grid grid-cols-4 gap-2 pt-6">
            {[
              { label: 'BAT', val: `${myState.roleCounts?.Batsman || 0}/9`, color: '#00D2FF' },
              { label: 'BOWL', val: `${myState.roleCounts?.Bowler || 0}/9`, color: '#FF3B5C' },
              { label: 'AR', val: `${myState.roleCounts?.['All-rounder'] || 0}/5`, color: '#F9CD1C' },
              { label: 'WK', val: `${myState.roleCounts?.['Wicket Keeper'] || 0}/2`, color: '#10B981' },
            ].map((r, i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-2xl py-3 px-1 text-center">
                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">{r.label}</p>
                <p className="text-[11px] font-black text-white italic" style={{ color: r.color }}>{r.val}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
