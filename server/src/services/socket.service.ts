import { getIO } from '../lib/socket';

const users = new Map<string, string[]>();

export const addSocket = (userId: string, socketId: string) => {
  const sockets = users.get(userId) || [];
  sockets.push(socketId);
  users.set(userId, sockets);
};

export const removeSocket = (userId: string, socketId: string) => {
  const sockets = users.get(userId) || [];
  const filtered = sockets.filter((id) => id !== socketId);
  if (filtered.length === 0) {
    users.delete(userId);
  } else {
    users.set(userId, filtered);
  }
};

export const emitToUser = (userId: string, event: string, data: any) => {
  const sockets = users.get(userId);
  if (sockets) {
    const io = getIO();
    for (const socketId of sockets) {
      io.to(socketId).emit(event, data);
    }
  }
};

export const emitToUsers = (userIds: string[], event: string, data: any) => {
  userIds.forEach((userId) => emitToUser(userId, event, data));
};
