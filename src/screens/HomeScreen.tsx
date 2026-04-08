import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AVAILABLE_LEAGUES, fetchTop5LiveScores } from '../services/livescore';
import { RootStackParamList } from '../../App';
import { LeagueKey, LeagueMatches, MatchItem } from '../types/livescore';
import { useI18n } from '../i18n';
import { FavoriteTeam, getFavoriteTeams, toggleFavoriteTeam } from '../services/favorites';
import { syncFavoriteMatchNotifications } from '../services/notifications';
import { safeToLocaleDateString, safeToLocaleString } from '../utils/dateTime';

const REFRESH_INTERVAL_MS = 60_000;
const DEFAULT_LEAGUES: LeagueKey[] = ['uefa.champions', 'eng.1', 'esp.1', 'ger.1', 'ita.1'];

const toKickoff = (value: string, dateLocale: string, timeZone: string): string => {
  if (!value) return '--';
  return safeToLocaleString(value, dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    timeZone,
  });
};

const formatDayLabel = (value: Date, dateLocale: string, timeZone: string): string =>
  safeToLocaleDateString(value, dateLocale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone,
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
      return { backgroundColor: '#F97316', color: '#FFFFFF', label: upcomingLabel };
  }
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { t, locale, dateLocale, timeZone } = useI18n();
  const [data, setData] = useState<LeagueMatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarAnchor, setCalendarAnchor] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLeagues, setSelectedLeagues] = useState<LeagueKey[]>(DEFAULT_LEAGUES);
  const [leagueMenuOpen, setLeagueMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([]);

  useEffect(() => {
    const loadFavorites = async () => {
      const teams = await getFavoriteTeams();
      setFavorites(teams);
    };
    void loadFavorites();
  }, []);

  const load = useCallback(async (targetDate: Date, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);
    try {
      const next = await fetchTop5LiveScores(targetDate, locale, selectedLeagues);
      setData(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.home.loadErrorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locale, selectedLeagues, t.home.loadErrorMessage]);

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
  const allMatches = useMemo(() => data.flatMap((league) => league.matches), [data]);
  const favoriteIds = useMemo(() => new Set(favorites.map((item) => item.id)), [favorites]);

  const calendarDays = useMemo(() => buildCalendarDays(calendarAnchor), [calendarAnchor]);

  useEffect(() => {
    void syncFavoriteMatchNotifications(allMatches, favorites, locale);
  }, [allMatches, favorites, locale]);

  const handleToggleFavorite = useCallback(
    async (team: FavoriteTeam) => {
      const next = await toggleFavoriteTeam(team);
      setFavorites(next);
    },
    [],
  );

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
          {t.home.viewingDate}: {safeToLocaleDateString(selectedDate, dateLocale, { timeZone })} • {t.common.live}:{' '}
          {liveCount}
        </Text>
      </View>

      <View style={styles.selectCard}>
        <Pressable
          style={styles.selectBtn}
          onPress={() => setLeagueMenuOpen((prev) => !prev)}
          accessibilityLabel={t.home.leagueSelectOpen}
        >
          <Text style={styles.selectBtnText}>
            {t.home.leagueSelectLabel} • {t.home.selectedCount}: {selectedLeagues.length}
          </Text>
        </Pressable>

        {leagueMenuOpen && (
          <View style={styles.selectMenu}>
            {AVAILABLE_LEAGUES.map((leagueKey) => {
              const checked = selectedLeagues.includes(leagueKey);
              return (
                <Pressable
                  key={leagueKey}
                  style={styles.selectOption}
                  onPress={() =>
                    setSelectedLeagues((prev) => {
                      if (checked) {
                        const next = prev.filter((item) => item !== leagueKey);
                        return next.length > 0 ? next : prev;
                      }
                      return [...prev, leagueKey];
                    })
                  }
                >
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    <Text style={styles.checkboxText}>{checked ? '✓' : ''}</Text>
                  </View>
                  <Text style={styles.selectOptionText}>{t.league[leagueKey]}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.favoriteCard}>
        <Text style={styles.favoriteTitle}>{t.home.myFavorites}</Text>
        {favorites.length === 0 ? (
          <Text style={styles.emptyText}>{t.common.noData}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favoriteRow}>
            {favorites.map((team) => (
              <Pressable
                key={team.id}
                style={styles.favoriteChip}
                accessibilityLabel={t.home.openTeamSchedule}
                onPress={() =>
                  navigation.navigate('TeamSchedule', {
                    teamId: team.id,
                    teamName: team.name,
                    league: team.league,
                  })
                }
              >
                {team.logo ? <Image source={{ uri: team.logo }} style={styles.favoriteLogo} /> : null}
                <Text style={styles.favoriteChipText}>{team.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
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
                  {formatDayLabel(day, dateLocale, timeZone)}
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
                    <View style={styles.teamLine}>
                      <Pressable
                        onPress={() =>
                          navigation.navigate('TeamPlayers', {
                            teamId: match.homeTeamId,
                            teamName: match.homeName,
                            league: match.league,
                          })
                        }
                        disabled={!match.homeTeamId}
                      >
                        <Text style={styles.team}>{match.homeName}</Text>
                      </Pressable>
                      <Pressable
                        style={styles.starBtn}
                        accessibilityLabel={
                          favoriteIds.has(match.homeTeamId) ? t.home.removeFavorite : t.home.addFavorite
                        }
                        onPress={() =>
                          void handleToggleFavorite({
                            id: match.homeTeamId,
                            name: match.homeName,
                            league: match.league,
                            logo: match.homeLogo,
                          })
                        }
                        disabled={!match.homeTeamId}
                      >
                        <Text style={styles.starText}>{favoriteIds.has(match.homeTeamId) ? '★' : '☆'}</Text>
                      </Pressable>
                    </View>
                    <View style={styles.teamLine}>
                      <Pressable
                        onPress={() =>
                          navigation.navigate('TeamPlayers', {
                            teamId: match.awayTeamId,
                            teamName: match.awayName,
                            league: match.league,
                          })
                        }
                        disabled={!match.awayTeamId}
                      >
                        <Text style={styles.team}>{match.awayName}</Text>
                      </Pressable>
                      <Pressable
                        style={styles.starBtn}
                        accessibilityLabel={
                          favoriteIds.has(match.awayTeamId) ? t.home.removeFavorite : t.home.addFavorite
                        }
                        onPress={() =>
                          void handleToggleFavorite({
                            id: match.awayTeamId,
                            name: match.awayName,
                            league: match.league,
                            logo: match.awayLogo,
                          })
                        }
                        disabled={!match.awayTeamId}
                      >
                        <Text style={styles.starText}>{favoriteIds.has(match.awayTeamId) ? '★' : '☆'}</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.kickoff}>
                      {toKickoff(match.kickoff, dateLocale, timeZone)} • {match.statusText}
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
    borderRadius: 4,
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
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 10,
  },
  selectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 10,
    gap: 8,
  },
  selectBtn: {
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  selectMenu: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectOptionText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '600',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  checkboxText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 13,
  },
  calendarTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    borderRadius: 4,
    padding: 10,
  },
  favoriteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 10,
    gap: 8,
  },
  favoriteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  favoriteRow: {
    gap: 8,
  },
  favoriteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
  },
  favoriteLogo: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  favoriteChipText: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    minWidth: 62,
    borderRadius: 4,
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
  teamLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  team: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  starBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  starText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 16,
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
