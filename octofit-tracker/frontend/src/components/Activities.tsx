import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Activity {
  type: string;
  minutes: number;
  points: number;
}

interface ActivitiesResponse {
  activities: Activity[];
}

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<ActivitiesResponse>('/api/activities')
      .then(data => setActivities(data.activities))
      .catch(err => setError(String(err)));
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        {error && <div role="alert" className="alert alert-danger">Unable to load activities: {error}</div>}
        {activities === null && !error && <div role="status">Loading activities...</div>}
        {activities !== null && activities.length === 0 && <div role="status">No activities yet.</div>}
        {activities !== null && activities.length > 0 && (
          <ul>
            {activities.map((activity, idx) => (
              <li key={idx}>
                {activity.type}: {activity.minutes} minutes, {activity.points} points
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
