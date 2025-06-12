import { io } from 'socket.io-client';
import { SOCKET_URL } from '@/constants/config';

// Create socket instance
const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Export socket instance
export { socket }; 