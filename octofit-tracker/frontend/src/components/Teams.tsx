import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name?: string; members?: Array<string | { toString(): string }> };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getJson<{ teams?: Team[] }>('/api/teams')
      .then((payload) => {
        if (cancelled) return;
        setTeams(payload.teams ?? []);
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message.match(/unable|unavailable|error/i) ? err.message : 'Unable to load teams.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return <CapabilityCard title="Teams" description="Manage teams and members." isLoading={isLoading} error={error} empty={teams.length === 0} emptyMessage="No teams." >{teams.map((team, index) => <p key={`${team.name ?? 'team'}-${index}`}>{team.name ?? 'Unknown team'}: {team.members?.length ?? 0} members</p>)}</CapabilityCard>;
}
