const http = require('http');
const fs = require('fs');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// const options = {
//   key: fs.readFileSync('./src/ssl/private.key'),
//   cert: fs.readFileSync('./src/ssl/certificate.crt'),
//   ca: fs.readFileSync('./src/ssl/ca_bundle.crt'),
// };

const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  const handler = new MessageHandler(socket, true);

  console.log('New connection:', socket.handshake.headers.authorization);
  if (!socket.handshake.headers.authorization) {
    handler.error('Missing authorization header');
    return;
  }

  socket.userId = socket.handshake.headers.authorization;
  socket.join(`user_${socket.userId}`);
  socket.join('global_notifications')

  socket.on('joinRoom', (roomId) => {
    handler.setRoomId(roomId);
    handler.join(roomId);
  });

  socket.on('leaveRoom', (roomId) => {
    handler.leave(roomId);
  });

  socket.on('typing', (roomId) => {
    handler.setTyping(true);
  });

  socket.on('stopTyping', (roomId) => {
    handler.setTyping(false);

  });

  socket.on('deleteMessage', async (messageId) => {
    try {
      const message = await prisma.message.findUnique({
        where: {
          id: messageId,
        },
        select: {
          sender: true,
          chat: true,
        },
      });

      if (!message) {
        handler.error('The message you are trying to delete does not exist');
        return;
      }

      if (message.sender.id !== socket.userId) {
        handler.error('You are not allowed to delete this message');
        return;
      }

      await prisma.message.delete({
        where: {
          id: messageId,
        },
      });

      handler.broadcastToRoom(message.chat.id, 'removeMessage', messageId);
      handler.deleteMessage(messageId);
    } catch (error) {
      handler.error('Error deleting message');
    }
  });

  socket.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const { chatId } = data;

      if (!chatId) {
        handler.error('Missing chatId');
        return;
      }

      if (!socket.rooms.has(chatId)) {
        handler.error('You are not allowed to send messages to this room');
        return;
      }

      if (!socket.userId || socket.userId === 'undefined') {
        handler.error('Missing userId');
        return;
      }

      handler.resetIdleTimer();

      try {
        const message = await prisma.message.create({
          data: {
            content: data.content,
            chat: {
              connect: {
                id: chatId
              }
            },
            sender: {
              connect: {
                id: socket.userId
              }
            }
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true
              }
            }
          }
        });

        handler.broadcastToRoom(chatId, 'message', JSON.stringify(message));
        handler.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error creating message:', error);
        handler.error('Error creating message');
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      handler.error('Error parsing message');
    }
  });

  socket.on('newMatch', (unparsedMatchData) => {
    try {
      const matchData = JSON.parse(unparsedMatchData);
      const { data, user } = matchData;

      if (!data) {
        handler.error('An error occurred while parsing the match data');
        return;
      }

      if (!user) {
        handler.error('An error occurred while parsing the match data');
        return;
      }

      console.log('New match:', data);
      handler.broadcastToRoom(`user_${data.match.targetId}`, 'newMatch', JSON.stringify({ chatId: data.chat.id, user }));
    } catch (error) {
      console.error('Error parsing match data:', error);
      handler.error('Error parsing match data');
    }
  })

  socket.on('disconnect', () => {
    handler.disconnectClient();
  })
});

server.listen(8080, () => {
  console.log(`WebSocket server is running on port ${server.address().port}`);
});

const MAX_IDLE_TIME = 300000;

class MessageHandler {
  constructor(socket, devMode = false) {
    this.socket = socket;
    this.devMode = devMode;
    this.roomId = null;
    this.status = 'online';
    this.isTyping = false;
    this.startIdleTimer();
  }

  setRoomId(roomId) {
    this.roomId = roomId;
  }

  startIdleTimer() {
    this.idleTimer = setTimeout(() => {
      this.updateStatus('idle');
    }, MAX_IDLE_TIME);
  }

  setTyping(isTyping) {
    if (!this.socket.userId || !this.roomId) return;
    if (this.isTyping !== isTyping) {
      this.isTyping = isTyping;
      if (this.status === 'idle') this.updateStatus('online');
      if (isTyping) {
        this.broadcastToRoom(this.roomId, 'typing', this.socket.userId);
      } else {
        this.broadcastToRoom(this.roomId, 'stopTyping', this.socket.userId);
        this.startIdleTimer();
      }
    }
  }

  updateStatus(status) {
    if (!this.socket.userId) return;
    if (!this.socket.rooms.has(this.roomId)) return;

    if (this.status !== status) {
      this.status = status;
      this.broadcastToRoom(this.roomId, 'updateStatus', JSON.stringify({ id: this.socket.userId, status }));
      this.broadcastToSelf('updateStatus', JSON.stringify({ id: this.socket.userId, status }));
      if (this.devMode) console.log({ success: true, type: 'updateStatus', userId: this.socket.userId, status });
    }
  }

  resetIdleTimer() {
    if (!this.socket.userId || !this.roomId) return;
    clearTimeout(this.idleTimer);
    if (this.status !== 'online') {
      this.updateStatus('online');
    }
    this.startIdleTimer();
  }

  disconnectClient() {
    if (!this.socket.userId || !this.roomId) return;
    this.broadcastToRoom(this.roomId, 'removePresence', this.socket.userId);
    if (this.devMode) console.log({ success: true, type: 'disconnect', userId: this.socket.userId });
    this.socket.disconnect();
  }

  join(roomId) {
    this.setRoomId(roomId);
    this.socket.join(roomId);
    this.broadcastToRoom(roomId, 'newPresence', JSON.stringify({ id: this.socket.userId, status: 'online' }));
    this.broadcastToSelf('existingPresences', JSON.stringify(this.getUsersInRoom(roomId).map((userId) => ({ id: userId, status: 'online'  }))));
    this.startIdleTimer();
    if (this.devMode) console.log({ success: true, roomId, type: 'join', userId: this.socket.userId });
  }

  leave(roomId) {
    this.socket.leave(roomId);
    this.broadcastToRoom(roomId, 'removePresence', this.socket.userId);
    if (this.devMode) console.log({ success: true, roomId, type: 'leave', userId: this.socket.userId });
  }

  send(message) {
    this.socket.emit('message', message);
    this.startIdleTimer();
    if (this.devMode) console.log({ success: true, message });
  }

  broadcast(message) {
    this.socket.broadcast.emit('message', message);
    if (this.devMode) console.log({ success: true, message });
  }

  broadcastToRoom(roomId, type, message) {
    this.socket.broadcast.to(roomId).emit(type, message);
    if (this.devMode) console.log({ success: true, chat: roomId, type, message });
  }

  broadcastToSelf(type, message) {
    this.socket.emit(type, message);
    if (this.devMode) console.log({ success: true, type, message });
  }

  broadcastToUser(userId, type, message) {
    this.socket.broadcast.to(userId).emit(type, message);
    if (this.devMode) console.log({ success: true, user: userId, type, message });
  }

  error(message) {
    this.socket.emit('error', message);
    if (this.devMode) console.log({ success: true, message });
  }

  deleteMessage(messageId) {
    this.socket.emit('removeMessage', messageId);
    if (this.devMode) console.log({ success: true, messageId });
  }

  getUsersInRoom(roomId) {
    const socketIds = Array.from(this.socket.adapter.rooms.get(roomId));
    
    const uniqueUserIds = new Set();

    const users = socketIds.map((socketId) => {
      const socket = this.socket.adapter.nsp.sockets.get(socketId);
      const userId = socket.userId;
      if (!uniqueUserIds.has(userId)) {
        uniqueUserIds.add(userId);
        return userId;
      }
      return null;
    }).filter(userId => userId !== null);

    return users;
  }
}