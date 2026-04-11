import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { TeamFixture } from '../types/teamSchedule';
import { fetchTeamUpcomingSchedule } from '../services/teamSchedule';
import { useI18n } from '../i18n';
import { safeToLocaleString } from '../utils/dateTime';

type Props = NativeStackScreenProps<RootStackParamList, 'TeamSchedule'>;

export default function TeamScheduleScreen({ route, navigation }: Props) {
  const { teamId, teamName, league } = route.params;
  const { t, locale, dateLocale, timeZone } = useI18n();
  const [fixtures, setFixtures] = useState<TeamFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: teamName });
  }, [navigation, teamName]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await fetchTeamUpcomingSchedule(league, teamId, locale);
        setFixtures(next);
      } catch {
        setError(t.team.noUpcoming);
        setFixtures([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [teamId, league, locale, t.team.noUpcoming]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{t.team.upcomingMatches}</Text>
        <Text style={styles.subtitle}>#{fixtures.length}</Text>
      </View>
      {error ? <Text style={styles.empty}>{error}</Text> : null}
      {fixtures.length === 0 ? (
        <Text style={styles.empty}>{t.team.noUpcoming}</Text>
      ) : (
        fixtures.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.match}>{item.homeName} vs {item.awayName}</Text>
            <Text style={styles.meta}>
              {item.kickoff ? safeToLocaleString(item.kickoff, dateLocale, { timeZone }) : '--'} • {item.status || '--'}
            </Text>
            {item.homeScore || item.awayScore ? (
              <Text style={styles.score}>{item.homeScore || '-'} - {item.awayScore || '-'}</Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    color: '#D6E4FF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  empty: {
    color: '#475569',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D6E4FF',
    gap: 4,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  match: {
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: 14,
  },
  meta: {
    color: '#64748B',
    fontSize: 12,
  },
  score: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 18,
  },
});
