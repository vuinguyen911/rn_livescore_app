import AsyncStorage from '@react-native-async-storage/async-storage';
import { LeagueKey } from '../types/livescore';
import { STORAGE_KEYS } from '../config/storage';

export type FavoriteTeam = {
  id: string;
  name: string;
  league: LeagueKey;
  logo?: string;
};

export const getFavoriteTeams = async (): Promise<FavoriteTeam[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.favoriteTeams);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteTeam[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveFavoriteTeams = async (teams: FavoriteTeam[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.favoriteTeams, JSON.stringify(teams));
  } catch {
    // ignore write errors and keep app responsive
  }
};

export const toggleFavoriteTeam = async (team: FavoriteTeam): Promise<FavoriteTeam[]> => {
  const current = await getFavoriteTeams();
  const exists = current.some((item) => item.id === team.id);
  const next = exists ? current.filter((item) => item.id !== team.id) : [...current, team];
  await saveFavoriteTeams(next);
  return next;
};
