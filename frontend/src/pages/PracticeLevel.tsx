import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { CheckCircle, XCircle, Play, ArrowLeft, Code } from 'lucide-react';

export default function PracticeLevel() {
  const { language, level } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<any>(null);
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }
    fetchProblem();
  }, [language, level, navigate]);

  const fetchProblem = async () => {
    try {
      console.log('Fetching problem for:', language, level);
      const token = localStorage.getItem('token');
      console.log('Token present:', !!token);
      const res = await axios.get(`http://localhost:5000/api/users/practice/${language}/${level}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Problem response:', res.data);
      setProblem(res.data);

      // Set default code based on language
      const defaultCode = {
        javascript: `function solution() {\n    // Write your solution here\n    return "Hello, World!";\n}`,
        python: `def solution():\n    # Write your solution here\n    return "Hello, World!"`,
        typescript: `function solution(): string {\n    // Write your solution here\n    return "Hello, World!";\n}`
      };
      setCode(defaultCode[language as keyof typeof defaultCode] || '');
    } catch (error: any) {
      console.error('Failed to fetch problem:', error);
      console.error('Error response:', error.response?.data);
      // Set a fallback problem
      setProblem({
        id: 1,
        title: `Level ${level} Problem`,
        description: `Solve this ${language} problem at level ${level}`,
        language,
        level: parseInt(level || '1'),
        constraints: 'Implement the required solution',
        testCases: [{ input: 'test', expectedOutput: 'output' }]
      });
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    if (isSubmitting || !problem) return;
    setIsSubmitting(true);
    setExecutionResult(null);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/execution/submit', {
        code,
        language,
        testCases: problem.testCases
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setExecutionResult(res.data);
    } catch (error: any) {
      setExecutionResult({
        success: false,
        error: error.response?.data?.error || 'Execution failed'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="text-center py-10">
        <p className="text-red-400">Failed to load problem. Please try again.</p>
        <button
          onClick={() => navigate('/practice')}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Back to Practice
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/practice')}
            className="flex items-center space-x-2 text-green-500 hover:text-green-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Practice</span>
          </button>
          <div className="flex items-center space-x-2">
            <Code className="w-6 h-6 text-green-500" />
            <span className="text-xl font-bold capitalize">{language} - Level {level}</span>
          </div>
        </div>
      </div>

      {/* Problem Description */}
      <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">{problem.title}</h2>
        <p className="text-gray-300 mb-4">{problem.description}</p>
        {problem.constraints && (
          <div className="mb-4">
            <h3 className="font-semibold text-green-400 mb-2">Constraints:</h3>
            <p className="text-gray-400">{problem.constraints}</p>
          </div>
        )}
        <div>
          <h3 className="font-semibold text-green-400 mb-2">Test Cases:</h3>
          <div className="space-y-2">
            {problem.testCases.map((tc: any, index: number) => (
              <div key={index} className="bg-gray-900 p-3 rounded-lg">
                <div className="text-sm">
                  <span className="text-gray-400">Input:</span> {tc.input || 'None'}
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Expected:</span> {tc.expectedOutput}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Code Editor */}
      <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Your Solution</h3>
        <div className="h-96 border border-gray-600 rounded-lg overflow-hidden">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
        <button
          onClick={submitCode}
          disabled={isSubmitting}
          className="mt-4 flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>{isSubmitting ? 'Running...' : 'Run Tests'}</span>
        </button>
      </div>

      {/* Execution Results */}
      {executionResult && (
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Test Results</h3>
          {executionResult.success ? (
            <div className="space-y-4">
              {executionResult.allPassed ? (
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">All tests passed! 🎉</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-400">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">Some tests failed</span>
                </div>
              )}
              <div className="space-y-2">
                {executionResult.results.map((result: any, index: number) => (
                  <div key={index} className={`p-3 rounded-lg ${result.passed ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      {result.passed ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-medium">Test Case {index + 1}</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div><span className="text-gray-400">Input:</span> {result.input || 'None'}</div>
                      <div><span className="text-gray-400">Expected:</span> {result.expectedOutput}</div>
                      <div><span className="text-gray-400">Got:</span> {result.actualOutput}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-red-400">
              <p>Error: {executionResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}