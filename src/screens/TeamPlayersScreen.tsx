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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: teamName });
  }, [navigation, teamName]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await fetchTeamPlayersWithInjuries(league, teamId, locale);
        setPlayers(next);
      } catch {
        setError(t.team.noPlayers);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [league, teamId, locale, t.team.noPlayers]);

  const injuredCount = useMemo(() => players.filter((p) => p.injured).length, [players]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.empty}>{error}</Text> : null}
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    color: '#D6E4FF',
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D6E4FF',
    padding: 12,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D6E4FF',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#1E3A8A',
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
    color: '#64748B',
  },
});
