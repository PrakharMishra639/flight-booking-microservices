import { io } from 'socket.io-client';
import { API_URL, LOCAL_STORAGE_KEYS } from './constants';

let socket = null;

// Determine socket URL based on API_URL
// If API_URL is http://localhost:3000/api, we want http://localhost:3000
const getSocketUrl = () => {
    try {
        const url = new URL(API_URL);
        return `${url.protocol}//${url.host}`;
    } catch (e) {
        return 'http://localhost:4000';
    }
};

export const initializeSocket = () => {
  if (socket) return socket;

  socket = io(getSocketUrl(), {
    withCredentials: true,
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Connected to real-time server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from real-time server');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
