import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../server';
import { executeCode } from '../services/execution';

const router = Router();

router.post('/submit', authenticateToken, async (req: any, res) => {
  const { matchId, code, language, testCases } = req.body;
  const userId = req.user.id;

  try {
    let finalTestCases = testCases;

    // If matchId is provided, it's a competitive match
    if (matchId) {
      const match = await prisma.match.findUnique({
        where: { id: parseInt(matchId) },
        include: { problem: true }
      });

      if (!match || match.status !== 'IN_PROGRESS') {
        return res.status(400).json({ error: 'Invalid or completed match' });
      }

      finalTestCases = JSON.parse(match.problem.testCases || '[]');
      
      // Execute Code
      const executionResult = await executeCode(code, language, finalTestCases);

      if (executionResult.allPassed) {
        // If passed, user wins the match!
        const updatedMatch = await prisma.match.update({
          where: { id: match.id },
          data: { winnerId: userId, status: 'COMPLETED' }
        });
        
        // Update ELO Ratings
        const isPlayer1 = match.player1Id === userId;
        const winnerId = userId;
        const loserId = isPlayer1 ? match.player2Id : match.player1Id;
        
        await prisma.user.update({ where: { id: winnerId }, data: { rating: { increment: 25 }, wins: { increment: 1 } } });
        await prisma.user.update({ where: { id: loserId }, data: { rating: { decrement: 25 }, losses: { increment: 1 } } });

        return res.json({ success: true, allPassed: true, results: executionResult.results, matchResolved: true });
      } else {
        // Not all passed, just return results
        return res.json({ success: true, allPassed: false, results: executionResult.results, matchResolved: false });
      }
    } else {
      // Practice mode - testCases provided directly
      if (!finalTestCases) {
        return res.status(400).json({ error: 'Test cases required for practice mode' });
      }

      const executionResult = await executeCode(code, language, finalTestCases);
      return res.json({ success: true, allPassed: executionResult.allPassed, results: executionResult.results });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to execute code' });
  }
});

export default router;
