import AsyncStorage from '@react-native-async-storage/async-storage';
import { LeagueKey } from '../types/livescore';

const FAVORITES_KEY = 'favorite_teams_v1';

export type FavoriteTeam = {
  id: string;
  name: string;
  league: LeagueKey;
  logo?: string;
};

export const getFavoriteTeams = async (): Promise<FavoriteTeam[]> => {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteTeam[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveFavoriteTeams = async (teams: FavoriteTeam[]): Promise<void> => {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(teams));
};

export const toggleFavoriteTeam = async (team: FavoriteTeam): Promise<FavoriteTeam[]> => {
  const current = await getFavoriteTeams();
  const exists = current.some((item) => item.id === team.id);
  const next = exists ? current.filter((item) => item.id !== team.id) : [...current, team];
  await saveFavoriteTeams(next);
  return next;
};

