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

app.get('/', (_req, res) => {
  res.send('Arena Online Backend Running');
});

//Connect
io.on('connection', (socket) => {

  console.log('User connected:', socket.id);

  socket.on('ping-server',(message) => {

    console.log('Mensaje recibido:', message);

    socket.emit(
      'pong-client',
      'Hola cliente'
    );

  });

  socket.on('chat-message', (message) => {

    console.log('Chat:', message);

    io.emit(
      'chat-message',
      message
    );

  });

  //Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});