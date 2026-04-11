import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AVAILABLE_LEAGUES } from '../services/livescore';
import { useI18n } from '../i18n';
import { colors, radius, shadows, spacing } from '../theme/tokens';

export default function LeaguesScreen() {
  const { t } = useI18n();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t.home.leagueSelectLabel}</Text>
        <Text style={styles.heroSub}>Marketplace-style catalog</Text>
      </View>

      <View style={styles.grid}>
        {AVAILABLE_LEAGUES.map((league) => (
          <View key={league} style={styles.card}>
            <Text style={styles.cardTitle}>{t.league[league]}</Text>
            <Text style={styles.cardSub}>Live feed available</Text>
          </View>
        ))}
      </View>
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
  grid: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  cardSub: { color: colors.textMuted, marginTop: 3, fontSize: 12 },
});
