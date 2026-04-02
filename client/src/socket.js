import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://iplauctionwargame-production.up.railway.app';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket'],
});

export default socket;
