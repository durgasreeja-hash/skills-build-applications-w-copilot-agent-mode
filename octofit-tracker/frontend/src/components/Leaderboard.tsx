import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName?: string; totalPoints?: number; rank?: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getJson<{ leaderboard?: LeaderboardEntry[] }>('/api/leaderboard')
      .then((payload) => {
        if (cancelled) return;
        setLeaderboard(payload.leaderboard ?? []);
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message.match(/unable|unavailable|error/i) ? err.message : 'Unable to load leaderboard.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return <CapabilityCard title="Leaderboard" description="Compare team point totals." isLoading={isLoading} error={error} empty={leaderboard.length === 0} emptyMessage="No leaderboard." >{leaderboard.map((entry, index) => <p key={`${entry.teamName ?? 'team'}-${index}`}>{entry.rank ?? index + 1}. {entry.teamName ?? 'Unknown'}: {entry.totalPoints ?? 0}</p>)}</CapabilityCard>;
}
