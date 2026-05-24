import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../src/theme';
import { getProjects } from '../../src/services/projects.service';
import { Project } from '../../src/types';
import { EmptyState } from '../../src/components/EmptyState';

export default function ProjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchProjects = useCallback(async (searchTerm?: string) => {
    try {
      const data = await getProjects(searchTerm || undefined);
      setProjects(data ?? []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProjects(search);
    }, [fetchProjects, search]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects(search);
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return dateStr ?? ''; }
  };

  const formatCurrency = (amount: number) => `$${(amount ?? 0).toFixed(2)}`;

  const renderProject = ({ item }: { item: Project }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}
      onPress={() => router.push(`/project/${item?.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Project ${item?.name}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item?.projectNumber ?? ''}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textCaption} />
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{item?.name ?? ''}</Text>
      <Text style={styles.cardDate}>{formatDate(item?.date ?? '')}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.statRow}>
          <Ionicons name="receipt-outline" size={14} color={colors.textCaption} />
          <Text style={styles.statText}>{item?.expenseCount ?? 0} expenses</Text>
        </View>
        <Text style={styles.totalAmount}>{formatCurrency(item?.totalAmount ?? 0)}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Projects</Text>
        <Pressable onPress={() => router.push('/profile')} accessibilityLabel="Profile" style={styles.avatarBtn}>
          <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
        </Pressable>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textCaption} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
          placeholderTextColor={colors.textCaption}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <View style={styles.listContainer}>
        {!loading && (projects?.length ?? 0) === 0 ? (
          <EmptyState icon="folder-open-outline" title="No projects yet" subtitle="Create your first project to get started" actionLabel="Create Project" onAction={() => router.push('/project/create')} />
        ) : (
          <FlashList
            data={projects ?? []}
            renderItem={renderProject}
            keyExtractor={(item) => item?.id ?? Math.random().toString()}
            contentContainerStyle={{ padding: spacing.md }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      {/* Add Project Button */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }]}
        onPress={() => router.push('/project/create')}
        accessibilityRole="button"
        accessibilityLabel="Añadir Proyecto"
      >
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.fabText}>Añadir Proyecto</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.textDark },
  avatarBtn: { padding: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  searchIcon: { marginRight: spacing.xs },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.textDark },
  listContainer: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  badge: { backgroundColor: colors.primary + '1A', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.textDark, marginBottom: 2 },
  cardDate: { fontSize: 13, color: colors.textCaption, marginBottom: spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: colors.textCaption },
  totalAmount: { fontSize: 18, fontWeight: '700', color: colors.primary },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
