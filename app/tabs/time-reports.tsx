import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../src/theme';
import { getTimeReports } from '../../src/services/time-report.service';

export default function TimeReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    getTimeReports()
      .then(setReports)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []));

  const formatWeek = (weekStart: string) => {
    const d = new Date(weekStart);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  if (loading) return (
    <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Time Reports</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push('/time-report/new')}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <FlatList
        data={reports}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>No time reports yet</Text>
            <Text style={styles.emptyText}>Tap + to create your first weekly time report</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(`/time-report/${item.id}`)}
          >
            <View style={styles.cardLeft}>
              <Ionicons name="calendar-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.weekLabel}>{formatWeek(item.weekStart)}</Text>
              <Text style={styles.empCount}>{item.employees?.length ?? 0} employee(s)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textCaption} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  title: { fontSize: 22, fontWeight: '700', color: colors.textDark },
  addBtn: { backgroundColor: colors.primary, borderRadius: 20, padding: 6 },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeft: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  weekLabel: { fontSize: 15, fontWeight: '600', color: colors.textDark },
  empCount: { fontSize: 12, color: colors.textCaption, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.textDark },
  emptyText: { fontSize: 14, color: colors.textCaption, textAlign: 'center' },
});
