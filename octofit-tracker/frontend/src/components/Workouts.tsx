import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface WorkoutSuggestion {
  title: string;
  reason: string;
}

interface WorkoutsResponse {
  suggestions: WorkoutSuggestion[];
}

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<WorkoutsResponse>('/api/workouts/suggestions/mona@example.com')
      .then(data => setSuggestions(data.suggestions))
      .catch(err => setError(String(err)));
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        {error && <div role="alert" className="alert alert-danger">Unable to load workout suggestions: {error}</div>}
        {suggestions === null && !error && <div role="status">Loading workout suggestions...</div>}
        {suggestions !== null && suggestions.length === 0 && <div role="status">No workout suggestions available.</div>}
        {suggestions !== null && suggestions.length > 0 && (
          <ul>
            {suggestions.map((suggestion, idx) => (
              <li key={idx}>
                {suggestion.title}: {suggestion.reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
