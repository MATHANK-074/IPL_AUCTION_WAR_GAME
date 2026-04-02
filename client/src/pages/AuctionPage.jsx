import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import PlayerCard from '../components/PlayerCard';
import BidPanel from '../components/BidPanel';
import Dashboard from '../components/Dashboard';
import SoldOverlay from '../components/SoldOverlay';
import TeamProfile from '../components/TeamProfile';

export default function AuctionPage() {
  const {
    currentPlayer, currentBid, playerResult, playerIndex, totalPlayers,
    teams, roomInfo, myTeamId, isAdmin, auctionFinished,
  } = useGame();

  const [showResult, setShowResult] = useState(null);
  const [viewSquadFor, setViewSquadFor] = useState(null);

  useEffect(() => {
    if (playerResult) {
      setShowResult(playerResult);
    }
  }, [playerResult]);

  const getTeamMeta = (id) => teams.find(t => t.id === id);
  const myMeta = getTeamMeta(myTeamId);

  if (auctionFinished) {
    return <AuctionSummary summary={auctionFinished} teams={teams} getTeamMeta={getTeamMeta} />;
  }

  const progressPercent = totalPlayers ? ((playerIndex + 1) / totalPlayers) * 100 : 0;
  // ... rest of the main AuctionPage return remains same
  return (
    <div className="min-h-screen relative z-10 flex flex-col bg-[#020617]" style={{ maxHeight: '100vh', overflow: 'hidden' }}>
      <header className="px-8 py-5 flex items-center justify-between border-b border-white/5 glass-dark backdrop-blur-2xl z-30">
        <div className="flex items-center gap-6">
          <div className="relative group">
             <div className="absolute -inset-2 bg-yellow-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
             <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3 relative" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
               <span className="text-yellow-400">TATA</span> IPL AUCTION
               <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
             </h1>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="hidden md:flex items-center gap-4">
             <div className="text-left">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Lot Progress</p>
               <p className="text-xs font-black text-white italic">{playerIndex + 1} <span className="text-slate-500">/ {totalPlayers || 300}</span></p>
             </div>
             <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-200 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
             </div>
          </div>
        </div>
        {myMeta && (
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Franchise Portal</p>
               <p className="text-sm font-black text-yellow-400 italic uppercase" style={{ color: myMeta.color }}>{myMeta.name}</p>
            </div>
            <div className="relative group p-1 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all">
               <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/20 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 relative border-white/5">
                  <img src={myMeta.logo} alt={myTeamId} className="w-8 h-8 object-contain filter drop-shadow-md" />
                  <div className="h-6 w-px bg-white/10" />
                  <span className="text-sm font-black tracking-widest text-white">{myTeamId}</span>
                  {isAdmin && <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-md font-black">ADMIN</span>}
               </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        <aside className="col-span-12 lg:col-span-3 h-full overflow-hidden">
          <Dashboard onViewSquad={(id) => setViewSquadFor(id)} />
        </aside>
        <section className="col-span-12 lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
             <h2 className="text-[15rem] font-black italic -rotate-12 select-none" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
               {currentPlayer?.role?.split('-')[0] || 'IPL'}
             </h2>
          </div>
          <div className="w-full max-w-sm relative z-10 scale-90 lg:scale-100">
             <PlayerCard player={currentPlayer} currentBid={currentBid} teams={teams} />
          </div>
        </section>
        <aside className="col-span-12 lg:col-span-4 h-full overflow-hidden">
          <BidPanel />
        </aside>
      </main>

      {showResult && <SoldOverlay result={showResult} onDismiss={() => setShowResult(null)} />}
      {viewSquadFor && <TeamProfile teamId={viewSquadFor} onClose={() => setViewSquadFor(null)} />}
    </div>
  );
}

function AuctionSummary({ summary, teams, getTeamMeta }) {
  const [viewing, setViewing] = useState(null);

  const calculateTPI = (squad, purse) => {
    if (!squad || squad.length === 0) return 0;
    const baseValueSum = squad.reduce((acc, p) => acc + (p.base_price || 0.5), 0);
    const actualSpend = squad.reduce((acc, p) => acc + (p.soldPrice || 0.5), 0);
    const efficiency = (baseValueSum / actualSpend) * 40;
    const purseBonus = (purse / 100) * 20;
    const squadSizeBonus = (squad.length / 15) * 20;
    const marqueeCount = squad.filter(p => p.tier === 'Marquee').length;
    const internationalCount = squad.filter(p => p.tier?.includes('International')).length;
    const starPower = (marqueeCount * 5) + (internationalCount * 2);
    const roles = { Batsman: 0, Bowler: 0, 'All-rounder': 0 };
    squad.forEach(p => { if(roles[p.role] !== undefined) roles[p.role]++; });
    const balanceBonus = (roles.Batsman >= 7 && roles.Bowler >= 5 && roles['All-rounder'] >= 3) ? 10 : 0;
    return parseFloat((efficiency + purseBonus + squadSizeBonus + starPower + balanceBonus).toFixed(2));
  };

  const rankedTeams = Object.keys(summary.teams)
    .map(id => ({
      id,
      ...summary.teams[id],
      tpi: calculateTPI(summary.teams[id].squad, summary.teams[id].purse)
    }))
    .sort((a, b) => b.tpi - a.tpi);

  return (
    <div className="min-h-screen bg-[#020617] p-8 md:p-12 relative overflow-auto flex flex-col items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-blue-400/5 pointer-events-none" />
      <div className="w-full max-w-6xl z-10">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 mb-6">
            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.4em]">Strategic Review Complete</span>
          </div>
          <h1 className="text-7xl font-black italic shimmer-text leading-none uppercase mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            AUCTION <span className="text-white">CONCLUDED</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-xs">Franchise Performance Rankings</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rankedTeams.map((team, idx) => {
            const meta = getTeamMeta(team.id);
            const isWinner = idx === 0;
            return (
              <div key={team.id} className={`glass-dark p-8 rounded-[3rem] border-white/5 animate-badge-pop shadow-2xl relative group ${isWinner ? 'ring-2 ring-yellow-400/50' : ''}`} style={{ animationDelay: `${idx * 0.15}s` }}>
                {isWinner && <div className="absolute top-0 right-0 bg-yellow-400 text-black px-6 py-2 rounded-bl-3xl font-black text-[10px] tracking-widest uppercase z-30 shadow-xl">🏆 CHAMPION</div>}
                <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: meta?.color || '#F9CD1C' }} />
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-black/40 p-3 border border-white/5 shadow-inner">
                    <img src={meta?.logo} alt={team.id} className="w-full h-full object-contain filter drop-shadow-lg group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{meta?.name || team.id}</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rank #{idx + 1}</p>
                  </div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider">
                    <span className="text-slate-500">Performance Index</span>
                    <span className="text-yellow-400">{team.tpi} PTS</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 animate-shimmer" style={{ width: `${(team.tpi / rankedTeams[0].tpi) * 100}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Purse Excess</p>
                     <p className="text-lg font-black text-white">₹{team.purse?.toFixed(2)}Cr</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Assets</p>
                     <p className="text-lg font-black text-white">{team.squad?.length || 0}</p>
                  </div>
                </div>
                <button onClick={() => setViewing(team.id)} className="w-full mt-8 py-4 rounded-2xl border border-white/10 hover:border-white/30 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.3em] transition-all bg-white/[0.02]">Examine Squad Intel</button>
              </div>
            );
          })}
        </div>
        <div className="mt-16 text-center">
           <button onClick={() => window.location.reload()} className="btn-neon-gold px-12 py-5 text-lg">RE-INITIALIZE WAR ROOM</button>
        </div>
      </div>
      {viewing && <TeamProfile teamId={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
