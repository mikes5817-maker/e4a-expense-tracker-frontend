import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { colors, spacing, radius } from '../../../src/theme';
import { CategoryChip } from '../../../src/components/CategoryChip';
import { getReportPreview } from '../../../src/services/report.service';
import { ReportPreview } from '../../../src/types';

const logo = require('../../../assets/logo.png');

async function getToken(): Promise<string> {
  try {
    if (Platform.OS === 'web') return localStorage.getItem('auth_token') ?? '';
    return (await AsyncStorage.getItem('auth_token')) ?? '';
  } catch { return ''; }
}

export default function ReportScreen() {
  const { id: projectId = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [report, setReport] = useState<ReportPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) return;
    getReportPreview(projectId)
      .then(d => setReport(d ?? null))
      .catch(() => setError('Failed to load report'))
      .finally(() => setLoadingPreview(false));
  }, [projectId]);

  const formatDate = (d?: string | null) => {
    if (!d) return 'N/A';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; }
  };
  const formatCurrency = (a: number) => `$${(a ?? 0).toFixed(2)}`;

  const handleSendReport = async () => {
    setSending(true);
    setError('');
    try {
      const token = await getToken();
      const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/').replace(/\/$/, '');
      const url = `${base}/api/projects/${projectId}/report/download`;
      const dest = `${FileSystem.cacheDirectory}report_${projectId}_${Date.now()}.pdf`;

      const result = await FileSystem.downloadAsync(url, dest, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const isMailAvailable = await MailComposer.isAvailableAsync();
      if (isMailAvailable) {
        await MailComposer.composeAsync({
          to: ['asantoro@e4asolutions.com'],
          subject: `E4A Solutions - Expense Report: ${report?.projectName ?? ''}`,
          body: `Please find attached the expense report for project: ${report?.projectName ?? ''}.\n\nProject Number: ${report?.projectNumber ?? ''}\nTotal: ${formatCurrency(report?.totalAmount ?? 0)}\n\nE4A Solutions`,
          attachments: [result.uri],
        });
        setSent(true);
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf' });
          setSent(true);
        } else {
          setError('No email app available. Please install an email app.');
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate report');
    } finally {
      setSending(false);
    }
  };

  if (loadingPreview) return (
    <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Project Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {sent ? (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
            <Text style={styles.successTitle}>Report Sent!</Text>
            <Text style={styles.successMsg}>Email opened with PDF attached to asantoro@e4asolutions.com</Text>
            <Pressable style={styles.doneBtn} onPress={() => router.back()}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.reportCard}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
              <Text style={styles.reportTitle}>Expense Report</Text>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Project</Text><Text style={styles.infoValue}>{report?.projectName ?? ''}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Project Number</Text><Text style={styles.infoValue}>{report?.projectNumber ?? ''}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{formatDate(report?.projectDate)}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Date Range</Text><Text style={styles.infoValue}>{formatDate(report?.dateRange?.earliest)} — {formatDate(report?.dateRange?.latest)}</Text></View>
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
              {(report?.categoryBreakdown ?? []).map((cat, i) => (
                <View key={i} style={styles.catRow}>
                  <CategoryChip category={cat?.category ?? 'Other'} />
                  <View style={styles.catRight}>
                    <Text style={styles.catCount}>{cat?.count ?? 0} items</Text>
                    <Text style={styles.catAmount}>{formatCurrency(cat?.subtotal ?? 0)}</Text>
                  </View>
                </View>
              ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Big prominent send button */}
            <Pressable
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
              onPress={handleSendReport}
              disabled={sending}
            >
              {sending ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.sendBtnText}>Generating PDF...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="send" size={22} color="#fff" />
                  <Text style={styles.sendBtnText}>Generate & Send Report</Text>
                </>
              )}
            </Pressable>
            <View style={styles.recipientRow}>
              <Ionicons name="mail-outline" size={14} color={colors.textCaption} />
              <Text style={styles.recipientText}>Will be sent to: asantoro@e4asolutions.com</Text>
            </View>
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
  scroll: { padding: spacing.md, paddingBottom: 40 },
  reportCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: spacing.md },
  logo: { width: 100, height: 50, alignSelf: 'center', marginBottom: spacing.sm },
  reportTitle: { fontSize: 20, fontWeight: '700', color: colors.primary, textAlign: 'center', marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: colors.textCaption },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.textDark, flexShrink: 1, textAlign: 'right', maxWidth: '60%' },
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
  error: { backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: 13, padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.sm, textAlign: 'center' },
  sendBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  sendBtnDisabled: { opacity: 0.7 },
  sendBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: spacing.sm },
  recipientText: { fontSize: 12, color: colors.textCaption },
  successCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#16A34A' },
  successMsg: { fontSize: 14, color: colors.textBody, textAlign: 'center' },
  doneBtn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, width: '100%', alignItems: 'center' },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
