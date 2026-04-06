import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchTop5LiveScores } from '../services/livescore';
import { RootStackParamList } from '../../App';
import { LeagueMatches, MatchItem } from '../types/livescore';
import { useI18n } from '../i18n';

const REFRESH_INTERVAL_MS = 60_000;

const toKickoff = (value: string, dateLocale: string): string => {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleString(dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
};

const formatDayLabel = (value: Date, dateLocale: string): string =>
  value.toLocaleDateString(dateLocale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });

const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const addDays = (date: Date, delta: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
};

const buildCalendarDays = (anchor: Date): Date[] => {
  const list: Date[] = [];
  for (let i = -7; i <= 7; i += 1) {
    list.push(addDays(anchor, i));
  }
  return list;
};

const statusBadgeStyle = (status: MatchItem['status'], upcomingLabel: string) => {
  switch (status) {
    case 'LIVE':
      return { backgroundColor: '#DC2626', color: '#FFFFFF', label: 'LIVE' };
    case 'FT':
      return { backgroundColor: '#334155', color: '#FFFFFF', label: 'FT' };
    default:
      return { backgroundColor: '#E2E8F0', color: '#0F172A', label: upcomingLabel };
  }
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { t, locale, dateLocale } = useI18n();
  const [data, setData] = useState<LeagueMatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarAnchor, setCalendarAnchor] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const load = useCallback(async (targetDate: Date, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);
    try {
      const next = await fetchTop5LiveScores(targetDate, locale);
      setData(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.home.loadErrorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locale, t.home.loadErrorMessage]);

  useEffect(() => {
    void load(selectedDate);
  }, [load, selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => {
      void load(selectedDate, true);
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load, selectedDate]);

  const liveCount = useMemo(
    () => data.flatMap((league) => league.matches).filter((match) => match.status === 'LIVE').length,
    [data],
  );

  const calendarDays = useMemo(() => buildCalendarDays(calendarAnchor), [calendarAnchor]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.statusText}>{t.home.loading}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>{t.home.loadErrorTitle}</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(selectedDate, true)} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{t.home.headerTitle}</Text>
        <Text style={styles.headerSub}>
          {t.home.viewingDate}: {selectedDate.toLocaleDateString(dateLocale)} • {t.common.live}: {liveCount}
        </Text>
      </View>

      <View style={styles.calendarWrap}>
        <View style={styles.calendarTopBar}>
          <Pressable style={styles.navBtn} onPress={() => setCalendarAnchor(addDays(calendarAnchor, -7))}>
            <Text style={styles.navBtnText}>{t.home.prev7Days}</Text>
          </Pressable>
          <Pressable
            style={styles.todayBtn}
            onPress={() => {
              const now = new Date();
              setCalendarAnchor(now);
              setSelectedDate(now);
            }}
          >
            <Text style={styles.todayBtnText}>{t.common.today}</Text>
          </Pressable>
          <Pressable style={styles.navBtn} onPress={() => setCalendarAnchor(addDays(calendarAnchor, 7))}>
            <Text style={styles.navBtnText}>{t.home.next7Days}</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarRow}>
          {calendarDays.map((day) => {
            const selected = sameDay(day, selectedDate);
            return (
              <Pressable
                key={day.toISOString()}
                style={[styles.dayPill, selected && styles.dayPillActive]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[styles.dayText, selected && styles.dayTextActive]}>
                  {formatDayLabel(day, dateLocale)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {data.map((league) => (
        <View key={league.league} style={styles.leagueCard}>
          <Text style={styles.leagueTitle}>{league.title}</Text>
          {league.matches.length === 0 ? (
            <Text style={styles.emptyText}>{t.home.noMatchInDay}</Text>
          ) : (
            league.matches.map((match) => {
              const badge = statusBadgeStyle(match.status, t.common.upcoming);
              return (
                <Pressable
                  key={match.id}
                  style={styles.matchRow}
                  onPress={() =>
                    navigation.navigate('MatchDetail', {
                      eventId: match.id,
                      league: match.league,
                      homeName: match.homeName,
                      awayName: match.awayName,
                    })
                  }
                >
                  <View style={[styles.badge, { backgroundColor: badge.backgroundColor }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{match.minute || badge.label}</Text>
                  </View>

                  <View style={styles.teamsCol}>
                    <Text style={styles.team}>{match.homeName}</Text>
                    <Text style={styles.team}>{match.awayName}</Text>
                    <Text style={styles.kickoff}>
                      {toKickoff(match.kickoff, dateLocale)} • {match.statusText}
                    </Text>
                  </View>

                  <View style={styles.scoreCol}>
                    <Text style={styles.score}>{match.homeScore}</Text>
                    <Text style={styles.score}>{match.awayScore}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  content: {
    padding: 12,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusText: {
    color: '#334155',
    fontSize: 15,
  },
  errorTitle: {
    color: '#991B1B',
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: '#7F1D1D',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  headerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: '#BFDBFE',
    fontSize: 13,
    marginTop: 4,
  },
  calendarWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 10,
  },
  calendarTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  navBtnText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  todayBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  todayBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarRow: {
    gap: 8,
    paddingHorizontal: 2,
  },
  dayPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
  },
  dayPillActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  dayText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  leagueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  leagueTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
  },
  badge: {
    minWidth: 62,
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  teamsCol: {
    flex: 1,
    gap: 3,
  },
  team: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  kickoff: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scoreCol: {
    minWidth: 24,
    alignItems: 'flex-end',
    gap: 3,
  },
  score: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
});
