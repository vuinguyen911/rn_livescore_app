export type DetailStat = {
  label: string;
  home: string;
  away: string;
};

export type DetailLineup = {
  team: string;
  players: DetailPlayer[];
};

export type DetailPlayer = {
  name: string;
  avatar?: string;
  form?: string;
};

export type DetailTableRow = {
  team: string;
  rank?: string;
  points?: string;
  played?: string;
};

export type MatchDetail = {
  eventId: string;
  league: string;
  homeName: string;
  awayName: string;
  homeScore: string;
  awayScore: string;
  kickoff?: string;
  status?: string;
  venue?: string;
  summary: string[];
  h2h: string[];
  stats: DetailStat[];
  lineups: DetailLineup[];
  table: DetailTableRow[];
  isPredictedLineup: boolean;
};
