import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { fetchMatchDetail } from '../services/matchDetail';
import { MatchDetail } from '../types/matchDetail';
import { useI18n } from '../i18n';
import { safeToLocaleString } from '../utils/dateTime';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchDetail'>;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export default function MatchDetailScreen({ route, navigation }: Props) {
  const { t, locale, dateLocale, timeZone } = useI18n();
  const { eventId, league, homeName, awayName } = route.params;
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: `${homeName} vs ${awayName}` });
  }, [navigation, homeName, awayName]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchMatchDetail(league, eventId, locale, timeZone);
        setDetail(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : t.detail.loadErrorMessage);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [eventId, league, locale, timeZone, t.detail.loadErrorMessage]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.statusText}>{t.detail.loading}</Text>
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>{t.detail.loadErrorTitle}</Text>
        <Text style={styles.errorText}>{error || t.common.noData}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.scoreCard}>
        <Text style={styles.matchTitle}>{detail.homeName} vs {detail.awayName}</Text>
        <Text style={styles.scoreLine}>{detail.homeScore} - {detail.awayScore}</Text>
        <Text style={styles.meta}>
          {detail.status || '--'} {detail.kickoff ? `• ${safeToLocaleString(detail.kickoff, dateLocale, { timeZone })}` : ''}
        </Text>
      </View>

      <Section title={t.detail.sectionVenue}>
        <Text style={styles.bodyText}>{detail.venue || t.detail.venueMissing}</Text>
      </Section>

      <Section title={t.detail.sectionSummary}>
        {detail.summary.map((line, idx) => (
          <Text key={`${line}-${idx}`} style={styles.bodyText}>• {line}</Text>
        ))}
      </Section>

      <Section title={t.detail.sectionH2H}>
        {detail.h2h.map((line, idx) => (
          <Text key={`${line}-${idx}`} style={styles.bodyText}>• {line}</Text>
        ))}
      </Section>

      <Section title={t.detail.sectionStats}>
        {detail.stats.length === 0 ? (
          <Text style={styles.muted}>{t.detail.statsMissing}</Text>
        ) : (
          detail.stats.map((row) => (
            <View key={row.label} style={styles.rowBetween}>
              <Text style={styles.statCell}>{row.home}</Text>
              <Text style={[styles.statCell, styles.statLabel]}>{row.label}</Text>
              <Text style={[styles.statCell, styles.statRight]}>{row.away}</Text>
            </View>
          ))
        )}
      </Section>

      <Section title={t.detail.sectionLineup}>
        {detail.isPredictedLineup ? <Text style={styles.predicted}>{t.detail.predictedLineup}</Text> : null}
        {detail.lineups.length === 0 ? (
          <Text style={styles.muted}>{t.detail.lineupMissing}</Text>
        ) : (
          detail.lineups.map((lu) => (
            <View key={lu.team} style={styles.lineupCard}>
              <Text style={styles.lineupTeam}>{lu.team}</Text>
              {lu.players.length === 0 ? (
                <Text style={styles.bodyText}>{t.detail.lineupPlayersMissing}</Text>
              ) : (
                lu.players.map((player, idx) => (
                  <Pressable
                    key={`${lu.team}-${player.name}-${idx}`}
                    style={styles.playerRow}
                    onPress={() =>
                      navigation.navigate('PlayerDetail', {
                        league,
                        playerId: player.id,
                        playerName: player.name,
                        avatar: player.avatar,
                        form: player.form,
                        position: player.position,
                      })
                    }
                  >
                    {player.avatar ? <Image source={{ uri: player.avatar }} style={styles.playerAvatar} /> : null}
                    <View style={styles.playerCol}>
                      <Text style={styles.bodyText}>{player.name}</Text>
                      <Text style={styles.playerForm}>
                        {t.detail.playerForm}: {player.form || t.detail.noPlayerForm}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          ))
        )}
      </Section>

      <Section title={t.detail.sectionTable}>
        {detail.table.length === 0 ? (
          <Text style={styles.muted}>{t.detail.tableMissing}</Text>
        ) : (
          detail.table.map((row, idx) => (
            <View key={`${row.team}-${idx}`} style={styles.rowBetween}>
              <Text style={styles.tableRank}>{row.rank || '-'}</Text>
              <Text style={styles.tableTeam}>{row.team}</Text>
              <Text style={styles.tablePts}>
                {t.detail.playedLabel}: {row.played || '-'} | {t.detail.pointsLabel}: {row.points || '-'}
              </Text>
            </View>
          ))
        )}
      </Section>
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
    gap: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
  },
  statusText: {
    color: '#1E3A8A',
    fontSize: 15,
  },
  errorTitle: {
    color: '#1D4ED8',
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: '#1E3A8A',
    fontSize: 14,
    textAlign: 'center',
  },
  scoreCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  matchTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  scoreLine: {
    color: '#93C5FD',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  meta: {
    color: '#D6E4FF',
    fontSize: 12,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#EAF2FF',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  bodyText: {
    color: '#1E3A8A',
    fontSize: 13,
    lineHeight: 19,
  },
  muted: {
    color: '#64748B',
    fontSize: 13,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D6E4FF',
    paddingVertical: 6,
  },
  statCell: {
    width: 70,
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '700',
  },
  statLabel: {
    flex: 1,
    textAlign: 'center',
    color: '#475569',
    fontWeight: '600',
  },
  statRight: {
    textAlign: 'right',
  },
  lineupCard: {
    borderWidth: 1,
    borderColor: '#D6E4FF',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  lineupTeam: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '800',
  },
  predicted: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#D6E4FF',
  },
  playerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D6E4FF',
  },
  playerCol: {
    flex: 1,
  },
  playerForm: {
    color: '#64748B',
    fontSize: 11,
  },
  tableRank: {
    width: 32,
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 12,
  },
  tableTeam: {
    flex: 1,
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: 13,
  },
  tablePts: {
    color: '#475569',
    fontSize: 12,
  },
});
