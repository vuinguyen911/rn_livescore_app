export const API_CONFIG = {
  rss: {
    sports: 'https://vnexpress.net/rss/the-thao.rss',
  },
  espn: {
    base: 'https://site.api.espn.com/apis/site/v2/sports/soccer',
  },
} as const;

export const API_ENDPOINTS = {
  scoreboard: (league: string, date: string) =>
    `${API_CONFIG.espn.base}/${league}/scoreboard?dates=${date}`,
  matchSummary: (league: string, eventId: string) =>
    `${API_CONFIG.espn.base}/${league}/summary?event=${eventId}`,
  teamSchedule: (league: string, teamId: string) =>
    `${API_CONFIG.espn.base}/${league}/teams/${teamId}/schedule`,
  teamDetail: (league: string, teamId: string) =>
    `${API_CONFIG.espn.base}/${league}/teams/${teamId}`,
  teamRoster: (league: string, teamId: string) =>
    `${API_CONFIG.espn.base}/${league}/teams/${teamId}/roster`,
  athleteDetail: (league: string, athleteId: string) =>
    `${API_CONFIG.espn.base}/${league}/athletes/${athleteId}`,
  athleteSearch: (league: string, name: string) =>
    `${API_CONFIG.espn.base}/${league}/athletes?search=${encodeURIComponent(name)}`,
} as const;

