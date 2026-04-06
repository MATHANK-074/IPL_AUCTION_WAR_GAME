const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const engine = require('./engine/auctionEngine');

// Static definitions for set/role categorization
const WK_LIST = new Set([
  "Virat Kohli", "MS Dhoni", "KL Rahul", "Rishabh Pant", "Sanju Samson", "Ishan Kishan", 
  "Jos Buttler", "Quinton de Kock", "Nicholas Pooran", "Heinrich Klaasen", "Phil Salt", 
  "Jitesh Sharma", "Dhruv Jurel", "Dinesh Karthik", "Wriddhiman Saha", "Abhishek Porel",
  "Kumar Kushagra", "Shai Hope", "Tristan Stubbs", "Rahmanullah Gurbaz"
]);
const isIndian = (p) => p.nationality === 'India';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Load data
const players = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/players.json'), 'utf-8'));
const teams = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/teams.json'), 'utf-8'));

// REST endpoints
app.get('/', (req, res) => res.send('🚀 IPL Auction Server - Active and Running!'));
app.get('/players', (req, res) => res.json(players));
app.get('/teams', (req, res) => res.json(teams));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// REST fallback for Set List with Diagnostic Ability
app.get('/debug/:roomId', (req, res) => {
    const { roomId } = req.params;
    const room = engine.ROOMS.get(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({
        engineVersion: 'v3-robust',
        status: room.status,
        playerIndex: room.currentIndex,
        queueLength: room.playerQueue ? room.playerQueue.length : 0,
        playerQueue: room.playerQueue || [],
        playersInSet1: room.playerQueue?.filter(p => p.setNum === 1).length,
        playersInSet2: room.playerQueue?.filter(p => p.setNum === 2).length,
        playersInSet3: room.playerQueue?.filter(p => p.setNum === 3).length,
        playersInSet4: room.playerQueue?.filter(p => p.setNum === 4).length,
    });
});

app.get('/sets/:roomId', (req, res) => {
    const { roomId } = req.params;
    const room = engine.ROOMS.get(roomId);
    
    try {
        const getCategory = (p) => {
            const nat = (p.nationality || "").toLowerCase().trim();
            const isInd = nat === "india" || nat === "indian";
            const baseP = parseFloat(p.base_price || 0);
            const tier = (p.tier || "").toLowerCase().trim();
            const isS = (tier === 'marquee' || tier === 'international top' || tier === 'star' || baseP >= 2.0);
            
            if (isInd && isS) return { num: 1, name: '★ [v3] STAR PLAYERS INDIA ★' };
            if (!isInd && isS) return { num: 2, name: '★ [v3] STAR PLAYERS INT ★' };
            if (isInd) return { num: 3, name: '★ [v3] CAPPED INDIAN ★' };
            return { num: 4, name: '★ [v3] CAPPED INTERNATIONAL ★' };
        };

        const sourceList = (room && room.playerQueue && room.playerQueue.length > 0) ? room.playerQueue : [...players].sort((a,b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
        
        const sets = {};
        sourceList.forEach(p => {
            let { num: setNum, name: setName } = getCategory(p);
            if (!sets[setNum]) sets[setNum] = { name: setName, list: [] };
            sets[setNum].list.push(p);
        });
        
        res.json(sets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Track socket -> { roomId, teamId }
const socketMeta = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  // ── CREATE ROOM ──────────────────────────────────────────────────
  socket.on('createRoom', ({ teamId }, callback) => {
    const roomId = uuidv4().substring(0, 6).toUpperCase();
    engine.createRoom(roomId, socket.id, teamId);
    socket.join(roomId);
    socketMeta.set(socket.id, { roomId, teamId });

    console.log(`🏠 Room created: ${roomId} by ${teamId}`);
    callback({ roomId, success: true });
    io.to(roomId).emit('roomUpdate', engine.getRoomInfo(roomId));
  });

  // ── JOIN ROOM ────────────────────────────────────────────────────
  socket.on('joinRoom', ({ roomId, teamId }, callback) => {
    const result = engine.joinRoom(roomId, teamId);
    if (result.error) return callback({ error: result.error });

    socket.join(roomId);
    socketMeta.set(socket.id, { roomId, teamId });

    console.log(`👋 ${teamId} joined room ${roomId}`);
    callback({ success: true });
    io.to(roomId).emit('roomUpdate', engine.getRoomInfo(roomId));
  });

  // ── START AUCTION ────────────────────────────────────────────────
  socket.on('startAuction', (_, callback) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return callback && callback({ error: 'Not in a room' });

    const { roomId } = meta;
    const info = engine.getRoomInfo(roomId);
    if (!info) return callback && callback({ error: 'Room not found' });

    if (info.teamIds.length < 4) {
      console.log(`⚠️ Start blocked: Room ${roomId} has only ${info.teamIds.length} teams.`);
      return callback && callback({ error: `Need at least 4 teams to start (Current: ${info.teamIds.length})` });
    }

    console.log(`🏏 Auction started in room ${roomId}`);
    engine.startAuction(roomId, players, io);
    callback && callback({ success: true });
  });

  // ── PLACE BID ────────────────────────────────────────────────────
  socket.on('placeBid', (_, callback) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return callback({ error: 'Not in a room' });

    const result = engine.placeBid(meta.roomId, meta.teamId, io);
    callback(result);
  });

  // ── USE RTM ──────────────────────────────────────────────────────
  socket.on('useRTM', (_, callback) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return callback({ error: 'Not in a room' });

    const result = engine.useRTM(meta.roomId, meta.teamId, io);
    callback(result);
  });

  // ── GET SQUAD ────────────────────────────────────────────────────
  socket.on('getSquad', ({ teamId }, callback) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return callback({ error: 'Not in a room' });

    const squad = engine.getSquad(meta.roomId, teamId);
    callback(squad || { error: 'Team not found' });
  });

  // ── GET ROOM ─────────────────────────────────────────────────────
  socket.on('getRoom', ({ roomId }, callback) => {
    const info = engine.getRoomInfo(roomId);
    if (!info) return callback({ error: 'Room not found' });
    callback(info);
  });

  // ── GET SET LIST ─────────────────────────────────────────────────
  socket.on('getSetList', (meta) => {
    try {
      const room = engine.ROOMS.get(meta.roomId);
      if (!room) return;

      const getCategory = (p) => {
        const nat = (p.nationality || "").toLowerCase().trim();
        const isInd = nat === "india" || nat === "indian";
        const baseP = parseFloat(p.base_price || 0);
        const tier = (p.tier || "").toLowerCase().trim();
        const isS = (tier === 'marquee' || tier === 'international top' || tier === 'star' || baseP >= 2.0);
        
        if (isInd && isS) return { num: 1, name: '★ [v3] STAR PLAYERS INDIA ★' };
        if (!isInd && isS) return { num: 2, name: '★ [v3] STAR PLAYERS INT ★' };
        if (isInd) return { num: 3, name: '★ [v3] CAPPED INDIAN ★' };
        return { num: 4, name: '★ [v3] CAPPED INTERNATIONAL ★' };
      };

      const sourceList = (room.playerQueue && room.playerQueue.length > 0) ? room.playerQueue : [...players].sort((a,b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
      const sets = {};
      sourceList.forEach(p => {
        const { num: setNum, name: setName } = getCategory(p);
        if (!sets[setNum]) sets[setNum] = { name: setName, list: [] };
        
        let status = 'UPCOMING';
        if (room.playerQueue && room.playerQueue.length > 0) {
            status = (room.soldPlayers || []).some(s => (s.player?.id || s.id) === p.id) ? 'SOLD' : 
                     (room.unsoldPlayers || []).some(u => u.id === p.id) ? 'UNSOLD' : 
                     room.currentPlayer?.id === p.id ? 'ACTIVE' : 'UPCOMING';
        }
        
        sets[setNum].list.push({ ...p, status });
      });

      socket.emit('setList', sets);
    } catch (error) {
      console.error("Critical Server Error in getSetList:", error);
    }
  });

  // ── STOP AUCTION ────────────────────────────────────────────────
  socket.on('stopAuction', (_, callback) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return callback && callback({ error: 'Not in a room' });

    console.log(`⏹️ Auction manually stopped in room ${meta.roomId}`);
    engine.stopAuction(meta.roomId, io);
    if (callback) callback({ success: true });
  });

  // ── DISCONNECT ───────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const meta = socketMeta.get(socket.id);
    if (meta) {
      console.log(`❌ Disconnected: ${meta.teamId} from room ${meta.roomId}`);
      socketMeta.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 IPL Auction Server running on http://localhost:${PORT}`);
});
