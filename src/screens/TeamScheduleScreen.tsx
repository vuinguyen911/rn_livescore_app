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
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.team.upcomingMatches}</Text>
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
    backgroundColor: '#FFF5F5',
  },
  content: {
    padding: 12,
    gap: 10,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7F1D1D',
  },
  empty: {
    color: '#9F1239',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 4,
  },
  match: {
    color: '#7F1D1D',
    fontWeight: '700',
    fontSize: 14,
  },
  meta: {
    color: '#B91C1C',
    fontSize: 12,
  },
  score: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 18,
  },
});
