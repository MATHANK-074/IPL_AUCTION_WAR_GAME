import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

export default function RoomPage({ onRoomJoined }) {
  const [mode, setMode] = useState('home'); // home | create | join
  const [teamId, setTeamId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [takenTeams, setTakenTeams] = useState([]);
  const { createRoom, joinRoom, getRoom, teams } = useGame();

  const ipl_teams = ['CSK','MI','RCB','KKR','SRH','DC','PBKS','RR','GT','LSG'];

  const [isCheckingRoom, setIsCheckingRoom] = useState(false);

  // Check room status when code is typed
  useEffect(() => {
    if (mode === 'join' && joinCode.length === 6) {
      setIsCheckingRoom(true);
      getRoom(joinCode.toUpperCase())
        .then(info => {
          setTakenTeams(info.teamIds || []);
          setErr('');
        })
        .catch(() => {
          setTakenTeams([]);
          setErr('Room not found');
        })
        .finally(() => setIsCheckingRoom(false));
    } else {
      setTakenTeams([]);
    }
  }, [joinCode, mode, getRoom]);

  const handleCreate = async () => {
    if (!teamId) return setErr('Please select your IPL team first!');
    setLoading(true); setErr('');
    try {
      await createRoom(teamId);
      onRoomJoined('lobby');
    } catch(e) { setErr(e); }
    finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return setErr('Enter room code!');
    if (!teamId) return setErr('Select your IPL team!');
    if (takenTeams.includes(teamId)) return setErr('Team already taken in this room!');
    
    setLoading(true); setErr('');
    try {
      await joinRoom(joinCode.trim().toUpperCase(), teamId);
      onRoomJoined('lobby');
    } catch(e) { setErr(e); }
    finally { setLoading(false); }
  };

  const getTeamMeta = (id) => teams.find(t => t.id === id);

  return (
    <div className="min-h-screen flex items-center justify-center relative z-10 p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-10 blur-3xl animate-float-slow"
            style={{
              width: `${100 + i * 50}px`, height: `${100 + i * 50}px`,
              background: i % 2 === 0 ? 'var(--neon-gold)' : 'var(--neon-blue)',
              left: `${(i * 17) % 90}%`, top: `${(i * 23) % 90}%`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md animate-fade-up">
        {/* Animated Trophy SVG / Icon */}
        <div className="text-center mb-10">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
            <div className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center glass border border-yellow-400/30 animate-float shadow-[0_0_40px_rgba(249,205,28,0.2)]">
              <span className="text-5xl group-hover:scale-110 transition-transform duration-500">🏆</span>
            </div>
          </div>
          <h1 className="mt-6 font-black tracking-tighter text-6xl text-white italic" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            <span className="shimmer-text">IPL</span> <span className="text-yellow-400">AUCTION</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="h-px w-8 bg-white/20"></span>
            <p className="text-slate-400 text-[10px] font-bold tracking-[0.4em] uppercase">The Ultimate War Room</p>
            <span className="h-px w-8 bg-white/20"></span>
          </div>
        </div>

        <div className="glass-dark p-8 rounded-[2rem] shadow-2xl border-white/5 relative overflow-hidden">
          {/* Glossy highlight */}
          <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] pointer-events-none opacity-10"
            style={{ background: 'radial-gradient(circle, #fff 0%, transparent 40%)' }} />

          {mode === 'home' && (
            <div className="space-y-4 pt-2">
              <button className="btn-neon-gold w-full text-lg py-5 group relative overflow-hidden" onClick={() => setMode('create')}>
                <span className="relative z-10">🏠 Create Master Lobby</span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
              </button>
              <button className="btn-glass w-full text-lg py-5 border-white/10 hover:border-yellow-400/40" onClick={() => setMode('join')}>
                🚪 Enter Room Code
              </button>
            </div>
          )}

          {(mode === 'create' || mode === 'join') && (
            <div className="space-y-6">
              <button className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors mb-2"
                onClick={() => { setMode('home'); setErr(''); setTeamId(''); setTakenTeams([]); }}>
                <span className="text-lg">‹</span> Back to Home
              </button>

              <h2 className="text-2xl font-black text-white italic" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                {mode === 'create' ? 'START NEW AUCTION' : 'JOIN THE BATTLE'}
              </h2>

              {mode === 'join' && (
                <div className="animate-fade-up">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-2 block">Validation Key</label>
                  <input
                    className={`input-glass text-center text-3xl font-black tracking-[0.4em] uppercase py-4 transition-all ${joinCode.length === 6 ? 'border-yellow-400/50 text-yellow-400' : ''}`}
                    placeholder="CODEHERE"
                    maxLength={6}
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value)}
                  />
                </div>
              )}

              <div className="animate-fade-up delay-100">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                  <span>Select Your Franchise</span>
                  {isCheckingRoom && (
                    <span className="flex items-center gap-2 text-yellow-400/60 lowercase italic">
                      <div className="w-2 h-2 border border-yellow-400/40 border-t-transparent rounded-full animate-spin" />
                      Checking availability...
                    </span>
                  )}
                  {!isCheckingRoom && mode === 'join' && joinCode.length === 6 && (
                    <span className="text-yellow-400/60 lowercase italic">
                      ({10 - takenTeams.length} available)
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {ipl_teams.map(id => {
                    const meta = getTeamMeta(id);
                    const selected = teamId === id;
                    const isTaken = mode === 'join' && takenTeams.includes(id);
                    
                    return (
                      <button key={id}
                        disabled={isTaken}
                        className={`group relative flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 ${
                          isTaken ? 'opacity-20 grayscale cursor-not-allowed scale-90' :
                          selected ? 'scale-110 shadow-lg' : 'hover:scale-105 border-white/5 bg-white/[0.02] hover:border-white/10'
                        }`}
                        style={selected ? { borderColor: meta?.color, background: `${meta?.color}15`, boxShadow: `0 0 20px ${meta?.color}44` } : {}}
                        onClick={() => setTeamId(id)}
                      >
                        <img src={meta?.logo} alt={id} className="w-10 h-10 object-contain drop-shadow-lg group-hover:rotate-6 transition-transform" />
                        <span className="text-[9px] font-black mt-2 tracking-tighter" style={selected ? { color: meta?.color } : { color: '#64748b' }}>
                          {id}
                        </span>
                        {isTaken && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-[1px] bg-red-500/50 rotate-45" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {err && (
                <div className="text-red-400 text-[11px] font-bold text-center py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-badge-pop">
                  ⚠️ {err.toUpperCase()}
                </div>
              )}

              <button
                className="btn-neon-gold w-full text-lg py-5 shadow-[0_10px_30px_rgba(249,205,28,0.2)] active:scale-[0.98]"
                onClick={mode === 'create' ? handleCreate : handleJoin}
                disabled={loading || (mode === 'join' && joinCode.length < 6)}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>SYNCHRONIZING...</span>
                  </div>
                ) : (
                  <span>{mode === 'create' ? 'CREATE ENGINE' : 'ENTER WAR ROOM'}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
