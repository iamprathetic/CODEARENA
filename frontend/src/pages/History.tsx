import { useEffect, useState } from 'react';
import axios from 'axios';
import { History as HistoryIcon, Swords } from 'lucide-react';

export default function History() {
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/users/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMatches(res.data);
      } catch (err) {
        console.error('Failed to fetch history');
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto w-full py-8 text-gray-100 animate-fade-in">
      <div className="flex items-center space-x-3 mb-8">
        <HistoryIcon className="w-8 h-8 text-blue-500" />
        <h1 className="text-3xl font-bold">Match History</h1>
      </div>

      <div className="space-y-4">
        {matches.map(m => (
          <div key={m.id} className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex items-center justify-between shadow-lg hover:border-gray-600 transition">
            <div>
              <h3 className="font-bold text-lg text-white">
                {m.problem?.title || 'Unknown Problem'} 
                <span className="text-xs font-normal text-gray-400 ml-2 px-2 py-1 bg-gray-900 rounded border border-gray-700">
                  {m.problem?.difficulty || 'N/A'}
                </span>
              </h3>
              <p className="text-sm text-gray-400 mt-2">
                {new Date(m.date).toLocaleDateString()} at {new Date(m.date).toLocaleTimeString()}
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 uppercase tracking-widest mb-1">vs</span>
                <span className="font-bold bg-gray-900 px-3 py-1 rounded border border-gray-700">{m.opponent?.username || 'Unknown'}</span>
              </div>
              
              <div className={`px-4 py-2 font-bold rounded-lg border flex items-center space-x-2 ${
                m.result === 'WIN' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                m.result === 'LOSS' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                'bg-gray-500/10 text-gray-400 border-gray-500/30'
              }`}>
                <Swords className="w-5 h-5" />
                <span>{m.result}</span>
              </div>
            </div>
          </div>
        ))}
        {matches.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-800 rounded-xl border border-gray-700">
            No matches played yet. Head to the arena!
          </div>
        )}
      </div>
    </div>
  );
}
