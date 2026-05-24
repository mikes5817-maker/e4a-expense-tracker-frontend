import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, Platform, ActivityIndicator, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Menu } from 'react-native-paper';
import { colors, spacing, radius } from '../../../src/theme';
import { CategoryChip } from '../../../src/components/CategoryChip';
import { getExpense, deleteExpense } from '../../../src/services/expenses.service';
import { getFileUrl } from '../../../src/services/upload.service';
import { Expense, CATEGORY_LABELS, type ExpenseCategory } from '../../../src/types';

export default function ExpenseDetailScreen() {
  const { expenseId = '' } = useLocalSearchParams<{ expenseId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [receiptViewUrl, setReceiptViewUrl] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  const fetchData = useCallback(async () => {
    if (!expenseId) return;
    try {
      const e = await getExpense(expenseId);
      setExpense(e ?? null);
      // Fetch fresh signed URL for receipt
      if (e?.receiptFileId) {
        setLoadingReceipt(true);
        try {
          const url = await getFileUrl(e.receiptFileId, 'view');
          setReceiptViewUrl(url || null);
        } catch {
          setReceiptViewUrl(null);
        } finally {
          setLoadingReceipt(false);
        }
      }
    } catch { /* ignore */ }
  }, [expenseId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch { return d ?? ''; } };
  const formatCurrency = (a: number) => `$${(a ?? 0).toFixed(2)}`;

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        await deleteExpense(expenseId);
        router.back();
      } catch { /* ignore */ }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this expense?')) doDelete();
    } else {
      Alert.alert('Delete Expense', 'Delete this expense?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const isImage = (expense?.receiptContentType ?? '').startsWith('image/');
  const isPdf = (expense?.receiptContentType ?? '') === 'application/pdf';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Expense Details</Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Pressable onPress={() => setMenuVisible(true)} accessibilityLabel="More options" style={styles.backBtn}>
              <Ionicons name="ellipsis-vertical" size={22} color={colors.textDark} />
            </Pressable>
          }
        >
          <Menu.Item onPress={() => { setMenuVisible(false); router.push(`/expense/${expenseId}/edit`); }} title="Edit" leadingIcon="pencil" />
          <Menu.Item onPress={() => { setMenuVisible(false); handleDelete(); }} title="Delete" leadingIcon="delete" titleStyle={{ color: colors.error }} />
        </Menu>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {expense ? (
          <>
            <View style={styles.detailCard}>
              <CategoryChip category={expense?.category ?? 'Other'} customCategory={expense?.customCategory} />
              <Text style={styles.amount}>{formatCurrency(expense?.amount ?? 0)}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Employee</Text>
                <Text style={styles.infoValue}>{expense?.employeeName ?? ''}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(expense?.date ?? '')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>
                  {expense?.category === 'Other' && expense?.customCategory
                    ? expense.customCategory
                    : CATEGORY_LABELS?.[expense?.category as ExpenseCategory] ?? expense?.category ?? ''}
                </Text>
              </View>
            </View>

            {/* Receipt Section */}
            <Text style={styles.sectionTitle}>Receipt</Text>
            {expense?.receiptFileId ? (
              <View style={styles.receiptCard}>
                {loadingReceipt ? (
                  <ActivityIndicator color={colors.primary} style={{ padding: spacing.lg }} />
                ) : isImage && receiptViewUrl ? (
                  <Image source={{ uri: receiptViewUrl }} style={styles.receiptImage} resizeMode="contain" />
                ) : isPdf && receiptViewUrl ? (
                  <Pressable style={styles.pdfBtn} onPress={() => { if (receiptViewUrl) Linking.openURL(receiptViewUrl); }} accessibilityLabel="View PDF">
                    <Ionicons name="document" size={40} color={colors.primary} />
                    <Text style={styles.pdfName}>{expense?.receiptFileName ?? 'Document.pdf'}</Text>
                    <Text style={styles.pdfAction}>Tap to view</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.noReceipt}>Unable to load receipt</Text>
                )}
              </View>
            ) : (
              <Text style={styles.noReceipt}>No receipt attached</Text>
            )}
          </>
        ) : (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textDark },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  detailCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  amount: { fontSize: 28, fontWeight: '700', color: colors.primary, marginTop: spacing.sm, marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 14, color: colors.textCaption },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.textDark },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textDark, marginTop: spacing.lg, marginBottom: spacing.sm },
  receiptCard: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  receiptImage: { width: '100%', height: 300 },
  pdfBtn: { alignItems: 'center', padding: spacing.lg },
  pdfName: { fontSize: 14, fontWeight: '600', color: colors.textDark, marginTop: spacing.sm },
  pdfAction: { fontSize: 13, color: colors.primary, marginTop: 4 },
  noReceipt: { fontSize: 14, color: colors.textCaption, textAlign: 'center', padding: spacing.lg },
});
