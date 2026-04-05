import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import socket from '../socket';
import { analyzeSquad } from '../utils/strategicAnalyzer';

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

  // New Strategic State: Real-time analysis for all teams
  const teamAnalytics = useMemo(() => {
    if (!roomInfo?.teams) return {};
    const analysis = {};
    Object.keys(roomInfo.teams).forEach(id => {
      const state = roomInfo.teams[id];
      analysis[id] = analyzeSquad(state.squad || [], state.purse);
    });
    return analysis;
  }, [roomInfo?.teams]);

  // Smart API Discovery
  const API_URL = useMemo(() => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || '';
    if (socketUrl) return socketUrl.replace(/\/$/, '').replace(/^ws/, 'http');
    return 'http://localhost:3001';
  }, []);

  // Fetch static data
  useEffect(() => {
    fetch(`${API_URL}/teams`).then(r => r.json()).then(setTeams).catch(e => console.warn("Teams fetch failed:", e));
    fetch(`${API_URL}/players`).then(r => r.json()).then(setPlayers).catch(e => console.warn("Players fetch failed:", e));
  }, [API_URL]);

  // Socket event listeners — MUST run before re-sync so roomUpdate is captured
  useEffect(() => {
    const onConnect = () => {
      console.log('📡 Connected to Command Center:', socket.id);
      const savedRoomId = localStorage.getItem('ipl_room_id');
      const savedTeamId = localStorage.getItem('ipl_team_id');
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
    };

    const onRoomUpdate = (info) => {
      setRoomInfo(info);
      const teamId = localStorage.getItem('ipl_team_id');
      if (teamId && info.adminTeamId === teamId) {
        setIsAdmin(true);
        localStorage.setItem('ipl_is_admin', 'true');
      }
    };

    const onNewPlayer = ({ player, timeLeft, playerIndex, totalPlayers }) => {
      setCurrentPlayer(player);
      setTimeLeft(timeLeft);
      setCurrentBid(null);
      setPlayerResult(null);
      setPlayerIndex(playerIndex);
      setTotalPlayers(totalPlayers);
    };

    const onTimerTick = ({ timeLeft }) => setTimeLeft(timeLeft);
    const onBidUpdate = ({ teamId, amount, timeLeft }) => {
      setCurrentBid({ teamId, amount });
      setTimeLeft(timeLeft);
    };
    const onRtmUsed = ({ teamId, amount }) => setCurrentBid({ teamId, amount });
    const onPlayerResult = ({ result, player, teamId, amount, teams: updatedTeams }) => {
      setPlayerResult({ result, player, teamId, amount });
      if (updatedTeams) setRoomInfo(prev => prev ? { ...prev, teams: updatedTeams } : prev);
    };
    const onAuctionFinished = (summary) => setAuctionFinished(summary);

    socket.on('connect', onConnect);
    socket.on('roomUpdate', onRoomUpdate);
    socket.on('newPlayer', onNewPlayer);
    socket.on('timerTick', onTimerTick);
    socket.on('bidUpdate', onBidUpdate);
    socket.on('rtmUsed', onRtmUsed);
    socket.on('playerResult', onPlayerResult);
    socket.on('auctionFinished', onAuctionFinished);

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('roomUpdate', onRoomUpdate);
      socket.off('newPlayer', onNewPlayer);
      socket.off('timerTick', onTimerTick);
      socket.off('bidUpdate', onBidUpdate);
      socket.off('rtmUsed', onRtmUsed);
      socket.off('playerResult', onPlayerResult);
      socket.off('auctionFinished', onAuctionFinished);
    };
  }, []);

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

  // Fully client-side set categorization to bypass production network issues
  const getSetList = useCallback(() => {
    if (!players || players.length === 0) return null;

    const WK_LIST = new Set([
      "Virat Kohli", "MS Dhoni", "KL Rahul", "Rishabh Pant", "Sanju Samson", "Ishan Kishan", 
      "Jos Buttler", "Quinton de Kock", "Nicholas Pooran", "Heinrich Klaasen", "Phil Salt", 
      "Jitesh Sharma", "Dhruv Jurel", "Dinesh Karthik", "Wriddhiman Saha", "Abhishek Porel",
      "Kumar Kushagra", "Shai Hope", "Tristan Stubbs", "Rahmanullah Gurbaz"
    ]);
    const isIndian = (p) => p.nationality === 'India';

    // Important: Use a sorted approach for building the sets to ensure predictability
    const sortedSource = [...sourceList].sort((a, b) => (a.id || 0) - (b.id || 0));
    
    sortedSource.forEach(p => {
      let setNum = p.setNum;
      let setName = p.setName;
      if (!setNum) {
        if (isIndian(p) && p.tier === 'Marquee') { setNum = 1; setName = 'STAR PLAYERS INDIA'; }
        else if (!isIndian(p) && p.tier === 'Marquee') { setNum = 2; setName = 'STAR PLAYERS INTERNATIONAL'; }
        else if (isIndian(p)) { setNum = 3; setName = 'CAPPED INDIAN PLAYERS'; }
        else if (!isIndian(p)) { setNum = 4; setName = 'CAPPED INTERNATIONAL PLAYERS'; }
        else { setNum = 7; setName = 'OTHER ASSETS'; }
      }

      if (!sets[setNum]) sets[setNum] = { name: setName, list: [] };
      
      let status = 'UPCOMING';
      if (roomInfo?.playerQueue && roomInfo.playerQueue.length > 0) {
        status = (roomInfo.soldPlayers || []).some(s => (s.player?.id || s.id) === p.id) ? 'SOLD' : 
                 (roomInfo.unsoldPlayers || []).some(u => u.id === p.id) ? 'UNSOLD' : 
                 roomInfo.currentPlayer?.id === p.id ? 'ACTIVE' : 'UPCOMING';
      }

      sets[setNum].list.push({ 
        id: p.id, name: p.name, 
        role: WK_LIST.has(p.name) ? 'Wicket Keeper' : p.role,
        base_price: p.base_price, status 
      });
    });

    return sets;
  }, [players, roomInfo]);

  const getTeamMeta = useCallback((id) => teams.find(t => t.id === id), [teams]);
  const getMyTeamState = useCallback(() => roomInfo?.teams?.[myTeamId], [roomInfo, myTeamId]);

  const value = useMemo(() => ({
    roomId, myTeamId, isAdmin, roomInfo, currentPlayer, timeLeft,
    currentBid, playerResult, playerIndex, totalPlayers,
    squads, teams, players, error, setError, auctionFinished,
    createRoom, joinRoom, startAuction, placeBid, useRTM, fetchSquad, getRoom, stopAuction,
    getTeamMeta, getMyTeamState, getSetList, teamAnalytics,
  }), [
    roomId, myTeamId, isAdmin, roomInfo, currentPlayer, timeLeft,
    currentBid, playerResult, playerIndex, totalPlayers,
    squads, teams, players, error, setError, auctionFinished,
    createRoom, joinRoom, startAuction, placeBid, useRTM, fetchSquad, getRoom, stopAuction,
    getTeamMeta, getMyTeamState, getSetList, teamAnalytics,
  ]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}
