import { Locale } from '../i18n/translations';
import { TeamFixture } from '../types/teamSchedule';
import { getFreshCache, readCache, writeCache } from './cache';

const TEAM_SCHEDULE_TTL_MS = 10 * 60 * 1000;

const asText = (value: unknown, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const parseEvent = (event: any): TeamFixture | null => {
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors || [];
  const home = competitors.find((item: any) => item?.homeAway === 'home') || {};
  const away = competitors.find((item: any) => item?.homeAway === 'away') || {};

  const homeName = asText(home?.team?.displayName, '');
  const awayName = asText(away?.team?.displayName, '');
  if (!homeName || !awayName) return null;

  return {
    id: asText(event?.id, `${homeName}-${awayName}`),
    eventId: asText(event?.id, ''),
    homeName,
    awayName,
    homeScore: asText(home?.score, ''),
    awayScore: asText(away?.score, ''),
    kickoff: asText(event?.date || competition?.date, ''),
    status: asText(competition?.status?.type?.shortDetail || competition?.status?.type?.detail, ''),
    league: asText(event?.league?.slug || event?.seasonType?.name || '', ''),
  };
};

const fetchTeamScheduleRaw = async (league: string, teamId: string) => {
  const endpoints = [
    `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${teamId}/schedule`,
    `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${teamId}`,
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint);
    if (!response.ok) continue;
    const payload: any = await response.json();
    const events = payload?.events || payload?.team?.nextEvents || payload?.nextEvents || [];
    if (Array.isArray(events) && events.length > 0) {
      return events;
    }
  }

  return [];
};

export const fetchTeamUpcomingSchedule = async (
  league: string,
  teamId: string,
  locale: Locale,
): Promise<TeamFixture[]> => {
  const cacheKey = `team_schedule:${league}:${teamId}:${locale}`;
  const fresh = await getFreshCache<TeamFixture[]>(cacheKey, TEAM_SCHEDULE_TTL_MS);
  if (fresh) return fresh;

  try {
    const rawEvents = await fetchTeamScheduleRaw(league, teamId);
    const fixtures = rawEvents
      .map(parseEvent)
      .filter((item): item is TeamFixture => Boolean(item))
      .filter((item) => {
        const kickoffMs = new Date(item.kickoff).getTime();
        return Number.isFinite(kickoffMs) && kickoffMs >= Date.now() - 2 * 60 * 60 * 1000;
      })
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
      .slice(0, 20);

    await writeCache(cacheKey, fixtures);
    return fixtures;
  } catch {
    const stale = await readCache<TeamFixture[]>(cacheKey);
    if (stale?.data) return stale.data;
    return [];
  }
};

