import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import executionRoutes from './routes/execution';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

import { SocketManager } from './services/socketManager';

export const prisma = new PrismaClient();
const socketManager = new SocketManager(io);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/execution', executionRoutes);

app.get('/', (req, res) => {
  res.send('CodeArena API Server is running...');
});

// Socket.IO event handling
io.on('connection', (socket) => socketManager.handleConnection(socket));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
