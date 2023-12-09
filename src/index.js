const https = require('https');
const http = require('http');
const fs = require('fs');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const options = {
  key: fs.readFileSync('./src/ssl/private.key'),
  cert: fs.readFileSync('./src/ssl/certificate.crt'),
  ca: fs.readFileSync('./src/ssl/ca_bundle.crt'),

};

const server = https.createServer(options);
// const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

const presenceMap = {};

io.on('connection', (socket) => {
  console.log('A client connected to the chat namespace');

  socket.on('setUserId', (userId) => {
    socket.userId = userId;
    console.log(`Client with id ${userId} connected`);
  });

  socket.on('joinRoom', async (chatId) => {
    if (!socket.userId || socket.userId === 'undefined') {
      socket.emit('error', 'Missing userId');
      console.log('Missing userId');
      return;
    }
  
    if (!chatId) {
      socket.emit('error', 'Missing chatId');
      console.log('Missing chatId');
      return;
    }
  
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId
      },
      select: {
        members: true
      }
    });
  
    if (!chat || !chat.members) {
      socket.emit('error', 'Room not found');
      console.log('Room not found');
      return;
    }
  
    if (!chat.members.find((user) => user.id === socket.userId)) {
      socket.emit('error', 'User not found');
      console.log('User not found');
      return;
    }
  
    if (!presenceMap[chatId]) {
      presenceMap[chatId] = [];
    }
    presenceMap[chatId].push(socket.id);
  
    // Emit presence information to the socket user itself
    socket.emit('presenceJoin', JSON.stringify(presenceMap[chatId]));
  
    // Emit presence information to other users in the chat room
    socket.to(chatId).emit('presenceJoin', presenceMap[chatId]);
  
    console.log(`Client joined room: ${chatId}`);
  });
  
  socket.on('leaveRoom', (chatId) => {
    socket.leave(chatId);
  
    if (presenceMap[chatId]) {
      presenceMap[chatId] = presenceMap[chatId].filter(id => id !== socket.id);
      socket.to(chatId).emit('presenceLeave', presenceMap[chatId]);
    }
  
    console.log(`Client left room: ${chatId}`);
  });

  socket.on('deleteMessage', async (messageId) => {
    try {
      const message = await prisma.message.findUnique({
        where: {
          id: messageId,
          senderId: socket.userId
        },
        select: {
          sender: true,
          chat: true
        }
      });

      if (!message) {
        socket.emit('error', 'Message not found');
        console.log('Message not found');
        return;
      }

      if (message.sender.id !== socket.userId) {
        socket.emit('error', 'You are not allowed to delete this message');
        console.log('You are not allowed to delete this message');
        return;
      }

      await prisma.message.delete({
        where: {
          id: messageId
        }
      });

      socket.broadcast.to(message.chat.id).emit('removeMessage', messageId);
      socket.emit('removeMessage', messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', 'Error deleting message');
    }
  });

  socket.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const { chatId } = data;

      if (!chatId) {
        socket.emit('error', 'Missing chatId');
        console.log('Missing chatId');
        return;
      }

      if (!socket.rooms.has(chatId)) {
        socket.emit('error', 'You are not allowed in this room');
        console.log('You are not in this room');
        return;
      }

      if (!socket.userId || socket.userId === 'undefined') {
        socket.emit('error', 'Missing userId');
        console.log('Missing userId');
        return;
      }

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

        socket.broadcast.to(chatId).emit('message', JSON.stringify(message));
        socket.emit('message', JSON.stringify(message));
      } catch (error) {
        console.error('Error creating message:', error);
        socket.emit('error', 'Error creating message');
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected from the chat namespace');
  });
});

server.listen(8080, () => {
  console.log(`WebSocket server is running on port ${server.address().port}`);
});