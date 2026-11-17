import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface LeaderboardEntry {
  teamName: string;
  totalPoints: number;
  rank: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<LeaderboardResponse>('/api/leaderboard')
      .then(data => setLeaderboard(data.leaderboard))
      .catch(err => setError(String(err)));
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        {error && <div role="alert" className="alert alert-danger">Unable to load leaderboard: {error}</div>}
        {leaderboard === null && !error && <div role="status">Loading leaderboard...</div>}
        {leaderboard !== null && leaderboard.length === 0 && <div role="status">No leaderboard rankings yet.</div>}
        {leaderboard !== null && leaderboard.length > 0 && (
          <ul>
            {leaderboard.map((entry, idx) => (
              <li key={idx}>
                #{entry.rank} {entry.teamName}: {entry.totalPoints} points
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
