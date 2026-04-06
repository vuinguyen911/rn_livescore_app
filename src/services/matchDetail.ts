import { MatchDetail } from '../types/matchDetail';
import { Locale, translations } from '../i18n/translations';

const summaryUrl = (league: string, eventId: string) =>
  `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${eventId}`;

const asText = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined) return fallback;
  return String(value);
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

const extractRosterPlayers = (roster: any): string[] => {
  const groups = roster?.athletes || roster?.groups || [];
  if (!Array.isArray(groups) || groups.length === 0) return [];

  const names: string[] = [];
  groups.forEach((group: any) => {
    const items = group?.items || group?.athletes || [];
    if (!Array.isArray(items)) return;
    items.forEach((item: any) => {
      const name = asText(
        item?.athlete?.displayName || item?.displayName || item?.fullName || item?.name,
        '',
      ).trim();
      if (name) names.push(name);
    });
  });

  return names;
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
        .map((p: any) =>
          asText(p?.athlete?.displayName || p?.displayName || p?.fullName, '').trim(),
        )
        .filter(Boolean)
        .slice(0, 18);

      return {
        team,
        players: players.length > 0 ? players : [t.detail.lineupPlayersMissing],
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
        players: players.length > 0 ? players.slice(0, 22) : [t.detail.lineupMissing],
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
): Promise<MatchDetail> => {
  const t = translations[locale];
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

  const summary: string[] = [
    asText(headerComp?.status?.type?.detail, ''),
    asText(payload?.header?.season?.year, ''),
    asText(payload?.pickcenter?.summary, ''),
  ].filter(Boolean);

  return {
    eventId,
    league,
    homeName: asText(home?.team?.displayName, locale === 'vi' ? 'Đội nhà' : 'Home'),
    awayName: asText(away?.team?.displayName, locale === 'vi' ? 'Đội khách' : 'Away'),
    homeScore: asText(home?.score, '0'),
    awayScore: asText(away?.score, '0'),
    kickoff: asText(payload?.header?.competitions?.[0]?.date, ''),
    status: asText(headerComp?.status?.type?.shortDetail || headerComp?.status?.type?.detail, ''),
    venue: asText(
      payload?.gameInfo?.venue?.fullName || payload?.gameInfo?.venue?.address?.city,
      t.detail.venueMissing,
    ),
    summary: summary.length ? summary : [t.detail.summaryMissing],
    h2h: parseH2H(payload, locale),
    stats: parseStats(payload, locale),
    lineups: parseLineups(payload, locale),
    table: parseTable(payload),
  };
};
