import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing } from '../theme/tokens';

const rows = [
  { key: 'plan', label: 'Plan', value: 'Pro Preview' },
  { key: 'region', label: 'Region', value: 'Asia/Tokyo' },
  { key: 'sync', label: 'Sync', value: 'Realtime 60s' },
  { key: 'build', label: 'Build mode', value: 'Marketplace Phase 2' },
];

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Profile</Text>
        <Text style={styles.heroSub}>Factory mode UI system</Text>
      </View>

      <View style={styles.card}>
        {rows.map((row, idx) => (
          <View key={row.key} style={[styles.row, idx === rows.length - 1 && styles.rowLast]}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowLast: { borderBottomWidth: 0 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  value: { color: colors.text, fontSize: 13, fontWeight: '700' },
});
