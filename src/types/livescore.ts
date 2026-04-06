export type LeagueKey =
  | 'eng.1'
  | 'eng.fa'
  | 'eng.league_cup'
  | 'eng.2'
  | 'esp.1'
  | 'ger.1'
  | 'ita.1'
  | 'fra.1';

export type MatchStatus = 'LIVE' | 'FT' | 'UPCOMING';

export type MatchItem = {
  id: string;
  league: LeagueKey;
  leagueName: string;
  kickoff: string;
  status: MatchStatus;
  statusText: string;
  minute?: string;
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
};

export type LeagueMatches = {
  league: LeagueKey;
  title: string;
  matches: MatchItem[];
};
