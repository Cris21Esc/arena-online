import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const rooms = new Map<string, Set<string>>();

app.get('/', (_req, res) => {
  res.send('Arena Online Backend Running');
});

io.on('connection', (socket) => {

  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {

    let room = rooms.get(roomId);

    if (!room) {
      room = new Set();
      rooms.set(roomId, room);
    }

    if (room.size >= 2) {

      socket.emit(
        'room-full',
        roomId
      );

      return;
    }

    room.add(socket.id);

    socket.join(roomId);

    socket.data.roomId = roomId;

    socket.emit(
      'room-joined',
      roomId
    );

    console.log(
      `${socket.id} se unió a sala ${roomId}`
    );

  });

  socket.on('disconnect', () => {

    const roomId = socket.data.roomId;

    if (roomId) {
      
      const room = rooms.get(roomId);

      if (room) {

        room.delete(socket.id);

        console.log(
          `${socket.id} abandonó sala ${roomId}`
        );

        if (room.size === 0) {

          rooms.delete(roomId);

          console.log(
            `Sala ${roomId} eliminada`
          );
        }

      }
      
    }

    console.log(
      'User disconnected:',
      socket.id
    );

  });

});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});