import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useI18n } from '../i18n';
import { TeamPlayer } from '../types/teamPlayers';
import { fetchTeamPlayersWithInjuries } from '../services/teamPlayers';

type Props = NativeStackScreenProps<RootStackParamList, 'TeamPlayers'>;

export default function TeamPlayersScreen({ route, navigation }: Props) {
  const { teamId, teamName, league } = route.params;
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<TeamPlayer[]>([]);

  useEffect(() => {
    navigation.setOptions({ title: teamName });
  }, [navigation, teamName]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const next = await fetchTeamPlayersWithInjuries(league, teamId, locale);
      setPlayers(next);
      setLoading(false);
    };
    void load();
  }, [league, teamId, locale]);

  const injuredCount = useMemo(() => players.filter((p) => p.injured).length, [players]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{t.team.playersTitle}</Text>
        <Text style={styles.headerSub}>
          {t.team.totalPlayers}: {players.length} • {t.team.injuredPlayers}: {injuredCount}
        </Text>
      </View>

      {players.length === 0 ? (
        <Text style={styles.empty}>{t.team.noPlayers}</Text>
      ) : (
        players.map((player, idx) => (
          <View key={`${player.id || player.name}-${idx}`} style={styles.playerRow}>
            {player.avatar ? <Image source={{ uri: player.avatar }} style={styles.avatar} /> : null}
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.meta}>
                {player.position || '-'} • #{player.number || '-'}
              </Text>
              <Text style={[styles.injury, player.injured ? styles.injuryBad : styles.injuryGood]}>
                {player.injured ? `${t.team.injuryStatus}: ${player.injuryStatus || t.team.injuryUnknown}` : t.team.noInjury}
              </Text>
            </View>
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
  headerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 4,
    padding: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    color: '#BFDBFE',
    fontSize: 12,
    marginTop: 4,
  },
  empty: {
    color: '#475569',
    fontSize: 13,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  injury: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  injuryGood: {
    color: '#166534',
  },
  injuryBad: {
    color: '#B91C1C',
  },
});
