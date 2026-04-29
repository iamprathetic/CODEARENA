import { Server, Socket } from 'socket.io';
import { prisma } from '../server';

interface QueueUser {
  socket: Socket;
  userId: number;
  rating: number;
}

export class SocketManager {
  private queue: QueueUser[] = [];
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  handleConnection(socket: Socket) {
    console.log(`Socket connected: ${socket.id}`);

    // Join Matchmaking Queue
    socket.on('joinQueue', async (data: { userId: number }) => {
      try {
        const user = await prisma.user.findUnique({ where: { id: data.userId } });
        if (!user) return;

        // Ensure user is not already in queue
        if (this.queue.find(q => q.userId === data.userId)) return;

        this.queue.push({ socket, userId: user.id, rating: user.rating });
        console.log(`User ${user.username} joined queue. Queue length: ${this.queue.length}`);

        this.tryMatchmaking();
      } catch (err) {
        console.error(err);
      }
    });
    
    // Setup Arena Room Connection
    socket.on('joinMatch', (data: { matchId: number, userId: number }) => {
       const room = `match_${data.matchId}`;
       socket.join(room);
       console.log(`User ${data.userId} joined match room ${room}`);
       
       // notify opponent
       socket.to(room).emit('opponentJoined', { userId: data.userId });
    });
    
    // Handle real-time code keystrokes (optional sync)
    socket.on('codeUpdate', (data: { matchId: number, code: string }) => {
       socket.to(`match_${data.matchId}`).emit('opponentCodeUpdate', { length: data.code.length });
    });

    socket.on('disconnect', () => {
      this.queue = this.queue.filter(q => q.socket.id !== socket.id);
    });
  }

  private async tryMatchmaking() {
    if (this.queue.length < 2) return;

    // MVP: Match the first two available players regardless of exact ELO distance
    const p1 = this.queue.shift()!;
    let p2Index = 0; // In MVP, just take next. For ELO, we'd search `this.queue` for closest rating.
    const p2 = this.queue.splice(p2Index, 1)[0]!;

    try {
      // Find a random problem
      const probCount = await prisma.problem.count();
      let randomProblem;
      if (probCount > 0) {
        const skip = Math.floor(Math.random() * probCount);
        randomProblem = await prisma.problem.findFirst({ skip });
      } else {
        // Fallback default problem if none exist in DB
        randomProblem = await prisma.problem.create({
          data: {
            title: "Two Sum",
            description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
            language: "javascript",
            level: 1,
            constraints: "2 <= nums.length <= 10^4",
            testCases: JSON.stringify([{ input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" }])
          }
        });
      }

      // Create Match in DB
      const match = await prisma.match.create({
        data: {
          player1Id: p1.userId,
          player2Id: p2.userId,
          problemId: randomProblem!.id,
          status: 'IN_PROGRESS'
        }
      });

      // Emit to both players
      const matchData = { matchId: match.id, problem: randomProblem };
      p1.socket.emit('matchFound', matchData);
      p2.socket.emit('matchFound', matchData);

      console.log(`Match created: ${match.id} between ${p1.userId} and ${p2.userId}`);
    } catch (err) {
      console.error('Error in tryMatchmaking:', err);
    }
  }
}
