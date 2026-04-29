import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Code, ChevronRight, Trophy, Target } from 'lucide-react';

export default function Practice() {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  const filteredLevels = levels.filter(level => {
    const matchesSearch = level.level.toString().includes(searchTerm) || 
                         level.difficulty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || level.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }
    fetchLanguages();
  }, [navigate]);

  const fetchLanguages = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      console.log('Fetching languages with token:', token ? 'present' : 'missing');
      const res = await axios.get('http://localhost:5000/api/users/practice/languages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Languages response:', res.data);
      setLanguages(res.data);
    } catch (error: any) {
      console.error('Failed to fetch languages:', error);
      setError(error.response?.data?.error || 'Failed to load languages');
      // Fallback: set default languages
      setLanguages(['javascript', 'python', 'typescript']);
    }
  };

  const selectLanguage = async (language: string) => {
    setSelectedLanguage(language);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching levels for language:', language);
      const res = await axios.get(`http://localhost:5000/api/users/practice/${language}/levels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Levels response:', res.data);
      setLevels(res.data);
    } catch (error: any) {
      console.error('Failed to fetch levels:', error);
      // Fallback: create levels locally
      const fallbackLevels = [];
      for (let i = 1; i <= 100; i++) {
        fallbackLevels.push({
          level: i,
          completed: false,
          difficulty: i <= 20 ? 'Beginner' : i <= 50 ? 'Intermediate' : i <= 80 ? 'Advanced' : 'Expert'
        });
      }
      setLevels(fallbackLevels);
    } finally {
      setLoading(false);
    }
  };

  const startLevel = (level: number) => {
    navigate(`/practice/${selectedLanguage}/${level}`);
  };

  if (!selectedLanguage) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-10">
          <Code className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 mb-4">
            Practice Arena
          </h1>
          <p className="text-gray-400 text-lg">Master coding skills with progressive challenges</p>
          {error && <p className="text-red-400 mt-4">{error}</p>}
        </div>

        {languages.length === 0 && !error ? (
          <div className="text-center py-10">
            <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading languages...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {languages.map((language) => (
              <div
                key={language}
                onClick={() => selectLanguage(language)}
                className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-green-500 transition-all cursor-pointer group"
              >
                <div className="text-center">
                  <Code className="w-12 h-12 text-green-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold capitalize mb-2">{language}</h3>
                  <p className="text-gray-400 text-sm">100 levels of mastery</p>
                  <ChevronRight className="w-5 h-5 text-green-500 mx-auto mt-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => setSelectedLanguage('')}
          className="text-green-500 hover:text-green-400 transition-colors"
        >
          ← Back to Languages
        </button>
        <div className="flex items-center space-x-2">
          <Code className="w-6 h-6 text-green-500" />
          <h1 className="text-3xl font-bold capitalize">{selectedLanguage} Practice</h1>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search levels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
        />
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
        >
          <option value="All">All Difficulties</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Expert">Expert</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading levels...</p>
        </div>
      ) : (
        <div className="grid grid-cols-5 md:grid-cols-10 lg:grid-cols-20 gap-2 max-h-96 overflow-y-auto">
          {filteredLevels.map((level) => (
            <div
              key={level.level}
              onClick={() => startLevel(level.level)}
              className={`p-2 rounded border cursor-pointer transition-all hover:scale-105 text-xs ${
                level.completed
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-green-500'
              }`}
            >
              <div className="text-center">
                {level.completed ? (
                  <Trophy className="w-3 h-3 mx-auto mb-1 text-green-500" />
                ) : (
                  <Target className="w-3 h-3 mx-auto mb-1 text-gray-400" />
                )}
                <div className="font-bold text-sm">{level.level}</div>
                <div className="text-xs text-gray-400 truncate">{level.difficulty}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}