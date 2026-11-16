import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getJson<{ activities?: Activity[] }>('/api/activities')
      .then((payload) => {
        if (cancelled) return;
        setActivities(payload.activities ?? []);
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message.match(/unable|unavailable|error/i) ? err.message : 'Unable to load activities.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return <CapabilityCard title="Activities" description="Track student activity minutes and points." isLoading={isLoading} error={error} empty={activities.length === 0} emptyMessage="No activities." >{activities.map((activity, index) => <p key={`${activity.type ?? 'activity'}-${index}`}>{activity.type ?? 'Activity'}: {activity.minutes ?? 0} minutes, {activity.points ?? 0} pts</p>)}</CapabilityCard>;
}
