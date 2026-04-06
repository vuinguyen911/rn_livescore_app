import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { MatchItem } from '../types/livescore';
import { FavoriteTeam } from './favorites';

const SCHEDULED_MAP_KEY = 'scheduled_notifications_v1';
const OFFSETS_MS = [3 * 24 * 60 * 60 * 1000, 24 * 60 * 60 * 1000, 12 * 60 * 60 * 1000, 60 * 60 * 1000];

type ScheduledMap = Record<string, string>;

const readScheduledMap = async (): Promise<ScheduledMap> => {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULED_MAP_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ScheduledMap;
  } catch {
    return {};
  }
};

const saveScheduledMap = async (value: ScheduledMap) =>
  AsyncStorage.setItem(SCHEDULED_MAP_KEY, JSON.stringify(value));

const makeLeadText = (offset: number, locale: 'vi' | 'en') => {
  if (offset === OFFSETS_MS[0]) return locale === 'vi' ? '3 ngày nữa' : 'in 3 days';
  if (offset === OFFSETS_MS[1]) return locale === 'vi' ? '1 ngày nữa' : 'in 1 day';
  if (offset === OFFSETS_MS[2]) return locale === 'vi' ? '12 giờ nữa' : 'in 12 hours';
  return locale === 'vi' ? '1 giờ nữa' : 'in 1 hour';
};

export const ensureNotificationPermissions = async () => {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return true;
  const req = await Notifications.requestPermissionsAsync();
  return !!req.granted;
};

export const configureNotifications = async () => {
  await Notifications.setNotificationChannelAsync('match-reminders', {
    name: 'Match reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1D4ED8',
  });
};

export const syncFavoriteMatchNotifications = async (
  matches: MatchItem[],
  favorites: FavoriteTeam[],
  locale: 'vi' | 'en',
) => {
  if (favorites.length === 0) return;
  const allowed = await ensureNotificationPermissions();
  if (!allowed) return;

  const favoriteIds = new Set(favorites.map((item) => item.id));
  const upcoming = matches.filter((match) => {
    const kickoff = new Date(match.kickoff).getTime();
    if (!Number.isFinite(kickoff) || kickoff <= Date.now()) return false;
    return favoriteIds.has(match.homeTeamId) || favoriteIds.has(match.awayTeamId);
  });

  if (upcoming.length === 0) return;

  const map = await readScheduledMap();
  const nextMap: ScheduledMap = { ...map };

  for (const match of upcoming) {
    const kickoff = new Date(match.kickoff).getTime();
    for (const offset of OFFSETS_MS) {
      const fireAt = kickoff - offset;
      if (fireAt <= Date.now()) continue;
      const uniqueKey = `${match.id}:${offset}`;
      if (nextMap[uniqueKey]) continue;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: locale === 'vi' ? 'Nhắc lịch trận đấu' : 'Match reminder',
          body:
            locale === 'vi'
              ? `${match.homeName} vs ${match.awayName} sẽ diễn ra ${makeLeadText(offset, locale)}.`
              : `${match.homeName} vs ${match.awayName} starts ${makeLeadText(offset, locale)}.`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(fireAt),
          channelId: 'match-reminders',
        },
      });
      nextMap[uniqueKey] = id;
    }
  }

  await saveScheduledMap(nextMap);
};

