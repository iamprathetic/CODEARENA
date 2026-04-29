import axios from 'axios';

const JUDGE0_URL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_KEY = process.env.JUDGE0_KEY || ''; // Leave empty if using public instance without key
const USE_MOCK = process.env.USE_MOCK_EXECUTION === 'true';

const languageIds: Record<string, number> = {
  'javascript': 63,
  'python': 71,
  'typescript': 74
};

export async function executeCode(code: string, language: string, testCases: any[]) {
  // If no credentials or mock mode enabled, simulate execution for final year project demonstration
  if (USE_MOCK || (!JUDGE0_KEY && JUDGE0_URL.includes('rapidapi'))) {
    console.log("Using Mock Execution Engine");
    return simulateExecution(code, testCases);
  }

  const langId = languageIds[language] || 63;
  let allPassed = true;
  let results = [];

  for (const tc of testCases) {
    const payload = {
      source_code: code,
      language_id: langId,
      stdin: tc.input,
      expected_output: tc.expectedOutput
    };

    try {
      const response = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': JUDGE0_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      });

      const result = response.data;
      const passed = result.status.id === 3; // 3 implies "Accepted" on Judge0
      if (!passed) allPassed = false;
      
      results.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: result.stdout || result.stderr || result.compile_output,
        passed,
        time: result.time,
        memory: result.memory
      });
    } catch (err) {
      console.error(err);
      allPassed = false;
      results.push({ error: 'Execution failed', passed: false });
    }
  }

  return { allPassed, results };
}

// Mock Simulator for easy local testing without API keys
function simulateExecution(code: string, testCases: any[]) {
   // A simple mock that passes if the code is not empty and has length > 10
   const isSyntaxValid = code.length > 10;
   const results = testCases.map(tc => {
       const passed = isSyntaxValid && Math.random() > 0.1; // 90% chance to pass if code is valid
       return {
           input: tc.input,
           expectedOutput: tc.expectedOutput,
           actualOutput: passed ? tc.expectedOutput : 'Error or Output Mismatch',
           passed,
           time: '0.042',
           memory: 2048
       }
   });
   
   return {
       allPassed: results.every(r => r.passed),
       results
   }
}
