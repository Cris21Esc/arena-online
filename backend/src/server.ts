import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

const app = express();

app.use(cors());

app.use(express.static('public'));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

type Player = {
  socketId: string;
  playerName: string;
  ready: boolean;
};

const rooms = new Map<string, Player[]>();

function getRoomsState() {

  return Array.from(rooms.entries()).map(
    ([roomId, users]) => ({
      roomId,
      players: users.length,
      full: users.length >= 2,
      users: users.map(
        user => user.playerName
      )
    })
  );

}

function emitRooms() {

  io.emit(
    'rooms-updated',
    getRoomsState()
  );

}

io.on('connection', (socket) => {

  socket.on('join-room', ({roomId,playerName}) => {

    let room = rooms.get(roomId);

    if (!room) {
      room = [];
      rooms.set(roomId, room);
    }

    if (room.length >= 2) {

      socket.emit(
        'room-full',
        roomId
      );

      return;
    }

    room.push({
      socketId: socket.id,
      playerName,
      ready: false
    });

    socket.join(roomId);

    io.to(roomId).emit(
      'room-state',
      room
    );

    emitRooms();

    socket.data.roomId = roomId;

    socket.data.playerName = playerName;

    socket.emit(
      'room-joined',
      roomId
    );

    console.log(
      `${playerName} se unió a sala ${roomId}`
    );

  });

  socket.on('disconnect', () => {

    const roomId = socket.data.roomId;
    const playerName = socket.data.playerName;

    if (roomId) {
      
      const room = rooms.get(roomId);

      if (room) {

        const index = room.findIndex(
          user => user.socketId === socket.id
        );

        if (index !== -1) {          
          room.splice(index, 1);

          io.to(roomId).emit(
            'room-state',
            room
          );
        }

        emitRooms();

        console.log(
          `${playerName} (${socket.id}) abandonó sala ${roomId}`
        );

        if (room.length === 0) {

          rooms.delete(roomId);

          emitRooms();

          console.log(
            `Sala ${roomId} eliminada`
          );
        }

      }
      
    }

    console.log(
      'Usuario desconectado:',
      playerName
    );

  });

  socket.on('toggle-ready', () => {

      const roomId = socket.data.roomId;

      if (!roomId) return;

      const room = rooms.get(roomId);

      if (!room) return;

      const player = room.find(
        user => user.socketId === socket.id
      );

      if (!player) return;

      player.ready = !player.ready;

      console.log(
        `${player.playerName} ready: ${player.ready}`
      );

      io.to(roomId).emit(
        'room-state',
        room
      );

      if (
        room.length === 2 &&
        room.every(player => player.ready)
      ) {

        io.to(roomId).emit(
          'game-start'
        );

      }

    }
  );

});

const PORT = Number(process.env.PORT) || 3000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});