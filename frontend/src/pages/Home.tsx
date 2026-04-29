import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';
import { Loader } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      navigate('/auth');
      return;
    }
    setUser(JSON.parse(userData));

    socket.on('matchFound', (data: { matchId: number, problem: any }) => {
      setIsSearching(false);
      navigate(`/arena/${data.matchId}`, { state: { problem: data.problem } });
    });

    return () => {
      socket.off('matchFound');
    };
  }, [navigate]);

  const joinQueue = () => {
    if (!socket.connected) socket.connect();
    setIsSearching(true);
    socket.emit('joinQueue', { userId: user.id });
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in text-center py-10 mt-10">
      <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 mb-4 items-center">
        Welcome to CodeArena, {user.username}!
      </h1>
      <p className="text-gray-400 text-xl font-medium">Your Current Rating: <span className="text-white font-mono font-bold">{user.rating}</span> ELO</p>
      
      <div className="mt-12 flex flex-col items-center justify-center space-y-6">
        {isSearching ? (
          <div className="flex flex-col items-center space-y-4 bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl">
            <Loader className="w-12 h-12 text-green-500 animate-spin" />
            <h3 className="text-xl font-bold font-mono tracking-widest text-green-400">FINDING OPPONENT...</h3>
            <p className="text-gray-400 text-sm">Searching for players near your rating ({user.rating})</p>
            <button onClick={() => { setIsSearching(false); socket.disconnect(); }} className="mt-4 text-red-400 hover:text-red-300 transition text-sm underline">
              Cancel Search
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-4 items-center">
            <button 
              onClick={joinQueue}
              className="px-10 py-5 bg-green-600 hover:bg-green-500 text-white text-xl font-bold rounded-2xl shadow-[0_0_40px_rgba(22,163,74,0.4)] transition transform hover:-translate-y-2 border border-green-500/50"
            >
              Start Ranked Match
            </button>
            <button 
              onClick={() => navigate('/practice')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.4)] transition transform hover:-translate-y-1 border border-blue-500/50"
            >
              Practice Coding Skills
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
