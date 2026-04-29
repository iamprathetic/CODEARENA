import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import History from './pages/History';
import Arena from './pages/Arena';
import Practice from './pages/Practice';
import PracticeLevel from './pages/PracticeLevel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="history" element={<History />} />
          <Route path="practice" element={<Practice />} />
          <Route path="practice/:language/:level" element={<PracticeLevel />} />
          <Route path="arena/:matchId" element={<Arena />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
