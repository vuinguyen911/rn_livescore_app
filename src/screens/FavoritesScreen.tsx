import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { FavoriteTeam, getFavoriteTeams } from '../services/favorites';
import { colors, radius, shadows, spacing } from '../theme/tokens';

export default function FavoritesScreen() {
  const { t } = useI18n();
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([]);

  useEffect(() => {
    const load = async () => {
      const teams = await getFavoriteTeams();
      setFavorites(teams);
    };
    void load();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t.home.myFavorites}</Text>
        <Text style={styles.heroSub}>Saved teams: {favorites.length}</Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t.common.noData}</Text>
        </View>
      ) : (
        favorites.map((team) => (
          <View key={team.id} style={styles.row}>
            {team.logo ? <Image source={{ uri: team.logo }} style={styles.logo} /> : <View style={styles.logo} />}
            <View style={styles.col}>
              <Text style={styles.name}>{team.name}</Text>
              <Text style={styles.league}>{t.league[team.league]}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  heroTitle: { color: colors.white, fontSize: 18, fontWeight: '800' },
  heroSub: { color: colors.surfaceBorder, marginTop: 4, fontSize: 12, fontWeight: '600' },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
  },
  emptyText: { color: colors.textMuted, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
    ...shadows.sm,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
  },
  col: { flex: 1 },
  name: { color: colors.text, fontSize: 14, fontWeight: '700' },
  league: { color: colors.textMuted, marginTop: 2, fontSize: 12 },
});
