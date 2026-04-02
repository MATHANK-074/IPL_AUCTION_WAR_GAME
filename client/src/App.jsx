import { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import RoomPage from './pages/RoomPage';
import LobbyPage from './pages/LobbyPage';
import AuctionPage from './pages/AuctionPage';
import socket from './socket';

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
    <GameProvider>
      <AppInner />
    </GameProvider>
  );
}
