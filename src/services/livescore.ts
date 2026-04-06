import { LeagueKey, LeagueMatches, MatchItem, MatchStatus } from '../types/livescore';

const LEAGUES: { key: LeagueKey; title: string }[] = [
  { key: 'eng.1', title: 'Premier League' },
  { key: 'esp.1', title: 'LaLiga' },
  { key: 'ger.1', title: 'Bundesliga' },
  { key: 'eng.fa', title: 'FA Cup' },
  { key: 'eng.league_cup', title: 'League Cup' },
  { key: 'eng.2', title: 'Championship' },
  { key: 'ita.1', title: 'Serie A' },
  { key: 'fra.1', title: 'Ligue 1' },
];

const formatApiDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

const SCOREBOARD_URL = (league: LeagueKey, date: Date) =>
  `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${formatApiDate(date)}`;

const asNumber = (value: unknown): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const parseStatus = (rawStatus: unknown): { status: MatchStatus; statusText: string; minute?: string } => {
  const statusData = (rawStatus as { type?: { state?: string; detail?: string; shortDetail?: string } }) || {};
  const state = statusData.type?.state || 'pre';
  const detail = statusData.type?.shortDetail || statusData.type?.detail || '';

  if (state === 'in') {
    const minute = detail.match(/\d+'/)?.[0];
    return {
      status: 'LIVE',
      statusText: detail || 'LIVE',
      minute,
    };
  }

  if (state === 'post') {
    return {
      status: 'FT',
      statusText: detail || 'FT',
    };
  }

  return {
    status: 'UPCOMING',
    statusText: detail || 'Sắp diễn ra',
  };
};

const parseEvent = (league: LeagueKey, leagueName: string, event: Record<string, unknown>): MatchItem | null => {
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

  const parsedStatus = parseStatus(competition.status);

  return {
    id: String(event.id || `${league}-${competition.id || Math.random()}`),
    league,
    leagueName,
    kickoff: String(event.date || ''),
    status: parsedStatus.status,
    statusText: parsedStatus.statusText,
    minute: parsedStatus.minute,
    homeName: String((home.team as Record<string, unknown> | undefined)?.displayName || 'Home'),
    awayName: String((away.team as Record<string, unknown> | undefined)?.displayName || 'Away'),
    homeScore: asNumber(home.score),
    awayScore: asNumber(away.score),
  };
};

export const fetchTop5LiveScores = async (targetDate: Date): Promise<LeagueMatches[]> => {
  const leagueData = await Promise.all(
    LEAGUES.map(async ({ key, title }) => {
      const response = await fetch(SCOREBOARD_URL(key, targetDate));
      if (!response.ok) {
        throw new Error(`Cannot fetch ${title} (${response.status})`);
      }

      const payload = (await response.json()) as {
        events?: Record<string, unknown>[];
      };

      const matches = (payload.events || [])
        .map((event) => parseEvent(key, title, event))
        .filter((match): match is MatchItem => Boolean(match))
        .sort((a, b) => {
          if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
          if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;
          return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
        });

      return {
        league: key,
        title,
        matches,
      };
    }),
  );

  return leagueData;
};
