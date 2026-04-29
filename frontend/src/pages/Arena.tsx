import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { socket } from '../services/socket';
import axios from 'axios';
import { CheckCircle, XCircle, Code, Play } from 'lucide-react';

export default function Arena() {
  const { matchId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const problem = state?.problem || { title: 'Unknown', description: 'No description provided.', difficulty: 'Easy', constraints: '' };
  
  const [code, setCode] = useState('// Write your solution here...\n');
  const [opponentStatus, setOpponentStatus] = useState('Waiting for opponent...');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchResult, setMatchResult] = useState<'WIN' | 'LOSS' | null>(null);
  const [executionData, setExecutionData] = useState<any>(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    
    const user = JSON.parse(localStorage.getItem('user')!);
    socket.emit('joinMatch', { matchId: parseInt(matchId as string), userId: user.id });
    
    socket.on('opponentJoined', () => setOpponentStatus('Opponent is in the arena!'));
    socket.on('opponentCodeUpdate', (data: any) => setOpponentStatus(`Opponent writing... (${data.length} chars)`));
    
    // We can simulate opponent win through a global update, but backend handles ELO. Let's just poll or alert if needed.
    
    return () => {
      socket.off('opponentJoined');
      socket.off('opponentCodeUpdate');
    }
  }, [matchId]);

  const handleEditorChange = (value: string | undefined) => {
    const val = value || '';
    setCode(val);
    socket.emit('codeUpdate', { matchId: parseInt(matchId as string), code: val });
  };

  const submitCode = async () => {
    if (isSubmitting || matchResult) return;
    setIsSubmitting(true);
    setExecutionData(null);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/execution/submit', {
        matchId: matchId,
        code,
        language: 'javascript'
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      setExecutionData(res.data);
      if (res.data.allPassed && res.data.matchResolved) {
        setMatchResult('WIN');
        // Update local rating optimistically
        const u = JSON.parse(localStorage.getItem('user')!);
        u.rating += 25;
        localStorage.setItem('user', JSON.stringify(u));
      } else {
        // Did not pass all test cases
      }
    } catch (err) {
      console.error(err);
      alert('Execution failed due to server error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-[80vh] gap-4 animate-fade-in relative">
      
      {/* Match Result Overlay */}
      {matchResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded-xl">
          <div className="bg-gray-800 p-10 rounded-2xl shadow-2xl border border-gray-700 text-center space-y-6">
            <TrophyIcon result={matchResult} />
            <h1 className="text-5xl font-extrabold tracking-widest text-white">YOU {matchResult}!</h1>
            <p className="text-gray-400 font-mono text-xl">{matchResult === 'WIN' ? '+25 ELO' : '-25 ELO'}</p>
            <button onClick={() => navigate('/')} className="px-8 mt-4 py-3 bg-green-600 hover:bg-green-500 font-bold text-white rounded-lg transition border border-green-500/50">
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="w-1/3 flex flex-col gap-4">
        <div className="flex-1 bg-gray-800 p-6 rounded-xl border border-gray-700 overflow-y-auto shadow-2xl flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{problem.title}</h2>
            <span className="px-2 py-1 text-xs font-bold rounded bg-gray-900 border border-gray-700 text-gray-400">{problem.difficulty}</span>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 prose prose-invert max-w-none text-sm border border-gray-700 text-gray-300">
            {problem.description}
          </div>
          
          <div className="mt-4 break-words text-sm text-gray-400 font-mono bg-gray-900/50 p-3 rounded">
            <strong>Constraints:</strong> <br/> {problem.constraints || 'None specified.'}
          </div>
          
          <div className="mt-auto pt-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">VS Opponent</h3>
            <div className="mt-3 flex items-center space-x-3 bg-gray-900 p-3 rounded border border-gray-700">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </div>
              <p className="font-mono text-sm text-yellow-400">{opponentStatus}</p>
            </div>
          </div>
        </div>
        
        {/* Execution Results block */}
        {executionData && (
           <div className="h-1/3 bg-gray-800 p-4 rounded-xl border border-gray-700 overflow-y-auto">
             <h3 className="font-bold mb-2 flex items-center"><Code className="w-4 h-4 mr-2"/> Test Cases</h3>
             {executionData.results?.map((res: any, i: number) => (
                <div key={i} className="mb-2 p-2 bg-gray-900 rounded border border-gray-700 text-xs font-mono">
                  <div className="flex items-center text-gray-300 mb-1">
                    {res.passed ? <CheckCircle className="w-4 h-4 text-green-500 mr-2"/> : <XCircle className="w-4 h-4 text-red-500 mr-2"/>}
                    Test Case #{i + 1}
                  </div>
                  {!res.passed && (
                    <div className="text-red-400 pl-6 mt-1 overflow-x-auto whitespace-pre">
                      Expected: {res.expectedOutput}<br/>
                      Actual: {res.actualOutput}
                    </div>
                  )}
                </div>
             ))}
           </div>
        )}
      </div>
      
      <div className="w-2/3 flex flex-col bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden relative">
        <div className="p-3 border-b border-gray-800 bg-gray-800 flex justify-between items-center z-10">
          <div className="flex space-x-2">
            <span className="bg-blue-600/20 text-blue-400 px-4 py-1.5 rounded-lg text-sm font-bold border border-blue-500/30 font-mono">JavaScript</span>
          </div>
          <button 
            onClick={submitCode} 
            disabled={isSubmitting || matchResult !== null}
            className={`flex items-center text-white font-bold py-1.5 px-6 rounded-lg transition shadow-lg ${isSubmitting ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 border border-green-500/50'}`}
          >
            {isSubmitting ? <span className="animate-pulse">Running...</span> : <><Play className="w-4 h-4 mr-2" fill="currentColor"/> Submit</>}
          </button>
        </div>
        <div className="flex-1">
          <Editor
            height="100%"
            theme="vs-dark"
            defaultLanguage="javascript"
            value={code}
            onChange={handleEditorChange}
            options={{ minimap: { enabled: false }, fontSize: 16, padding: { top: 24 }, scrollBeyondLastLine: false, smoothScrolling: true }}
          />
        </div>
      </div>
    </div>
  );
}

function TrophyIcon({ result }: { result: 'WIN' | 'LOSS' }) {
  if (result === 'WIN') {
    return <div className="mx-auto w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center border-4 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.5)]"><CheckCircle className="w-12 h-12 text-yellow-500" /></div>;
  }
  return <div className="mx-auto w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center border-4 border-red-500"><XCircle className="w-12 h-12 text-red-500" /></div>;
}
