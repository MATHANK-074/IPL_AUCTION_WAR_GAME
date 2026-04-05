import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socket from '../socket';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [roomId, setRoomId] = useState(() => localStorage.getItem('ipl_room_id'));
  const [myTeamId, setMyTeamId] = useState(() => localStorage.getItem('ipl_team_id'));
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('ipl_is_admin') === 'true');
  const [roomInfo, setRoomInfo] = useState(null);   // { status, teamIds, teams }
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [currentBid, setCurrentBid] = useState(null); // { teamId, amount }
  const [playerResult, setPlayerResult] = useState(null);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [squads, setSquads] = useState({});          // teamId -> squad array
  const [teams, setTeams] = useState([]);            // from /teams REST
  const [players, setPlayers] = useState([]);        // from /players REST
  const [error, setError] = useState(null);
  const [auctionFinished, setAuctionFinished] = useState(null);

  // Fetch static data
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    fetch(`${API_URL}/teams`).then(r => r.json()).then(setTeams);
    fetch(`${API_URL}/players`).then(r => r.json()).then(setPlayers);
  }, []);

  // Socket event listeners — MUST run before re-sync so roomUpdate is captured
  useEffect(() => {
    const savedTeamId = localStorage.getItem('ipl_team_id');

    socket.on('roomUpdate', (info) => {
      setRoomInfo(info);
      // Re-derive admin from server truth on every update
      const teamId = savedTeamId || localStorage.getItem('ipl_team_id');
      if (teamId && info.adminTeamId === teamId) {
        setIsAdmin(true);
        localStorage.setItem('ipl_is_admin', 'true');
      }
    });

    socket.on('newPlayer', ({ player, timeLeft, playerIndex, totalPlayers }) => {
      setCurrentPlayer(player);
      setTimeLeft(timeLeft);
      setCurrentBid(null);
      setPlayerResult(null);
      setPlayerIndex(playerIndex);
      setTotalPlayers(totalPlayers);
    });

    socket.on('timerTick', ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socket.on('bidUpdate', ({ teamId, amount, timeLeft }) => {
      setCurrentBid({ teamId, amount });
      setTimeLeft(timeLeft);
    });

    socket.on('rtmUsed', ({ teamId, amount }) => {
      setCurrentBid({ teamId, amount });
    });

    socket.on('playerResult', ({ result, player, teamId, amount, teams: updatedTeams }) => {
      setPlayerResult({ result, player, teamId, amount });
      if (updatedTeams) {
        setRoomInfo(prev => prev ? { ...prev, teams: updatedTeams } : prev);
      }
    });

    socket.on('auctionFinished', (summary) => {
      setAuctionFinished(summary);
    });

    // Re-sync with room AFTER listeners are set up
    const savedRoomId = localStorage.getItem('ipl_room_id');
    if (savedRoomId && savedTeamId) {
      socket.emit('joinRoom', { roomId: savedRoomId, teamId: savedTeamId }, (resp) => {
        if (resp.error) {
          console.warn('Persistence sync failed:', resp.error);
          localStorage.removeItem('ipl_room_id');
          localStorage.removeItem('ipl_team_id');
          localStorage.removeItem('ipl_is_admin');
          setRoomId(null);
          setMyTeamId(null);
          setIsAdmin(false);
        }
      });
    }

    return () => {
      socket.off('roomUpdate');
      socket.off('newPlayer');
      socket.off('timerTick');
      socket.off('bidUpdate');
      socket.off('rtmUsed');
      socket.off('playerResult');
      socket.off('auctionFinished');
    };
  }, []); // Empty deps — runs ONCE on mount, captures localStorage values

  // Sync admin state on roomInfo change — belt-and-suspenders
  useEffect(() => {
    if (roomInfo && myTeamId) {
      const admin = roomInfo.adminTeamId === myTeamId;
      setIsAdmin(admin);
      if (admin) localStorage.setItem('ipl_is_admin', 'true');
    }
  }, [roomInfo, myTeamId]);

  const createRoom = useCallback((teamId) => {
    return new Promise((resolve, reject) => {
      socket.emit('createRoom', { teamId }, (resp) => {
        if (resp.error) return reject(resp.error);
        localStorage.setItem('ipl_room_id', resp.roomId);
        localStorage.setItem('ipl_team_id', teamId);
        localStorage.setItem('ipl_is_admin', 'true');
        setRoomId(resp.roomId);
        setMyTeamId(teamId);
        setIsAdmin(true);
        resolve(resp.roomId);
      });
    });
  }, []);

  const joinRoom = useCallback((code, teamId) => {
    return new Promise((resolve, reject) => {
      socket.emit('joinRoom', { roomId: code, teamId }, (resp) => {
        if (resp.error) return reject(resp.error);
        localStorage.setItem('ipl_room_id', code);
        localStorage.setItem('ipl_team_id', teamId);
        localStorage.removeItem('ipl_is_admin'); // joiners are not admins
        setRoomId(code);
        setMyTeamId(teamId);
        setIsAdmin(false);
        resolve();
      });
    });
  }, []);


  const startAuction = useCallback(() => {
    return new Promise((resolve, reject) => {
      socket.emit('startAuction', {}, (resp) => {
        if (resp && resp.error) return reject(resp.error);
        resolve();
      });
    });
  }, []);

  const placeBid = useCallback(() => {
    return new Promise((resolve, reject) => {
      socket.emit('placeBid', {}, (resp) => {
        if (resp.error) return reject(resp.error);
        resolve(resp);
      });
    });
  }, []);

  const useRTM = useCallback(() => {
    return new Promise((resolve, reject) => {
      socket.emit('useRTM', {}, (resp) => {
        if (resp.error) return reject(resp.error);
        resolve(resp);
      });
    });
  }, []);

  const fetchSquad = useCallback((teamId) => {
    socket.emit('getSquad', { teamId }, (resp) => {
      if (!resp.error) {
        setSquads(prev => ({ ...prev, [teamId]: resp }));
      }
    });
  }, []);

  const getRoom = useCallback((code) => {
    return new Promise((resolve, reject) => {
      socket.emit('getRoom', { roomId: code }, (resp) => {
        if (resp.error) return reject(resp.error);
        resolve(resp);
      });
    });
  }, []);

  const stopAuction = useCallback(() => {
    return new Promise((resolve, reject) => {
      socket.emit('stopAuction', {}, (resp) => {
        if (resp && resp.error) return reject(resp.error);
        resolve();
      });
    });
  }, []);

  const getSetList = useCallback(() => {
    return new Promise((resolve, reject) => {
      socket.emit('getSetList', {}, (resp) => {
        if (resp.error) return reject(resp.error);
        resolve(resp);
      });
    });
  }, []);

  const getTeamMeta = useCallback((id) => teams.find(t => t.id === id), [teams]);
  const getMyTeamState = useCallback(() => roomInfo?.teams?.[myTeamId], [roomInfo, myTeamId]);

  return (
    <GameContext.Provider value={{
      roomId, myTeamId, isAdmin, roomInfo, currentPlayer, timeLeft,
      currentBid, playerResult, playerIndex, totalPlayers,
      squads, teams, players, error, setError, auctionFinished,
      createRoom, joinRoom, startAuction, placeBid, useRTM, fetchSquad, getRoom, stopAuction,
      getTeamMeta, getMyTeamState, getSetList,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}
