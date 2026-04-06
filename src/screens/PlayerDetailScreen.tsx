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
      const fallback: PlayerDetail = {
        id: playerId,
        name: playerName,
        avatar,
        form,
        position,
      };
      const next = await fetchPlayerDetail(league, locale, fallback);
      setDetail(next);
      setLoading(false);
    };
    void load();
  }, [league, playerId, playerName, avatar, form, position, locale]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        <Text style={styles.note}>{t.player.privacyNote}</Text>
      </View>
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
  },
  header: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B',
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
    color: '#BFDBFE',
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6,
  },
  infoLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  note: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
});

