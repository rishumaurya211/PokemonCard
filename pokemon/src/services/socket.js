import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  return socket;
};

// Battle room functions
export const joinBattleRoom = (roomId, userId) => {
  if (socket) {
    socket.emit('join-battle-room', { roomId, userId });
  }
};

export const leaveBattleRoom = (roomId) => {
  if (socket) {
    socket.leave(roomId);
  }
};

export const sendBattleAction = (roomId, action, data) => {
  if (socket) {
    socket.emit('battle-action', { roomId, action, data });
  }
};

// Socket event listeners
export const onBattleReady = (callback) => {
  if (socket) {
    socket.on('battle-ready', callback);
  }
};

export const onRoomUpdate = (callback) => {
  if (socket) {
    socket.on('room-update', callback);
  }
};

export const onBattleAction = (callback) => {
  if (socket) {
    socket.on('battle-action', callback);
  }
};

export const onPlayerLeft = (callback) => {
  if (socket) {
    socket.on('player-left', callback);
  }
};

export const offBattleReady = () => {
  if (socket) {
    socket.off('battle-ready');
  }
};

export const offRoomUpdate = () => {
  if (socket) {
    socket.off('room-update');
  }
};

export const offBattleAction = () => {
  if (socket) {
    socket.off('battle-action');
  }
};

export const offPlayerLeft = () => {
  if (socket) {
    socket.off('player-left');
  }
};
