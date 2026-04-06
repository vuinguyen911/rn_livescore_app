import { MatchDetail } from '../types/matchDetail';
import { Locale, translations } from '../i18n/translations';
import { getFreshCache, readCache, writeCache } from './cache';

const summaryUrl = (league: string, eventId: string) =>
  `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${eventId}`;
const MATCH_DETAIL_CACHE_TTL_MS = 5 * 60 * 1000;

const asText = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const formatKickoffSummary = (kickoff: string, locale: Locale, timeZone: string): string => {
  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return kickoff || '-';
  return date.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
};

const translateStatLabel = (label: string, locale: Locale): string => {
  const key = label.trim().toLowerCase().replace(/\s+/g, '');
  const map: Record<string, keyof (typeof translations)['vi']['statLabel']> = {
    possession: 'possessionPct',
    possessionpct: 'possessionPct',
    shotstotal: 'shotsTotal',
    totalshots: 'shotsTotal',
    shotsontarget: 'shotsOnTarget',
    shotsontargettotal: 'shotsOnTarget',
    foulscommitted: 'foulsCommitted',
    yellowcards: 'yellowCards',
    redcards: 'redCards',
    offsides: 'offsides',
    cornerkicks: 'cornerKicks',
    saves: 'saves',
    passpct: 'passPct',
    tackles: 'tackles',
  };
  const mapped = map[key];
  return mapped ? translations[locale].statLabel[mapped] : label;
};

const parseStats = (payload: any, locale: Locale): MatchDetail['stats'] => {
  const teams = payload?.boxscore?.teams || [];
  if (teams.length < 2) return [];

  const homeStats = teams[0]?.statistics || [];
  const awayStats = teams[1]?.statistics || [];
  const map = new Map<string, { home?: string; away?: string }>();

  homeStats.forEach((item: any) => {
    const label = asText(item?.name || item?.displayName || item?.abbreviation, '').trim();
    if (!label) return;
    map.set(label, { ...(map.get(label) || {}), home: asText(item?.displayValue, '-') });
  });

  awayStats.forEach((item: any) => {
    const label = asText(item?.name || item?.displayName || item?.abbreviation, '').trim();
    if (!label) return;
    map.set(label, { ...(map.get(label) || {}), away: asText(item?.displayValue, '-') });
  });

  return Array.from(map.entries()).map(([label, value]) => ({
    label: translateStatLabel(label, locale),
    home: value.home || '-',
    away: value.away || '-',
  }));
};

const normalizePlayer = (
  input: any,
): { name: string; id?: string; avatar?: string; form?: string; position?: string } | null => {
  const name = asText(
    input?.athlete?.displayName || input?.displayName || input?.fullName || input?.name,
    '',
  ).trim();
  if (!name) return null;

  const avatar = asText(
    input?.athlete?.headshot?.href || input?.athlete?.headshot || input?.headshot?.href || input?.headshot,
    '',
  ).trim();
  const form = asText(
    input?.form || input?.recentForm || input?.stats?.form || input?.athlete?.form || input?.displayValue,
    '',
  ).trim();

  return {
    name,
    id: asText(input?.athlete?.id || input?.id, '').trim() || undefined,
    avatar: avatar || undefined,
    form: form || undefined,
    position:
      asText(
        input?.athlete?.position?.displayName || input?.position?.displayName || input?.position?.name,
        '',
      ).trim() || undefined,
  };
};

const extractRosterPlayers = (roster: any): MatchDetail['lineups'][number]['players'] => {
  const groups = roster?.athletes || roster?.groups || [];
  if (!Array.isArray(groups) || groups.length === 0) return [];

  const players: MatchDetail['lineups'][number]['players'] = [];
  groups.forEach((group: any) => {
    const items = group?.items || group?.athletes || [];
    if (!Array.isArray(items)) return;
    items.forEach((item: any) => {
      const normalized = normalizePlayer(item);
      if (normalized) players.push(normalized);
    });
  });

  return players;
};

const parseLineups = (payload: any, locale: Locale): MatchDetail['lineups'] => {
  const t = translations[locale];
  const apiLineups = payload?.lineups || [];

  if (Array.isArray(apiLineups) && apiLineups.length > 0) {
    return apiLineups.map((item: any) => {
      const team = asText(
        item?.team?.displayName || item?.team?.shortDisplayName || item?.team?.name,
        t.detail.unknownTeam,
      );

      const players = (item?.formation?.athletes || item?.athletes || [])
        .map((p: any) => normalizePlayer(p))
        .filter((p: any): p is NonNullable<typeof p> => Boolean(p))
        .slice(0, 18);

      return {
        team,
        players: players.length > 0 ? players : [{ name: t.detail.lineupPlayersMissing }],
      };
    });
  }

  const rosters = payload?.rosters || [];
  if (Array.isArray(rosters) && rosters.length > 0) {
    return rosters.map((roster: any) => {
      const team = asText(roster?.team?.displayName || roster?.team?.name, t.detail.unknownTeam);
      const players = extractRosterPlayers(roster);
      return {
        team,
        players: players.length > 0 ? players.slice(0, 22) : [{ name: t.detail.lineupMissing }],
      };
    });
  }

  return [];
};

const parseTable = (payload: any): MatchDetail['table'] => {
  const rows: MatchDetail['table'] = [];
  const standings = payload?.standings;
  const groups = Array.isArray(standings?.groups) ? standings.groups : [];

  groups.forEach((group: any) => {
    const entries = group?.standings?.entries;
    if (!Array.isArray(entries)) return;

    entries.forEach((entry: any) => {
      const team = asText(entry?.team?.displayName || entry?.team?.name || entry?.team, '').trim();
      if (!team) return;

      const stats = Array.isArray(entry?.stats) ? entry.stats : [];
      const getStat = (names: string[]): string => {
        const found = stats.find((s: any) => names.includes(asText(s?.name).toLowerCase()));
        return asText(found?.displayValue || found?.value, '');
      };

      const rank = getStat(['rank']) || asText(entry?.rank, '');
      const points = getStat(['points', 'pts']);
      const played = getStat(['gamesplayed', 'gp']);

      rows.push({ team, rank, points, played });
    });
  });

  return rows.slice(0, 20);
};

const parseH2H = (payload: any, locale: Locale): string[] => {
  const t = translations[locale];
  const blocks = payload?.headToHeadGames || payload?.headToHead?.events || payload?.headToHead;

  if (Array.isArray(blocks) && blocks.length > 0) {
    return blocks
      .map((item: any) => asText(item?.shortName || item?.name || item?.summary || '', '').trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  return [t.detail.h2hMissing];
};

export const fetchMatchDetail = async (
  league: string,
  eventId: string,
  locale: Locale,
  timeZone: string,
): Promise<MatchDetail> => {
  const t = translations[locale];
  const cacheKey = `match_detail:${league}:${eventId}:${locale}:${timeZone}`;
  const fresh = await getFreshCache<MatchDetail>(cacheKey, MATCH_DETAIL_CACHE_TTL_MS);
  if (fresh) return fresh;

  try {
    const response = await fetch(summaryUrl(league, eventId));
    if (!response.ok) {
      throw new Error(
        locale === 'vi'
          ? `Không thể tải chi tiết trận (${response.status})`
          : `Cannot fetch match detail (${response.status})`,
      );
    }

    const payload: any = await response.json();
    const headerComp = payload?.header?.competitions?.[0] || {};
    const competitors = headerComp?.competitors || [];
    const home = competitors.find((c: any) => c?.homeAway === 'home') || {};
    const away = competitors.find((c: any) => c?.homeAway === 'away') || {};

    const statusText = asText(
      headerComp?.status?.type?.shortDetail || headerComp?.status?.type?.detail,
      '',
    );
    const kickoff = asText(payload?.header?.competitions?.[0]?.date, '');
    const pickSummary = asText(payload?.pickcenter?.summary, '');
    const summary: string[] = [];

    if (statusText) {
      summary.push(locale === 'vi' ? `Trạng thái: ${statusText}` : `Status: ${statusText}`);
    }
    if (kickoff) {
      summary.push(
        locale === 'vi'
          ? `Thời gian thi đấu: ${formatKickoffSummary(kickoff, locale, timeZone)}`
          : `Kickoff: ${formatKickoffSummary(kickoff, locale, timeZone)}`,
      );
    }
    if (pickSummary) {
      summary.push(locale === 'vi' ? `Nhận định: ${pickSummary}` : `Insight: ${pickSummary}`);
    }

    const lineups = parseLineups(payload, locale);
    const isPreMatch = asText(headerComp?.status?.type?.state, '') === 'pre';

    const result: MatchDetail = {
      eventId,
      league,
      homeName: asText(home?.team?.displayName, locale === 'vi' ? 'Đội nhà' : 'Home'),
      awayName: asText(away?.team?.displayName, locale === 'vi' ? 'Đội khách' : 'Away'),
      homeScore: asText(home?.score, '0'),
      awayScore: asText(away?.score, '0'),
      kickoff,
      status: statusText,
      venue: asText(
        payload?.gameInfo?.venue?.fullName || payload?.gameInfo?.venue?.address?.city,
        t.detail.venueMissing,
      ),
      summary: summary.length ? summary : [t.detail.summaryMissing],
      h2h: parseH2H(payload, locale),
      stats: parseStats(payload, locale),
      lineups,
      table: parseTable(payload),
      isPredictedLineup: isPreMatch && lineups.length > 0,
    };

    await writeCache(cacheKey, result);
    return result;
  } catch (error) {
    const stale = await readCache<MatchDetail>(cacheKey);
    if (stale?.data) return stale.data;
    throw error;
  }
};
