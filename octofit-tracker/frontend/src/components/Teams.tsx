import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Team {
  name: string;
  members: string[];
}

interface TeamsResponse {
  teams: Team[];
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<TeamsResponse>('/api/teams')
      .then(data => setTeams(data.teams))
      .catch(err => setError(String(err)));
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        {error && <div role="alert" className="alert alert-danger">Unable to load teams: {error}</div>}
        {teams === null && !error && <div role="status">Loading teams...</div>}
        {teams !== null && teams.length === 0 && <div role="status">No teams yet.</div>}
        {teams !== null && teams.length > 0 && (
          <ul>
            {teams.map((team, idx) => (
              <li key={idx}>
                {team.name}: {team.members.join(', ')}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
