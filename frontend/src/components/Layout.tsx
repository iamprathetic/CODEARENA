import { Outlet, useNavigate } from 'react-router-dom';
import { Gamepad2, LogOut } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans selection:bg-green-500/30">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <Gamepad2 className="w-8 h-8 text-green-500" />
              <span className="text-xl font-bold tracking-tight">Code<span className="text-green-500">Arena</span></span>
            </div>
            
            {user && (
              <nav className="hidden md:flex space-x-6 text-sm font-medium text-gray-400">
                <button onClick={() => navigate('/')} className="hover:text-white transition">Dashboard</button>
                <button onClick={() => navigate('/practice')} className="hover:text-white transition">Practice</button>
                <button onClick={() => navigate('/leaderboard')} className="hover:text-white transition">Leaderboard</button>
                <button onClick={() => navigate('/history')} className="hover:text-white transition">Match History</button>
              </nav>
            )}
          </div>
          
          {user && (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 text-sm">
                <span className="text-gray-400">{user.username}</span>
                <span className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700 font-mono text-green-400">
                  {user.rating} ELO
                </span>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white transition group flex items-center space-x-2">
                <LogOut className="w-5 h-5 group-hover:text-red-400" />
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
