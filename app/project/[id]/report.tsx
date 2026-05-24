import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../../src/theme';
import { GradientButton } from '../../../src/components/GradientButton';
import { CategoryChip } from '../../../src/components/CategoryChip';
import { getReportPreview, sendReport } from '../../../src/services/report.service';
import { ReportPreview } from '../../../src/types';

const logo = require('../../../assets/logo.png');

export default function ReportScreen() {
  const { id: projectId = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [report, setReport] = useState<ReportPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!projectId) return;
    getReportPreview(projectId)
      .then((data) => setReport(data ?? null))
      .catch(() => setError('Failed to load report preview'))
      .finally(() => setLoadingPreview(false));
  }, [projectId]);

  const formatDate = (d: string | null | undefined) => {
    if (!d) return 'N/A';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; }
  };
  const formatCurrency = (a: number) => `$${(a ?? 0).toFixed(2)}`;

  const handleSendReport = async () => {
    setSending(true);
    setError('');
    try {
      const res = await sendReport(projectId);
      setSent(true);
      setSuccessMsg(res?.message ?? 'Report sent successfully!');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send report';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  if (loadingPreview) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Project Report</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {sent ? (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={styles.successTitle}>Report Sent!</Text>
            <Text style={styles.successMsg}>{successMsg}</Text>
            <GradientButton title="Done" onPress={() => router.back()} style={{ marginTop: spacing.lg, width: '100%' }} />
          </View>
        ) : (
          <>
            <View style={styles.reportCard}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
              <Text style={styles.reportTitle}>Expense Report</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Project</Text>
                <Text style={styles.infoValue}>{report?.projectName ?? ''}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Project Number</Text>
                <Text style={styles.infoValue}>{report?.projectNumber ?? ''}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(report?.projectDate)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date Range</Text>
                <Text style={styles.infoValue}>{formatDate(report?.dateRange?.earliest)} — {formatDate(report?.dateRange?.latest)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{report?.expenseCount ?? 0}</Text>
                  <Text style={styles.summaryLabel}>Expenses</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>{formatCurrency(report?.totalAmount ?? 0)}</Text>
                  <Text style={styles.summaryLabel}>Total Amount</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <Text style={styles.breakdownTitle}>Category Breakdown</Text>
              {(report?.categoryBreakdown ?? []).map((cat) => (
                <View key={cat?.category ?? Math.random().toString()} style={styles.catRow}>
                  <CategoryChip category={cat?.category ?? 'Other'} />
                  <View style={styles.catRight}>
                    <Text style={styles.catCount}>{cat?.count ?? 0} items</Text>
                    <Text style={styles.catAmount}>{formatCurrency(cat?.subtotal ?? 0)}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.recipientRow}>
              <Ionicons name="mail-outline" size={16} color={colors.textCaption} />
              <Text style={styles.recipientText}>Report will be sent to asantoro@e4asolutions.com</Text>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GradientButton title={sending ? 'Sending...' : 'Generate & Send Report'} onPress={handleSendReport} loading={sending} style={{ marginTop: spacing.md }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textDark },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  reportCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  logo: { width: 100, height: 50, alignSelf: 'center', marginBottom: spacing.sm },
  reportTitle: { fontSize: 20, fontWeight: '700', color: colors.primary, textAlign: 'center', marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: colors.textCaption },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.textDark, flexShrink: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '700', color: colors.textDark },
  summaryLabel: { fontSize: 12, color: colors.textCaption, marginTop: 2 },
  breakdownTitle: { fontSize: 16, fontWeight: '600', color: colors.textDark, marginBottom: spacing.sm },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  catRight: { alignItems: 'flex-end' },
  catCount: { fontSize: 12, color: colors.textCaption },
  catAmount: { fontSize: 15, fontWeight: '700', color: colors.textDark },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, justifyContent: 'center' },
  recipientText: { fontSize: 13, color: colors.textCaption },
  error: { backgroundColor: colors.error + '15', color: colors.error, fontSize: 13, padding: spacing.sm, borderRadius: radius.sm, marginTop: spacing.sm, textAlign: 'center' },
  successCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  successTitle: { fontSize: 22, fontWeight: '700', color: colors.success, marginTop: spacing.md },
  successMsg: { fontSize: 14, color: colors.textBody, textAlign: 'center', marginTop: spacing.xs },
});
