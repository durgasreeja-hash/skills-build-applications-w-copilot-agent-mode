import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title?: string; reason?: string; focus?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getJson<{ suggestions?: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then((payload) => {
        if (cancelled) return;
        setSuggestions(payload.suggestions ?? []);
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message.match(/unable|unavailable|error/i) ? err.message : 'Unable to load workout suggestions.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." isLoading={isLoading} error={error} empty={suggestions.length === 0} emptyMessage="No workout suggestions." >{suggestions.map((suggestion, index) => <p key={`${suggestion.title ?? 'suggestion'}-${index}`}>{suggestion.title ?? 'Workout'}: {suggestion.reason ?? suggestion.focus ?? 'Recommended for your activity pattern.'}</p>)}</CapabilityCard>;
}
