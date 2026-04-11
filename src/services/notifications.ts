import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { MatchItem } from '../types/livescore';
import { FavoriteTeam } from './favorites';
import { STORAGE_KEYS } from '../config/storage';
import { Locale } from '../i18n/translations';
const OFFSETS_MS = [3 * 24 * 60 * 60 * 1000, 24 * 60 * 60 * 1000, 12 * 60 * 60 * 1000, 60 * 60 * 1000];

type ScheduledMap = Record<string, string>;

const readScheduledMap = async (): Promise<ScheduledMap> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.scheduledNotifications);
    if (!raw) return {};
    return JSON.parse(raw) as ScheduledMap;
  } catch {
    return {};
  }
};

const saveScheduledMap = async (value: ScheduledMap) =>
  AsyncStorage.setItem(STORAGE_KEYS.scheduledNotifications, JSON.stringify(value));

const makeLeadText = (offset: number, locale: Locale) => {
  if (offset === OFFSETS_MS[0]) return locale === 'vi' ? '3 ngày nữa' : '3日後';
  if (offset === OFFSETS_MS[1]) return locale === 'vi' ? '1 ngày nữa' : '1日後';
  if (offset === OFFSETS_MS[2]) return locale === 'vi' ? '12 giờ nữa' : '12時間後';
  return locale === 'vi' ? '1 giờ nữa' : '1時間後';
};

export const ensureNotificationPermissions = async () => {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return true;
    const req = await Notifications.requestPermissionsAsync();
    return !!req.granted;
  } catch {
    return false;
  }
};

export const configureNotifications = async () => {
  try {
    await Notifications.setNotificationChannelAsync('match-reminders', {
      name: 'Match reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1D4ED8',
    });
  } catch {
    // ignore notification channel setup failures to prevent app crash
  }
};

export const syncFavoriteMatchNotifications = async (
  matches: MatchItem[],
  favorites: FavoriteTeam[],
  locale: Locale,
) => {
  try {
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
            title: locale === 'vi' ? 'Nhắc lịch trận đấu' : '試合リマインダー',
            body:
              locale === 'vi'
                ? `${match.homeName} vs ${match.awayName} sẽ diễn ra ${makeLeadText(offset, locale)}.`
                : `${match.homeName} vs ${match.awayName} は${makeLeadText(offset, locale)}に開始します。`,
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
  } catch {
    // ignore notification sync failures to keep app stable
  }
};
