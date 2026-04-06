import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { fetchMatchDetail } from '../services/matchDetail';
import { MatchDetail } from '../types/matchDetail';
import { useI18n } from '../i18n';

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
        <ActivityIndicator size="large" color="#1D4ED8" />
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
          {detail.status || '--'}{' '}
          {detail.kickoff ? `• ${new Date(detail.kickoff).toLocaleString(dateLocale, { timeZone })}` : ''}
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
    padding: 20,
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
  },
  scoreCard: {
    backgroundColor: '#0F172A',
    borderRadius: 4,
    padding: 14,
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
    color: '#BFDBFE',
    fontSize: 12,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bodyText: {
    color: '#334155',
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
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6,
  },
  statCell: {
    width: 70,
    color: '#0F172A',
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
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 10,
    gap: 6,
  },
  lineupTeam: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  predicted: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  playerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
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
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 12,
  },
  tableTeam: {
    flex: 1,
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  tablePts: {
    color: '#475569',
    fontSize: 12,
  },
});
