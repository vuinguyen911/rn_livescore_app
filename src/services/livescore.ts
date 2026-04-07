import { LeagueKey, LeagueMatches, MatchItem, MatchStatus } from '../types/livescore';
import { Locale, translations } from '../i18n/translations';
import { getFreshCache, readCache, writeCache } from './cache';
import { CACHE_TTL } from '../config/storage';
import { API_ENDPOINTS } from '../config/api';

export const AVAILABLE_LEAGUES: LeagueKey[] = [
  'uefa.champions',
  'eng.1',
  'esp.1',
  'ger.1',
  'ita.1',
  'fra.1',
  'eng.fa',
  'eng.league_cup',
  'eng.2',
  'uefa.europa',
];

const formatApiDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

const SCOREBOARD_URL = (league: LeagueKey, date: Date) =>
  API_ENDPOINTS.scoreboard(league, formatApiDate(date));

const asNumber = (value: unknown): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const parseStatus = (
  rawStatus: unknown,
  locale: Locale,
): { status: MatchStatus; statusText: string; minute?: string } => {
  const statusData = (rawStatus as { type?: { state?: string; detail?: string; shortDetail?: string } }) || {};
  const state = statusData.type?.state || 'pre';
  const detail = statusData.type?.shortDetail || statusData.type?.detail || '';
  const t = translations[locale];

  if (state === 'in') {
    const minute = detail.match(/\d+'/)?.[0];
    return {
      status: 'LIVE',
      statusText: detail || t.common.live,
      minute,
    };
  }

  if (state === 'post') {
    return {
      status: 'FT',
      statusText: detail || t.common.ft,
    };
  }

  return {
    status: 'UPCOMING',
    statusText: detail || t.common.upcoming,
  };
};

const parseEvent = (
  league: LeagueKey,
  leagueName: string,
  event: Record<string, unknown>,
  locale: Locale,
): MatchItem | null => {
  const competition = (event.competitions as Record<string, unknown>[] | undefined)?.[0];
  if (!competition) {
    return null;
  }

  const competitors = (competition.competitors as Record<string, unknown>[] | undefined) || [];
  const home = competitors.find((team) => team.homeAway === 'home');
  const away = competitors.find((team) => team.homeAway === 'away');

  if (!home || !away) {
    return null;
  }

  const parsedStatus = parseStatus(competition.status, locale);

  const homeTeamObj = (home.team as Record<string, unknown> | undefined) || {};
  const awayTeamObj = (away.team as Record<string, unknown> | undefined) || {};
  const homeLogos = (homeTeamObj.logos as Record<string, unknown>[] | undefined) || [];
  const awayLogos = (awayTeamObj.logos as Record<string, unknown>[] | undefined) || [];

  return {
    id: String(event.id || `${league}-${competition.id || Math.random()}`),
    league,
    leagueName,
    kickoff: String(event.date || ''),
    status: parsedStatus.status,
    statusText: parsedStatus.statusText,
    minute: parsedStatus.minute,
    homeName: String(
      homeTeamObj.displayName || (locale === 'vi' ? 'Đội nhà' : 'Home'),
    ),
    awayName: String(
      awayTeamObj.displayName || (locale === 'vi' ? 'Đội khách' : 'Away'),
    ),
    homeTeamId: String(homeTeamObj.id || ''),
    awayTeamId: String(awayTeamObj.id || ''),
    homeLogo: String(homeTeamObj.logo || homeLogos[0]?.href || ''),
    awayLogo: String(awayTeamObj.logo || awayLogos[0]?.href || ''),
    homeScore: asNumber(home.score),
    awayScore: asNumber(away.score),
  };
};

export const fetchTop5LiveScores = async (
  targetDate: Date,
  locale: Locale,
  leagues: LeagueKey[],
): Promise<LeagueMatches[]> => {
  const t = translations[locale];
  const activeLeagues = leagues.length > 0 ? leagues : AVAILABLE_LEAGUES;
  const leagueData = await Promise.all(
    activeLeagues.map(async (key) => {
      const title = t.league[key];
      const cacheKey = `livescore:${key}:${formatApiDate(targetDate)}:${locale}`;
      const fresh = await getFreshCache<LeagueMatches>(cacheKey, CACHE_TTL.liveScore);
      if (fresh) return fresh;

      try {
        const response = await fetch(SCOREBOARD_URL(key, targetDate));
        if (!response.ok) {
          throw new Error(
            locale === 'vi'
              ? `Không thể tải ${title} (${response.status})`
              : `Cannot fetch ${title} (${response.status})`,
          );
        }

        const payload = (await response.json()) as {
          events?: Record<string, unknown>[];
        };

        const result: LeagueMatches = {
          league: key,
          title,
          matches: (payload.events || [])
            .map((event) => parseEvent(key, title, event, locale))
            .filter((match): match is MatchItem => Boolean(match))
            .sort((a, b) => {
              if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
              if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;
              return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
            }),
        };
        await writeCache(cacheKey, result);
        return result;
      } catch (error) {
        const stale = await readCache<LeagueMatches>(cacheKey);
        if (stale?.data) return stale.data;
        throw error;
      }
    }),
  );

  return leagueData;
};
