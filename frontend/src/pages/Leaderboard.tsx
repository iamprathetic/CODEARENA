import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/users/leaderboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard');
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="max-w-4xl mx-auto w-full py-8 text-gray-100 animate-fade-in">
      <div className="flex items-center space-x-3 mb-8">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <h1 className="text-3xl font-bold">Global Leaderboard</h1>
      </div>
      
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/50 border-b border-gray-700 text-sm uppercase text-gray-400">
              <th className="p-4 text-center">Rank</th>
              <th className="p-4">Username</th>
              <th className="p-4">Rating</th>
              <th className="p-4 relative pr-6 sm:pr-4">W/L</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/50 transition">
                <td className="p-4 text-center font-mono text-gray-400 text-lg">
                  {i === 0 ? <span className="text-yellow-400">🥇 1</span> : i === 1 ? <span className="text-gray-300">🥈 2</span> : i === 2 ? <span className="text-amber-600">🥉 3</span> : `#${i + 1}`}
                </td>
                <td className="p-4 font-bold text-lg">{u.username}</td>
                <td className="p-4 font-mono text-green-400 text-lg font-bold">{u.rating}</td>
                <td className="p-4 text-sm text-gray-400">
                  <span className="text-green-500 font-bold">{u.wins}W</span> - <span className="text-red-500 font-bold">{u.losses}L</span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No data available yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
