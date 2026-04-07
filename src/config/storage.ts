export const STORAGE_KEYS = {
  favoriteTeams: 'favorite_teams_v1',
  scheduledNotifications: 'scheduled_notifications_v1',
  timezoneOption: 'timezone_option_v1',
} as const;

export const CACHE_TTL = {
  liveScore: 2 * 60 * 1000,
  matchDetail: 5 * 60 * 1000,
  teamSchedule: 10 * 60 * 1000,
  teamPlayers: 15 * 60 * 1000,
  playerDetail: 30 * 60 * 1000,
} as const;

