import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useI18n } from '../i18n';
import { fetchPlayerDetail } from '../services/playerDetail';
import { PlayerDetail } from '../types/playerDetail';

type Props = NativeStackScreenProps<RootStackParamList, 'PlayerDetail'>;

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '-'}</Text>
  </View>
);

export default function PlayerDetailScreen({ route, navigation }: Props) {
  const { league, playerId, playerName, avatar, form, position } = route.params;
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlayerDetail>({
    id: playerId,
    name: playerName,
    avatar,
    form,
    position,
  });

  useEffect(() => {
    navigation.setOptions({ title: playerName });
  }, [navigation, playerName]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const fallback: PlayerDetail = {
        id: playerId,
        name: playerName,
        avatar,
        form,
        position,
      };
      try {
        const next = await fetchPlayerDetail(league, locale, fallback);
        setDetail(next);
      } catch {
        setError(t.common.noData);
        setDetail(fallback);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [league, playerId, playerName, avatar, form, position, locale, t.common.noData]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.header}>
        {detail.avatar ? <Image source={{ uri: detail.avatar }} style={styles.avatar} /> : null}
        <View style={styles.headerText}>
          <Text style={styles.name}>{detail.name}</Text>
          <Text style={styles.meta}>{detail.position || '-'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <InfoRow label={t.player.age} value={detail.age} />
        <InfoRow label={t.player.nationality} value={detail.nationality} />
        <InfoRow label={t.player.club} value={detail.club} />
        <InfoRow label={t.player.jersey} value={detail.jersey} />
        <InfoRow label={t.player.height} value={detail.height} />
        <InfoRow label={t.player.weight} value={detail.weight} />
        <InfoRow label={t.player.foot} value={detail.foot} />
        <InfoRow label={t.detail.playerForm} value={detail.form} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.player.publicTransferInfo}</Text>
        <InfoRow label={t.player.marketValue} value={detail.marketValue} />
        <InfoRow label={t.player.contractUntil} value={detail.contractUntil} />
        <InfoRow label={t.player.salary} value={detail.salary} />
      </View>
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
  },
  header: {
    backgroundColor: '#1E3A8A',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1D4ED8',
  },
  headerText: {
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  meta: {
    color: '#D6E4FF',
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  errorText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D6E4FF',
    paddingVertical: 6,
  },
  infoLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
});
