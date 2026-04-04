import { useState, useEffect, Component } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import RoomPage from './pages/RoomPage';
import LobbyPage from './pages/LobbyPage';
import AuctionPage from './pages/AuctionPage';
import socket from './socket';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#020617', color: 'white', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#F9CD1C' }}>🚨 CRITICAL RENDER CRASH</h1>
          <p>The application encountered a silent error and could not mount.</p>
          <pre style={{ background: '#0f172a', padding: '1rem', borderRadius: '1rem', marginTop: '1rem', overflow: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: '2rem', padding: '1rem 2rem', background: '#F9CD1C', color: 'black', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            FORCE HARD RESET
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  const [screen, setScreen] = useState('room'); // room | lobby | auction
  const { roomInfo } = useGame();

  // If server pushes auction started
  useEffect(() => {
    socket.on('newPlayer', () => {
      setScreen('auction');
    });
    return () => socket.off('newPlayer');
  }, []);

  if (screen === 'room') {
    return <RoomPage onRoomJoined={(next) => setScreen(next)} />;
  }
  if (screen === 'lobby') {
    return <LobbyPage onStartAuction={() => setScreen('auction')} />;
  }
  return <AuctionPage />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <AppInner />
      </GameProvider>
    </ErrorBoundary>
  );
}
