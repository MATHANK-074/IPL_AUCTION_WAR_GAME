const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const engine = require('./engine/auctionEngine');

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
  socket.on('getSetList', (_, callback) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return callback && callback({ error: 'Not in a room' });
    
    const room = engine.ROOMS.get(meta.roomId);
    if (!room) return callback && callback({ error: 'Room not found' });

    // Use room.playerQueue if auction started, otherwise use master player list
    const sourceList = (room.playerQueue && room.playerQueue.length > 0) ? room.playerQueue : players;
    
    // Return players grouped by set
    const sets = {};
    sourceList.forEach(p => {
        if (!p.setNum) return; // Skip players not in a defined set
        if (!sets[p.setNum]) sets[p.setNum] = { name: p.setName, list: [] };
        
        let status = 'UPCOMING';
        if (room.playerQueue && room.playerQueue.length > 0) {
            status = room.soldPlayers.some(s => s.player.id === p.id) ? 'SOLD' : 
                     room.unsoldPlayers.some(u => u.id === p.id) ? 'UNSOLD' : 
                     room.currentPlayer?.id === p.id ? 'ACTIVE' : 'UPCOMING';
        }

        sets[p.setNum].list.push({ 
            id: p.id, 
            name: p.name, 
            role: p.role, 
            status 
        });
    });
    callback(sets);
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
