const ROOMS = new Map();
const MAX_SQUAD = 25;
const MIN_SQUAD = 11;
const BUDGET = 100;
const BID_INCREMENT = 0.25;
const TIMER_SECONDS = 10;

// Roles are now just for display and tracking, no strict quota enforced except max squad
const ROLE_QUOTAS = { Batsman: 25, Bowler: 25, 'All-rounder': 25, 'Wicket Keeper': 25 };

function createTeamState(teamId) {
  return {
    teamId,
    purse: BUDGET,
    squad: [],
    rtmUsed: false,
    roleCounts: { Batsman: 0, Bowler: 0, 'All-rounder': 0, 'Wicket Keeper': 0 },
  };
}

function getRoomState(roomId) {
  return ROOMS.get(roomId);
}

function createRoom(roomId, adminSocketId, adminTeamId) {
  const teams = {};
  teams[adminTeamId] = createTeamState(adminTeamId);
  ROOMS.set(roomId, {
    roomId,
    adminSocketId,
    adminTeamId, // Track which team is the admin
    teams,
    playerQueue: [],
    currentIndex: 0,
    currentPlayer: null,
    timer: null,
    timeLeft: TIMER_SECONDS,
    currentBid: null, // { teamId, amount }
    status: 'waiting', // waiting | auction | finished
    soldPlayers: [],
    unsoldPlayers: [],
  });
}

function joinRoom(roomId, teamId) {
  const room = ROOMS.get(roomId);
  if (!room) return { error: 'Room not found' };
  
  // If team already exists, allow re-joining (for persistence/refresh)
  if (room.teams[teamId]) return { success: true };

  if (Object.keys(room.teams).length >= 10) return { error: 'Room is full (max 10 teams)' };
  room.teams[teamId] = createTeamState(teamId);
  return { success: true };
}

function startAuction(roomId, players, io) {
  const room = ROOMS.get(roomId);
  if (!room) return;

  const wks = new Set([
     "Virat Kohli", "MS Dhoni", "KL Rahul", "Rishabh Pant", "Sanju Samson", "Ishan Kishan", 
     "Jos Buttler", "Quinton de Kock", "Nicholas Pooran", "Heinrich Klaasen", "Phil Salt", 
     "Jitesh Sharma", "Dhruv Jurel", "Dinesh Karthik", "Wriddhiman Saha", "Abhishek Porel",
     "Kumar Kushagra", "Shai Hope", "Tristan Stubbs", "Rahmanullah Gurbaz"
  ]);

  const isIndian = (p) => p.nationality === 'India';

  // Sort and Categorize into 350 Players
  let all = [...players].map(p => {
     if (wks.has(p.name)) p.role = 'Wicket Keeper';
     return p;
  });

  const starInd = all.filter(p => isIndian(p) && p.tier === 'Marquee').slice(0, 20).map(p => ({ ...p, setNum: 1, setName: 'STAR PLAYERS INDIA' }));
  const starIndIds = new Set(starInd.map(p => p.id));

  const starInt = all.filter(p => !isIndian(p) && p.tier === 'Marquee' && !starIndIds.has(p.id)).slice(0, 20).map(p => ({ ...p, setNum: 2, setName: 'STAR PLAYERS INTERNATIONAL' }));
  const starIntIds = new Set(starInt.map(p => p.id));

  const cappedInd = all.filter(p => isIndian(p) && !starIndIds.has(p.id)).slice(0, 130).map(p => ({ ...p, setNum: 3, setName: 'CAPPED INDIAN PLAYERS' }));
  const cappedIndIds = new Set(cappedInd.map(p => p.id));
  
  const cappedInt = all.filter(p => !isIndian(p) && !starIntIds.has(p.id)).slice(0, 100).map(p => ({ ...p, setNum: 4, setName: 'CAPPED INTERNATIONAL PLAYERS' }));
  const cappedIntIds = new Set(cappedInt.map(p => p.id));

  const uncappedInd = all.filter(p => isIndian(p) && !starIndIds.has(p.id) && !cappedIndIds.has(p.id)).slice(0, 40).map(p => ({ ...p, setNum: 5, setName: 'UNCAPPED INDIAN PLAYERS' }));
  const uncappedIndIds = new Set(uncappedInd.map(p => p.id));

  const uncappedInt = all.filter(p => !isIndian(p) && !starIntIds.has(p.id) && !cappedIntIds.has(p.id)).slice(0, 40).map(p => ({ ...p, setNum: 6, setName: 'UNCAPPED INTERNATIONAL PLAYERS' }));

  // Final List: 350 Players
  room.playerQueue = [
    ...starInd.sort(() => Math.random() - 0.5),
    ...starInt.sort(() => Math.random() - 0.5),
    ...cappedInd.sort(() => Math.random() - 0.5),
    ...cappedInt.sort(() => Math.random() - 0.5),
    ...uncappedInd.sort(() => Math.random() - 0.5),
    ...uncappedInt.sort(() => Math.random() - 0.5)
  ];

  room.currentIndex = 0;
  room.status = 'auction';
  advanceToNext(roomId, io);
}

function advanceToNext(roomId, io) {
  const room = ROOMS.get(roomId);
  if (!room) return;

  if (room.currentIndex >= room.playerQueue.length) {
    room.status = 'finished';
    io.to(roomId).emit('auctionFinished', buildSummary(room));
    return;
  }

  clearTimer(room);
  room.currentPlayer = room.playerQueue[room.currentIndex];
  room.currentBid = null;
  room.timeLeft = TIMER_SECONDS;

  io.to(roomId).emit('newPlayer', {
    player: room.currentPlayer,
    timeLeft: room.timeLeft,
    playerIndex: room.currentIndex,
    totalPlayers: room.playerQueue.length,
  });

  startTimer(roomId, io);
}

function startTimer(roomId, io) {
  const room = ROOMS.get(roomId);
  if (!room) return;
  clearTimer(room);

  room.timer = setInterval(() => {
    room.timeLeft -= 1;
    io.to(roomId).emit('timerTick', { timeLeft: room.timeLeft });

    if (room.timeLeft <= 0) {
      clearTimer(room);
      resolvePlayer(roomId, io);
    }
  }, 1000);
}

function clearTimer(room) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
}

function placeBid(roomId, teamId, io) {
  const room = ROOMS.get(roomId);
  if (!room || room.status !== 'auction') return { error: 'Auction not active' };

  const team = room.teams[teamId];
  if (!team) return { error: 'Team not found' };

  const player = room.currentPlayer;
  if (!player) return { error: 'No current player' };

  // Calculate next bid
  const basePrice = player.base_price;
  const lastBid = room.currentBid ? room.currentBid.amount : basePrice - BID_INCREMENT;
  const nextBid = parseFloat((lastBid + BID_INCREMENT).toFixed(2));

  // Cannot bid against yourself
  if (room.currentBid && room.currentBid.teamId === teamId) return { error: 'You already hold the highest bid' };

  // Validate budget
  if (team.purse < nextBid) return { error: 'Insufficient budget' };

  // Validate squad size
  if (team.squad.length >= MAX_SQUAD) return { error: 'Squad is full (max 15)' };

  // Validate role quota
  const role = player.role;
  if (team.roleCounts[role] >= ROLE_QUOTAS[role]) return { error: `Role quota for ${role} reached` };

  room.currentBid = { teamId, amount: nextBid };
  room.timeLeft = TIMER_SECONDS;

  io.to(roomId).emit('bidUpdate', {
    teamId,
    amount: nextBid,
    timeLeft: TIMER_SECONDS,
  });

  // Restart timer
  startTimer(roomId, io);
  return { success: true, amount: nextBid };
}

function useRTM(roomId, teamId, io) {
  const room = ROOMS.get(roomId);
  if (!room || !room.currentBid) return { error: 'No active bid to match' };

  const player = room.currentPlayer;
  if (!player || player.ipl_team !== teamId) return { error: 'RTM only for original team' };

  const team = room.teams[teamId];
  if (!team) return { error: 'Team not found' };
  if (team.rtmUsed) return { error: 'RTM already used' };
  if (team.purse < room.currentBid.amount) return { error: 'Insufficient budget for RTM' };

  team.rtmUsed = true;
  room.currentBid = { teamId, amount: room.currentBid.amount };
  clearTimer(room);

  io.to(roomId).emit('rtmUsed', { teamId, amount: room.currentBid.amount });
  resolvePlayer(roomId, io);
  return { success: true };
}

function resolvePlayer(roomId, io) {
  const room = ROOMS.get(roomId);
  if (!room) return;
  clearTimer(room);

  const player = room.currentPlayer;
  if (!player) return;

  if (room.currentBid) {
    const { teamId, amount } = room.currentBid;
    const team = room.teams[teamId];
    team.purse = parseFloat((team.purse - amount).toFixed(2));
    team.squad.push({ ...player, soldPrice: amount });
    team.roleCounts[player.role] = (team.roleCounts[player.role] || 0) + 1;
    room.soldPlayers.push({ player, teamId, amount });

    io.to(roomId).emit('playerResult', {
      result: 'SOLD',
      player,
      teamId,
      amount,
      teams: sanitizeTeams(room.teams),
    });
  } else {
    room.unsoldPlayers.push(player);
    io.to(roomId).emit('playerResult', {
      result: 'UNSOLD',
      player,
      teams: sanitizeTeams(room.teams),
    });
  }

  room.currentIndex += 1;
  setTimeout(() => advanceToNext(roomId, io), 3500);
}

function sanitizeTeams(teams) {
  const out = {};
  for (const [id, t] of Object.entries(teams)) {
    out[id] = { teamId: t.teamId, purse: t.purse, squadCount: t.squad.length, roleCounts: t.roleCounts, rtmUsed: t.rtmUsed };
  }
  return out;
}

function buildSummary(room) {
  const out = {};
  for (const [id, t] of Object.entries(room.teams)) {
    out[id] = { 
      teamId: t.teamId, 
      purse: t.purse, 
      squad: t.squad, 
      roleCounts: t.roleCounts,
      isEarlyStop: room.status === 'finished' && room.currentIndex < room.playerQueue.length
    };
  }
  return { teams: out, soldPlayers: room.soldPlayers, unsoldPlayers: room.unsoldPlayers, isEarlyStop: true };
}

function stopAuction(roomId, io) {
  const room = ROOMS.get(roomId);
  if (!room) return;
  
  clearTimer(room);
  room.status = 'finished';
  io.to(roomId).emit('auctionFinished', buildSummary(room));
}

function getSquad(roomId, teamId) {
  const room = ROOMS.get(roomId);
  if (!room) return null;
  return room.teams[teamId] || null;
}

function getRoomInfo(roomId) {
  const room = ROOMS.get(roomId);
  if (!room) return null;
  return {
    status: room.status,
    teamIds: Object.keys(room.teams),
    playerIndex: room.currentIndex,
    totalPlayers: room.playerQueue.length,
    adminTeamId: room.adminTeamId, // Return admin info
    teams: sanitizeTeams(room.teams),
  };
}

module.exports = {
  createRoom,
  joinRoom,
  startAuction,
  placeBid,
  useRTM,
  getSquad,
  getSquad,
  getRoomInfo,
  stopAuction,
  ROOMS,
};
