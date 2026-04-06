import { Locale } from '../i18n/translations';
import { PlayerDetail } from '../types/playerDetail';
import { getFreshCache, readCache, writeCache } from './cache';

const PLAYER_CACHE_TTL_MS = 30 * 60 * 1000;

const asText = (value: unknown, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const parsePlayerPayload = (payload: any, fallback: PlayerDetail): PlayerDetail => {
  const athlete = payload?.athlete || payload;
  const fullName = asText(
    athlete?.displayName || athlete?.fullName || athlete?.shortName || fallback.name,
    fallback.name,
  );
  const country = athlete?.birthPlace?.country || athlete?.birthPlace?.displayText || athlete?.citizenship;
  const team =
    athlete?.team?.displayName ||
    athlete?.team?.name ||
    payload?.team?.displayName ||
    payload?.team?.name ||
    fallback.club;

  return {
    ...fallback,
    id: asText(athlete?.id || fallback.id, fallback.id || ''),
    name: fullName,
    avatar: asText(
      athlete?.headshot?.href || athlete?.headshot || athlete?.image || fallback.avatar,
      fallback.avatar || '',
    ),
    age: asText(athlete?.age || athlete?.displayAge || fallback.age, fallback.age || ''),
    nationality: asText(country || fallback.nationality, fallback.nationality || ''),
    position: asText(
      athlete?.position?.displayName || athlete?.position?.name || fallback.position,
      fallback.position || '',
    ),
    club: asText(team || fallback.club, fallback.club || ''),
    jersey: asText(athlete?.jersey || athlete?.shirtNumber || fallback.jersey, fallback.jersey || ''),
    height: asText(athlete?.displayHeight || athlete?.height || fallback.height, fallback.height || ''),
    weight: asText(athlete?.displayWeight || athlete?.weight || fallback.weight, fallback.weight || ''),
    foot: asText(athlete?.preferredFoot || fallback.foot, fallback.foot || ''),
    form: asText(
      athlete?.form || athlete?.recentForm || payload?.form || payload?.statistics?.form || fallback.form,
      fallback.form || '',
    ),
    marketValue: asText(payload?.marketValue || fallback.marketValue, fallback.marketValue || ''),
    contractUntil: asText(payload?.contractUntil || athlete?.contractUntil || fallback.contractUntil, fallback.contractUntil || ''),
    salary: asText(payload?.salary || athlete?.salary || fallback.salary, fallback.salary || ''),
  };
};

const fetchPlayerRaw = async (league: string, playerId?: string, name?: string) => {
  const endpoints: string[] = [];
  if (playerId) {
    endpoints.push(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/athletes/${playerId}`);
  }
  if (name) {
    endpoints.push(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/athletes?search=${encodeURIComponent(name)}`,
    );
  }

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint);
    if (!response.ok) continue;
    const payload: any = await response.json();
    if (payload?.athlete) return payload;
    if (Array.isArray(payload?.items) && payload.items.length > 0) {
      return payload.items[0];
    }
    if (Array.isArray(payload?.athletes) && payload.athletes.length > 0) {
      return payload.athletes[0];
    }
    if (payload?.displayName || payload?.fullName) return payload;
  }

  return null;
};

export const fetchPlayerDetail = async (
  league: string,
  locale: Locale,
  fallback: PlayerDetail,
): Promise<PlayerDetail> => {
  const cacheKey = `player:${league}:${fallback.id || fallback.name}:${locale}`;
  const fresh = await getFreshCache<PlayerDetail>(cacheKey, PLAYER_CACHE_TTL_MS);
  if (fresh) return fresh;

  try {
    const payload = await fetchPlayerRaw(league, fallback.id, fallback.name);
    const parsed = payload ? parsePlayerPayload(payload, fallback) : fallback;
    await writeCache(cacheKey, parsed);
    return parsed;
  } catch {
    const stale = await readCache<PlayerDetail>(cacheKey);
    return stale?.data || fallback;
  }
};

