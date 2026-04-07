import { Locale } from '../i18n/translations';
import { TeamPlayer } from '../types/teamPlayers';
import { getFreshCache, readCache, writeCache } from './cache';
import { CACHE_TTL } from '../config/storage';
import { API_ENDPOINTS } from '../config/api';

const asText = (value: unknown, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const normalizePlayer = (raw: any): TeamPlayer | null => {
  const name = asText(
    raw?.athlete?.displayName || raw?.displayName || raw?.fullName || raw?.name,
    '',
  ).trim();
  if (!name) return null;

  const injuries = raw?.injuries || raw?.athlete?.injuries || [];
  const firstInjury = Array.isArray(injuries) ? injuries[0] : null;
  const injuryStatus = asText(
    firstInjury?.shortComment || firstInjury?.status || firstInjury?.detail || '',
    '',
  ).trim();

  return {
    id: asText(raw?.athlete?.id || raw?.id, '').trim() || undefined,
    name,
    position:
      asText(raw?.position?.displayName || raw?.athlete?.position?.displayName || raw?.position?.name, '').trim() ||
      undefined,
    number: asText(raw?.jersey || raw?.athlete?.jersey || raw?.shirtNumber, '').trim() || undefined,
    avatar:
      asText(raw?.athlete?.headshot?.href || raw?.headshot?.href || raw?.athlete?.headshot || raw?.headshot, '').trim() ||
      undefined,
    injured: Boolean(injuryStatus),
    injuryStatus: injuryStatus || undefined,
  };
};

const parsePlayersFromPayload = (payload: any): TeamPlayer[] => {
  const fromAthletes = payload?.athletes || payload?.team?.athletes || [];
  const fromRoster = payload?.roster?.athletes || payload?.team?.roster?.athletes || payload?.roster || [];
  const groups = payload?.team?.athletes || payload?.groups || [];
  const groupedItems: any[] = Array.isArray(groups)
    ? groups.flatMap((g: any) => g?.items || g?.athletes || [])
    : [];

  const merged = [...(Array.isArray(fromAthletes) ? fromAthletes : []), ...(Array.isArray(fromRoster) ? fromRoster : []), ...groupedItems];

  const normalized = merged.map(normalizePlayer).filter((p): p is TeamPlayer => Boolean(p));

  const seen = new Set<string>();
  return normalized.filter((player) => {
    const key = player.id || player.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fetchRawTeamPlayers = async (league: string, teamId: string) => {
  const endpoints = [
    API_ENDPOINTS.teamRoster(league, teamId),
    API_ENDPOINTS.teamDetail(league, teamId),
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint);
    if (!response.ok) continue;
    const payload: any = await response.json();
    const players = parsePlayersFromPayload(payload);
    if (players.length > 0) return players;
  }

  return [];
};

export const fetchTeamPlayersWithInjuries = async (
  league: string,
  teamId: string,
  locale: Locale,
): Promise<TeamPlayer[]> => {
  const cacheKey = `team_players:${league}:${teamId}:${locale}`;
  const fresh = await getFreshCache<TeamPlayer[]>(cacheKey, CACHE_TTL.teamPlayers);
  if (fresh) return fresh;

  try {
    const players = await fetchRawTeamPlayers(league, teamId);
    await writeCache(cacheKey, players);
    return players;
  } catch {
    const stale = await readCache<TeamPlayer[]>(cacheKey);
    return stale?.data || [];
  }
};
