import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu } from 'react-native-paper';
import { colors, spacing, radius } from '../../../src/theme';
import { getProject, deleteProject } from '../../../src/services/projects.service';
import { getExpenses } from '../../../src/services/expenses.service';
import { Project, Expense } from '../../../src/types';
import { CategoryChip } from '../../../src/components/CategoryChip';
import { EmptyState } from '../../../src/components/EmptyState';

export default function ProjectDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [p, e] = await Promise.all([getProject(id), getExpenses(id)]);
      setProject(p ?? null);
      setExpenses(e ?? []);
    } catch { /* ignore */ }
    setRefreshing(false);
  }, [id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d ?? ''; } };
  const formatCurrency = (a: number) => `$${(a ?? 0).toFixed(2)}`;

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        await deleteProject(id);
        router.back();
      } catch { /* ignore */ }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this project and all its expenses?')) doDelete();
    } else {
      Alert.alert('Delete Project', 'Delete this project and all its expenses?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const renderExpense = ({ item }: { item: Expense }) => (
    <Pressable
      style={({ pressed }) => [styles.expenseCard, pressed && { opacity: 0.8 }]}
      onPress={() => router.push(`/expense/${item?.id}`)}
      accessibilityLabel={`Expense ${item?.employeeName}`}
    >
      <View style={styles.expenseLeft}>
        <CategoryChip category={item?.category ?? 'Other'} customCategory={item?.customCategory} small />
        <Text style={styles.empName} numberOfLines={1}>{item?.employeeName ?? ''}</Text>
        <Text style={styles.expenseDate}>{formatDate(item?.date ?? '')}</Text>
      </View>
      <View style={styles.expenseRight}>
        <Text style={styles.expenseAmount}>{formatCurrency(item?.amount ?? 0)}</Text>
        {item?.receiptFileId ? <Ionicons name="attach" size={14} color={colors.textCaption} /> : null}
      </View>
    </Pressable>
  );

  const ListHeader = () => (
    <View>
      <View style={styles.projectCard}>
        <View style={styles.badge}><Text style={styles.badgeText}>{project?.projectNumber ?? ''}</Text></View>
        <Text style={styles.projectName}>{project?.name ?? ''}</Text>
        <Text style={styles.projectDate}>{formatDate(project?.date ?? '')}</Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Expenses</Text>
          <Text style={styles.totalAmount}>{formatCurrency(project?.totalAmount ?? 0)}</Text>
        </View>
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Expenses</Text>
        <View style={styles.countBadge}><Text style={styles.countText}>{expenses?.length ?? 0}</Text></View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{project?.name ?? 'Project'}</Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<Pressable onPress={() => setMenuVisible(true)} accessibilityLabel="More options" style={styles.backBtn}><Ionicons name="ellipsis-vertical" size={22} color={colors.textDark} /></Pressable>}
        >
          <Menu.Item onPress={() => { setMenuVisible(false); router.push(`/project/${id}/edit`); }} title="Edit Project" leadingIcon="pencil" />
          <Menu.Item onPress={() => { setMenuVisible(false); router.push(`/project/${id}/report`); }} title="Generate Report" leadingIcon="file-document" />
          <Menu.Item onPress={() => { setMenuVisible(false); handleDelete(); }} title="Delete Project" leadingIcon="delete" titleStyle={{ color: colors.error }} />
        </Menu>
      </View>
      <View style={{ flex: 1 }}>
        {(expenses?.length ?? 0) === 0 && project ? (
          <View style={{ flex: 1 }}>
            <ListHeader />
            <EmptyState icon="receipt-outline" title="No expenses yet" subtitle="Add your first expense" actionLabel="Add Expense" onAction={() => router.push(`/project/${id}/add-expense`)} />
          </View>
        ) : (
          <FlashList
            data={expenses ?? []}
            renderItem={renderExpense}
            keyExtractor={(item) => item?.id ?? Math.random().toString()}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={{ padding: spacing.md }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
          />
        )}
      </View>
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.9 }] }]}
        onPress={() => router.push(`/project/${id}/add-expense`)}
        accessibilityLabel="Add expense"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textDark, flex: 1, textAlign: 'center' },
  projectCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  badge: { backgroundColor: colors.primary + '1A', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full, alignSelf: 'flex-start' },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  projectName: { fontSize: 22, fontWeight: '700', color: colors.textDark, marginTop: spacing.sm },
  projectDate: { fontSize: 13, color: colors.textCaption, marginTop: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontSize: 14, color: colors.textBody },
  totalAmount: { fontSize: 24, fontWeight: '700', color: colors.primary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textDark },
  countBadge: { backgroundColor: colors.primary + '1A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  countText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  expenseCard: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  expenseLeft: { flex: 1, marginRight: spacing.sm },
  empName: { fontSize: 15, fontWeight: '600', color: colors.textDark, marginTop: 4 },
  expenseDate: { fontSize: 12, color: colors.textCaption, marginTop: 2 },
  expenseRight: { alignItems: 'flex-end', gap: 4 },
  expenseAmount: { fontSize: 16, fontWeight: '700', color: colors.primary },
  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
});
