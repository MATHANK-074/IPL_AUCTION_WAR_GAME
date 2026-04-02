import { useEffect, useState } from 'react';

export default function SoldOverlay({ result, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (result) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 500);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [result]);

  if (!result) return null;

  const isSold = result.result === 'SOLD';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background: isSold
          ? 'radial-gradient(circle at center, rgba(249,205,28,0.2) 0%, rgba(2,6,23,0.95) 75%)'
          : 'radial-gradient(circle at center, rgba(239,68,68,0.2) 0%, rgba(2,6,23,0.95) 75%)',
        backdropFilter: 'blur(12px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Background Particles / Glow */}
      <div className={`absolute inset-0 opacity-30 ${isSold ? 'animate-pulse' : ''}`}
        style={{ background: `radial-gradient(circle at 50% 50%, ${isSold ? '#F9CD1C' : '#EF4444'}22 0%, transparent 50%)` }} />

      <div className="text-center relative z-10 animate-sold px-6">
        {isSold ? (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 mb-8 relative">
               <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 animate-pulse" />
               <div className="text-9xl relative z-10 filter drop-shadow-2xl">🔨</div>
            </div>

            <h1 className="text-8xl md:text-9xl font-black italic shimmer-text leading-none uppercase mb-6"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              ACQUIRED
            </h1>

            <div className="glass-dark p-10 rounded-[3rem] border-white/10 shadow-[0_0_100px_rgba(249,205,28,0.1)] relative max-w-2xl w-full">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-6 py-1.5 rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-xl">
                Asset Secured
              </div>
              
              <div className="flex flex-col items-center">
                <p className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {result.player?.name}
                </p>
                <div className="h-px w-20 bg-white/10 mb-6" />
                
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Commanded by</p>
                <p className="text-5xl font-black italic tracking-tight shimmer-text uppercase mb-8" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {result.teamId}
                </p>

                <div className="bg-white/5 border border-white/5 px-10 py-5 rounded-2xl">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Final Acquisition Value</p>
                   <p className="text-4xl font-black text-white italic" style={{ fontFamily: 'Rajdhani, sans-serif' }}>₹{result.amount?.toFixed(2)} CR</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-9xl mb-8 filter grayscale opacity-50">🚫</div>
            
            <h1 className="text-8xl md:text-9xl font-black italic text-red-500 leading-none uppercase mb-6"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              UNSOLD
            </h1>

            <div className="glass-dark p-10 rounded-[3rem] border-red-500/20 shadow-2xl relative max-w-xl w-full">
              <p className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                {result.player?.name}
              </p>
              <div className="inline-block px-6 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
                <span className="text-xs font-black text-red-400 uppercase tracking-[0.3em]">No Bids Received • Lot Returned</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
