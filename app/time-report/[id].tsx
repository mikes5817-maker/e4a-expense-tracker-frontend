import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MailComposer from 'expo-mail-composer';
import * as Sharing from 'expo-sharing';
import { colors, spacing, radius } from '../../src/theme';
import { GradientButton } from '../../src/components/GradientButton';
import { getTimeReport, downloadTimeReportPdf } from '../../src/services/time-report.service';

function calcHours(inMins: number | null, outMins: number | null): number {
  if (!inMins || !outMins) return 0;
  const diff = outMins - inMins;
  return diff > 0 ? Math.round(diff * 100 / 60) / 100 : 0;
}

function minsToStr(mins: number | null): string {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function TimeReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    getTimeReport(id).then(setReport).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleSend = async () => {
    setSending(true);
    try {
      const base64Pdf = await downloadTimeReportPdf(id!);
      const weekStr = new Date(report.weekStart).toISOString().split('T')[0];
      const filename = `TimeReport_${weekStr}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, base64Pdf, { encoding: FileSystem.EncodingType.Base64 });

      const isMailAvailable = await MailComposer.isAvailableAsync();
      if (isMailAvailable) {
        await MailComposer.composeAsync({
          to: ['rsilva@e4asolutions.com'],
          subject: `E4A Solutions - Time Report`,
          body: 'Please find attached the weekly time report.\n\nE4A Solutions',
          attachments: [fileUri],
        });
      } else {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf' });
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  if (!report) return null;

  const weekStart = new Date(report.weekStart);
  const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Time Report</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.weekBanner}>
          <Ionicons name="calendar" size={18} color="#D4830A" />
          <Text style={styles.weekText}>{weekLabel}</Text>
        </View>

        {report.employees.map((emp: any) => {
          const total = emp.days.reduce((sum: number, d: any) =>
            sum + d.shifts.reduce((s: number, sh: any) => s + calcHours(sh.timeIn, sh.timeOut), 0), 0);
          return (
            <View key={emp.id} style={styles.empCard}>
              <View style={styles.empHeader}>
                <Text style={styles.empName}>{emp.name}</Text>
                {emp.employeeId && <Text style={styles.empId}>ID: {emp.employeeId}</Text>}
                <Text style={styles.empTotal}>{total.toFixed(2)}h</Text>
              </View>
              {emp.days.filter((d: any) => d.shifts.some((s: any) => s.timeIn)).map((day: any) => (
                <View key={day.id} style={styles.dayRow}>
                  <Text style={styles.dayName}>{day.dayName.slice(0, 3)}</Text>
                  <View style={styles.shifts}>
                    {day.shifts.filter((s: any) => s.timeIn).map((sh: any, si: number) => (
                      <Text key={si} style={styles.shiftText}>
                        {minsToStr(sh.timeIn)} → {minsToStr(sh.timeOut)}
                        {sh.projectId ? ` [${sh.projectId}]` : ''}
                        {' '}{calcHours(sh.timeIn, sh.timeOut).toFixed(2)}h
                      </Text>
                    ))}
                  </View>
                  {day.perDiem && <View style={styles.pdBadge}><Text style={styles.pdText}>PD</Text></View>}
                </View>
              ))}
            </View>
          );
        })}

        <View style={styles.sendNote}>
          <Ionicons name="mail-outline" size={14} color={colors.textCaption} />
          <Text style={styles.sendNoteText}>Will open email app with PDF attached to rsilva@e4asolutions.com</Text>
        </View>

        <GradientButton
          title={sending ? 'Preparing PDF...' : 'Send Report'}
          onPress={handleSend}
          loading={sending}
          style={{ marginBottom: spacing.xxl }}
        />
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
  scroll: { padding: spacing.md },
  weekBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#D4830A15', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md },
  weekText: { fontSize: 14, fontWeight: '600', color: '#D4830A' },
  empCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  empHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: 8 },
  empName: { fontSize: 15, fontWeight: '700', color: colors.textDark, flex: 1 },
  empId: { fontSize: 12, color: colors.textCaption },
  empTotal: { fontSize: 15, fontWeight: '700', color: colors.primary },
  dayRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  dayName: { fontSize: 12, fontWeight: '600', color: colors.textCaption, width: 30, paddingTop: 2 },
  shifts: { flex: 1 },
  shiftText: { fontSize: 12, color: colors.textDark, lineHeight: 18 },
  pdBadge: { backgroundColor: '#D4EDDA', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  pdText: { fontSize: 10, fontWeight: '700', color: '#155724' },
  sendNote: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: spacing.sm },
  sendNoteText: { fontSize: 12, color: colors.textCaption, textAlign: 'center', flex: 1 },
});
