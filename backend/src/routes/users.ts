import { Router } from 'express';
import { prisma } from '../server';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get Leaderboard (Top 50)
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { rating: 'desc' },
      take: 50,
      select: { id: true, username: true, rating: true, wins: true, losses: true }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get User's Match History
router.get('/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id;
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }]
      },
      include: {
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
        problem: { select: { title: true, level: true, language: true } },
        winner: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Transform match history for frontend friendly consumption
    const history = matches.map((m: any) => {
      const isPlayer1 = m.player1Id === userId;
      const opponent = isPlayer1 ? m.player2 : m.player1;
      const isWinner = m.winnerId === userId;
      const isDraw = m.status === 'DRAW';
      
      return {
        id: m.id,
        opponent,
        problem: m.problem,
        result: isDraw ? 'DRAW' : (isWinner ? 'WIN' : 'LOSS'),
        status: m.status,
        date: m.createdAt
      };
    });
    
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get available programming languages for practice
router.get('/practice/languages', authenticateToken, async (req, res) => {
  console.log('Practice languages endpoint called');
  try {
    const languages = ['javascript', 'python', 'typescript'];
    console.log('Returning languages:', languages);
    res.json(languages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// Get practice levels for a specific language
router.get('/practice/:language/levels', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { language } = req.params;
    const validLanguages = ['javascript', 'python', 'typescript'];
    
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid language' });
    }

    // Get completed levels for this user and language
    const userId = req.user.id;
    // For now, return all levels 1-100, but mark completed ones
    // In a real app, you'd track user progress
    const levels = [];
    for (let i = 1; i <= 100; i++) {
      levels.push({
        level: i,
        completed: false, // TODO: implement progress tracking
        difficulty: i <= 20 ? 'Beginner' : i <= 50 ? 'Intermediate' : i <= 80 ? 'Advanced' : 'Expert'
      });
    }
    
    res.json(levels);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
});

// Get practice problem for a specific language and level
router.get('/practice/:language/:level', authenticateToken, async (req: AuthRequest, res) => {
  console.log('Practice problem endpoint called:', req.params);
  console.log('User:', req.user);
  try {
    const { language, level } = req.params;
    const levelNum = parseInt(level);
    
    const validLanguages = ['javascript', 'python', 'typescript'];
    if (!validLanguages.includes(language) || levelNum < 1 || levelNum > 100) {
      return res.status(400).json({ error: 'Invalid language or level' });
    }

    // Try to find existing problem
    let problem = await prisma.problem.findFirst({
      where: { language, level: levelNum }
    });

    // If no problem exists, create a default one
    if (!problem) {
      const getProblemForLevel = (lang: string, level: number) => {
        const baseProblems = {
          javascript: {
            // Beginner (1-5)
            1: { title: "Hello World", description: "Write a function that returns 'Hello, World!'", constraints: "Function must be named helloWorld", testCases: JSON.stringify([{ input: "", expectedOutput: "Hello, World!" }]) },
            2: { title: "Sum of Two Numbers", description: "Write a function that takes two numbers and returns their sum.", constraints: "Function must be named sum", testCases: JSON.stringify([{ input: "2\n3", expectedOutput: "5" }]) },
            3: { title: "Check Even or Odd", description: "Write a function that checks if a number is even or odd.", constraints: "Function must be named isEven", testCases: JSON.stringify([{ input: "4", expectedOutput: "true" }]) },
            4: { title: "Factorial", description: "Write a function that calculates the factorial of a number.", constraints: "Function must be named factorial", testCases: JSON.stringify([{ input: "5", expectedOutput: "120" }]) },
            5: { title: "Reverse String", description: "Write a function that reverses a string.", constraints: "Function must be named reverseString", testCases: JSON.stringify([{ input: "hello", expectedOutput: "olleh" }]) },
            
            // Easy (6-10)
            6: { title: "Find Maximum", description: "Write a function that finds the maximum number in an array.", constraints: "Function must be named findMax", testCases: JSON.stringify([{ input: "[1,3,2,5,4]", expectedOutput: "5" }]) },
            7: { title: "Count Vowels", description: "Write a function that counts vowels in a string.", constraints: "Function must be named countVowels", testCases: JSON.stringify([{ input: "hello", expectedOutput: "2" }]) },
            8: { title: "Prime Check", description: "Write a function that checks if a number is prime.", constraints: "Function must be named isPrime", testCases: JSON.stringify([{ input: "7", expectedOutput: "true" }]) },
            9: { title: "Array Sum", description: "Write a function that calculates the sum of all elements in an array.", constraints: "Function must be named arraySum", testCases: JSON.stringify([{ input: "[1,2,3,4,5]", expectedOutput: "15" }]) },
            10: { title: "Palindrome Check", description: "Write a function that checks if a string is a palindrome.", constraints: "Function must be named isPalindrome", testCases: JSON.stringify([{ input: "racecar", expectedOutput: "true" }]) },
            
            // Medium (11-15)
            11: { title: "Binary Search", description: "Implement binary search on a sorted array.", constraints: "Function must be named binarySearch", testCases: JSON.stringify([{ input: "[1,2,3,4,5]\n3", expectedOutput: "2" }]) },
            12: { title: "Merge Arrays", description: "Write a function that merges two sorted arrays.", constraints: "Function must be named mergeArrays", testCases: JSON.stringify([{ input: "[1,3,5]\n[2,4,6]", expectedOutput: "[1,2,3,4,5,6]" }]) },
            13: { title: "Valid Parentheses", description: "Check if parentheses are valid in a string.", constraints: "Function must be named isValidParentheses", testCases: JSON.stringify([{ input: "(){}[]", expectedOutput: "true" }]) },
            14: { title: "Two Sum", description: "Find indices of two numbers that add up to target.", constraints: "Function must be named twoSum", testCases: JSON.stringify([{ input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" }]) },
            15: { title: "Longest Substring", description: "Find length of longest substring without repeating characters.", constraints: "Function must be named lengthOfLongestSubstring", testCases: JSON.stringify([{ input: "abcabcbb", expectedOutput: "3" }]) }
          },
          python: {
            // Beginner (1-5)
            1: { title: "Hello World", description: "Write a function that returns 'Hello, World!'", constraints: "Function must be named hello_world", testCases: JSON.stringify([{ input: "", expectedOutput: "Hello, World!" }]) },
            2: { title: "Sum of Two Numbers", description: "Write a function that takes two numbers and returns their sum.", constraints: "Function must be named sum_two", testCases: JSON.stringify([{ input: "2\n3", expectedOutput: "5" }]) },
            3: { title: "Check Even or Odd", description: "Write a function that checks if a number is even or odd.", constraints: "Function must be named is_even", testCases: JSON.stringify([{ input: "4", expectedOutput: "True" }]) },
            4: { title: "Factorial", description: "Write a function that calculates the factorial of a number.", constraints: "Function must be named factorial", testCases: JSON.stringify([{ input: "5", expectedOutput: "120" }]) },
            5: { title: "Reverse String", description: "Write a function that reverses a string.", constraints: "Function must be named reverse_string", testCases: JSON.stringify([{ input: "hello", expectedOutput: "olleh" }]) },
            
            // Easy (6-10)
            6: { title: "Find Maximum", description: "Write a function that finds the maximum number in a list.", constraints: "Function must be named find_max", testCases: JSON.stringify([{ input: "[1,3,2,5,4]", expectedOutput: "5" }]) },
            7: { title: "Count Vowels", description: "Write a function that counts vowels in a string.", constraints: "Function must be named count_vowels", testCases: JSON.stringify([{ input: "hello", expectedOutput: "2" }]) },
            8: { title: "Prime Check", description: "Write a function that checks if a number is prime.", constraints: "Function must be named is_prime", testCases: JSON.stringify([{ input: "7", expectedOutput: "True" }]) },
            9: { title: "List Sum", description: "Write a function that calculates the sum of all elements in a list.", constraints: "Function must be named list_sum", testCases: JSON.stringify([{ input: "[1,2,3,4,5]", expectedOutput: "15" }]) },
            10: { title: "Palindrome Check", description: "Write a function that checks if a string is a palindrome.", constraints: "Function must be named is_palindrome", testCases: JSON.stringify([{ input: "racecar", expectedOutput: "True" }]) },
            
            // Medium (11-15)
            11: { title: "Binary Search", description: "Implement binary search on a sorted list.", constraints: "Function must be named binary_search", testCases: JSON.stringify([{ input: "[1,2,3,4,5]\n3", expectedOutput: "2" }]) },
            12: { title: "Merge Lists", description: "Write a function that merges two sorted lists.", constraints: "Function must be named merge_lists", testCases: JSON.stringify([{ input: "[1,3,5]\n[2,4,6]", expectedOutput: "[1,2,3,4,5,6]" }]) },
            13: { title: "Valid Parentheses", description: "Check if parentheses are valid in a string.", constraints: "Function must be named is_valid_parentheses", testCases: JSON.stringify([{ input: "(){}[]", expectedOutput: "True" }]) },
            14: { title: "Two Sum", description: "Find indices of two numbers that add up to target.", constraints: "Function must be named two_sum", testCases: JSON.stringify([{ input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" }]) },
            15: { title: "Longest Substring", description: "Find length of longest substring without repeating characters.", constraints: "Function must be named length_of_longest_substring", testCases: JSON.stringify([{ input: "abcabcbb", expectedOutput: "3" }]) }
          },
          typescript: {
            // Beginner (1-5)
            1: { title: "Hello World", description: "Write a function that returns 'Hello, World!'", constraints: "Function must be named helloWorld with proper typing", testCases: JSON.stringify([{ input: "", expectedOutput: "Hello, World!" }]) },
            2: { title: "Sum of Two Numbers", description: "Write a function that takes two numbers and returns their sum.", constraints: "Function must be named sum with proper TypeScript types", testCases: JSON.stringify([{ input: "2\n3", expectedOutput: "5" }]) },
            3: { title: "Check Even or Odd", description: "Write a function that checks if a number is even or odd.", constraints: "Function must be named isEven with proper typing", testCases: JSON.stringify([{ input: "4", expectedOutput: "true" }]) },
            4: { title: "Factorial", description: "Write a function that calculates the factorial of a number.", constraints: "Function must be named factorial with proper typing", testCases: JSON.stringify([{ input: "5", expectedOutput: "120" }]) },
            5: { title: "Reverse String", description: "Write a function that reverses a string.", constraints: "Function must be named reverseString with proper typing", testCases: JSON.stringify([{ input: "hello", expectedOutput: "olleh" }]) },
            
            // Easy (6-10)
            6: { title: "Find Maximum", description: "Write a function that finds the maximum number in an array.", constraints: "Function must be named findMax with proper typing", testCases: JSON.stringify([{ input: "[1,3,2,5,4]", expectedOutput: "5" }]) },
            7: { title: "Count Vowels", description: "Write a function that counts vowels in a string.", constraints: "Function must be named countVowels with proper typing", testCases: JSON.stringify([{ input: "hello", expectedOutput: "2" }]) },
            8: { title: "Prime Check", description: "Write a function that checks if a number is prime.", constraints: "Function must be named isPrime with proper typing", testCases: JSON.stringify([{ input: "7", expectedOutput: "true" }]) },
            9: { title: "Array Sum", description: "Write a function that calculates the sum of all elements in an array.", constraints: "Function must be named arraySum with proper typing", testCases: JSON.stringify([{ input: "[1,2,3,4,5]", expectedOutput: "15" }]) },
            10: { title: "Palindrome Check", description: "Write a function that checks if a string is a palindrome.", constraints: "Function must be named isPalindrome with proper typing", testCases: JSON.stringify([{ input: "racecar", expectedOutput: "true" }]) },
            
            // Medium (11-15)
            11: { title: "Binary Search", description: "Implement binary search on a sorted array.", constraints: "Function must be named binarySearch with proper typing", testCases: JSON.stringify([{ input: "[1,2,3,4,5]\n3", expectedOutput: "2" }]) },
            12: { title: "Merge Arrays", description: "Write a function that merges two sorted arrays.", constraints: "Function must be named mergeArrays with proper typing", testCases: JSON.stringify([{ input: "[1,3,5]\n[2,4,6]", expectedOutput: "[1,2,3,4,5,6]" }]) },
            13: { title: "Valid Parentheses", description: "Check if parentheses are valid in a string.", constraints: "Function must be named isValidParentheses with proper typing", testCases: JSON.stringify([{ input: "(){}[]", expectedOutput: "true" }]) },
            14: { title: "Two Sum", description: "Find indices of two numbers that add up to target.", constraints: "Function must be named twoSum with proper typing", testCases: JSON.stringify([{ input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" }]) },
            15: { title: "Longest Substring", description: "Find length of longest substring without repeating characters.", constraints: "Function must be named lengthOfLongestSubstring with proper typing", testCases: JSON.stringify([{ input: "abcabcbb", expectedOutput: "3" }]) }
          }
        };

        const langProblems = baseProblems[lang as keyof typeof baseProblems];
        return langProblems ? langProblems[level as keyof typeof langProblems] : {
          title: `Level ${level} Challenge`,
          description: `Solve this ${lang} programming challenge at level ${level}. ${level <= 20 ? 'Focus on basic syntax and logic.' : level <= 50 ? 'Apply intermediate concepts.' : level <= 80 ? 'Use advanced techniques.' : 'Master-level problem solving.'}`,
          constraints: `Implement the solution in ${lang} following best practices`,
          testCases: JSON.stringify([{ input: "test", expectedOutput: "output" }])
        };
      };

      const defaultProblem = getProblemForLevel(language, levelNum);

      problem = await prisma.problem.create({
        data: {
          title: defaultProblem.title,
          description: defaultProblem.description,
          language,
          level: levelNum,
          constraints: defaultProblem.constraints,
          testCases: defaultProblem.testCases
        }
      });
    }

    res.json({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      language: problem.language,
      level: problem.level,
      constraints: problem.constraints,
      testCases: JSON.parse(problem.testCases)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

export default router;
