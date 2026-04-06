import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { TeamFixture } from '../types/teamSchedule';
import { fetchTeamUpcomingSchedule } from '../services/teamSchedule';
import { useI18n } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'TeamSchedule'>;

export default function TeamScheduleScreen({ route, navigation }: Props) {
  const { teamId, teamName, league } = route.params;
  const { t, locale, dateLocale } = useI18n();
  const [fixtures, setFixtures] = useState<TeamFixture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: teamName });
  }, [navigation, teamName]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const next = await fetchTeamUpcomingSchedule(league, teamId, locale);
      setFixtures(next);
      setLoading(false);
    };
    void load();
  }, [teamId, league, locale]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.team.upcomingMatches}</Text>
      {fixtures.length === 0 ? (
        <Text style={styles.empty}>{t.team.noUpcoming}</Text>
      ) : (
        fixtures.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.match}>{item.homeName} vs {item.awayName}</Text>
            <Text style={styles.meta}>
              {item.kickoff ? new Date(item.kickoff).toLocaleString(dateLocale) : '--'} • {item.status || '--'}
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
    backgroundColor: '#EEF2FF',
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
    color: '#0F172A',
  },
  empty: {
    color: '#475569',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  match: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
  },
  meta: {
    color: '#64748B',
    fontSize: 12,
  },
  score: {
    color: '#1D4ED8',
    fontWeight: '800',
    fontSize: 18,
  },
});

