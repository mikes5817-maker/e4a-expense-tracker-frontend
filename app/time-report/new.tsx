import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Switch, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { colors, spacing, radius } from '../../src/theme';
import { GradientButton } from '../../src/components/GradientButton';
import { createTimeReport, downloadTimeReportPdf } from '../../src/services/time-report.service';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTime(mins: number | null): string {
  if (mins === null) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function parseTimeInput(val: string): number | null {
  const clean = val.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!match) return null;
  let h = parseInt(match[1]);
  const m = match[2] ? parseInt(match[2]) : 0;
  const ampm = match[3];
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function calcHours(inMins: number | null, outMins: number | null): number {
  if (inMins === null || outMins === null) return 0;
  const diff = outMins - inMins;
  return diff > 0 ? Math.round(diff * 100 / 60) / 100 : 0;
}

type Shift = { projectId: string; timeIn: string; timeOut: string; shiftNum: number };
type Day = { dayName: string; date: Date; perDiem: boolean; shifts: Shift[] };
type Employee = { name: string; employeeId: string; days: Day[] };

export default function NewTimeReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [weekStart] = useState(() => getMondayOf(new Date()));
  const [employees, setEmployees] = useState<Employee[]>([
    { name: '', employeeId: '', days: DAYS.map((d, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return { dayName: d, date, perDiem: false, shifts: [{ projectId: '', timeIn: '', timeOut: '', shiftNum: 1 }] };
    })}
  ]);
  const [saving, setSaving] = useState(false);

  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const addEmployee = () => {
    setEmployees(prev => [...prev, {
      name: '', employeeId: '', days: DAYS.map((d, i) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        return { dayName: d, date, perDiem: false, shifts: [{ projectId: '', timeIn: '', timeOut: '', shiftNum: 1 }] };
      })
    }]);
  };

  const removeEmployee = (ei: number) => {
    setEmployees(prev => prev.filter((_, i) => i !== ei));
  };

  const updateEmp = (ei: number, field: 'name' | 'employeeId', val: string) => {
    setEmployees(prev => prev.map((e, i) => i === ei ? { ...e, [field]: val } : e));
  };

  const togglePerDiem = (ei: number, di: number, val: boolean) => {
    setEmployees(prev => prev.map((e, i) => i === ei ? {
      ...e, days: e.days.map((d, j) => j === di ? { ...d, perDiem: val } : d)
    } : e));
  };

  const updateShift = (ei: number, di: number, si: number, field: keyof Shift, val: string) => {
    setEmployees(prev => prev.map((e, i) => i === ei ? {
      ...e, days: e.days.map((d, j) => j === di ? {
        ...d, shifts: d.shifts.map((s, k) => k === si ? { ...s, [field]: val } : s)
      } : d)
    } : e));
  };

  const addShift = (ei: number, di: number) => {
    setEmployees(prev => prev.map((e, i) => i === ei ? {
      ...e, days: e.days.map((d, j) => j === di ? {
        ...d, shifts: [...d.shifts, { projectId: '', timeIn: '', timeOut: '', shiftNum: d.shifts.length + 1 }]
      } : d)
    } : e));
  };

  const handleSaveAndSend = async () => {
    if (employees.some(e => !e.name.trim())) {
      Alert.alert('Missing info', 'Please enter a name for each employee.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        weekStart: weekStart.toISOString(),
        employees: employees.map(e => ({
          name: e.name.trim(),
          employeeId: e.employeeId.trim() || undefined,
          days: e.days.map(d => ({
            dayName: d.dayName,
            date: d.date.toISOString(),
            perDiem: d.perDiem,
            shifts: d.shifts.map(s => ({
              projectId: s.projectId || undefined,
              timeIn: parseTimeInput(s.timeIn),
              timeOut: parseTimeInput(s.timeOut),
              shiftNum: s.shiftNum,
            })),
          })),
        })),
      };

      const report = await createTimeReport(payload);
      const base64Pdf = await downloadTimeReportPdf(report.id);
      const filename = `TimeReport_${weekStart.toISOString().split('T')[0]}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, base64Pdf, { encoding: FileSystem.EncodingType.Base64 });

      const isMailAvailable = await MailComposer.isAvailableAsync();
      if (isMailAvailable) {
        await MailComposer.composeAsync({
          to: ['rsilva@e4asolutions.com'],
          subject: `E4A Solutions - Time Report: ${weekLabel}`,
          body: `Please find attached the weekly time report for ${weekLabel}.\n\nE4A Solutions`,
          attachments: [fileUri],
        });
      } else {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf' });
      }
      router.replace('/tabs/time-reports');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>New Time Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.weekBanner}>
          <Ionicons name="calendar" size={18} color={colors.primary} />
          <Text style={styles.weekText}>Week: {weekLabel}</Text>
        </View>

        {employees.map((emp, ei) => (
          <View key={ei} style={styles.empCard}>
            <View style={styles.empHeader}>
              <Text style={styles.empTitle}>Employee {ei + 1}</Text>
              {employees.length > 1 && (
                <Pressable onPress={() => removeEmployee(ei)}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </Pressable>
              )}
            </View>

            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={emp.name}
                  onChangeText={v => updateEmp(ei, 'name', v)}
                  placeholder="Full name"
                  placeholderTextColor={colors.textCaption}
                />
              </View>
              <View style={[styles.flex, { maxWidth: 120 }]}>
                <Text style={styles.label}>Employee ID</Text>
                <TextInput
                  style={styles.input}
                  value={emp.employeeId}
                  onChangeText={v => updateEmp(ei, 'employeeId', v)}
                  placeholder="ID"
                  placeholderTextColor={colors.textCaption}
                />
              </View>
            </View>

            {emp.days.map((day, di) => (
              <View key={di} style={styles.daySection}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{day.dayName}</Text>
                  <Text style={styles.dayDate}>{day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                  <View style={styles.perDiemRow}>
                    <Text style={styles.perDiemLabel}>Per Diem</Text>
                    <Switch
                      value={day.perDiem}
                      onValueChange={v => togglePerDiem(ei, di, v)}
                      trackColor={{ false: colors.border, true: colors.primary + '80' }}
                      thumbColor={day.perDiem ? colors.primary : colors.textCaption}
                    />
                  </View>
                </View>

                {day.shifts.map((shift, si) => (
                  <View key={si} style={styles.shiftRow}>
                    <Text style={styles.shiftNum}>#{si + 1}</Text>
                    <View style={styles.flex}>
                      <TextInput
                        style={styles.timeInput}
                        value={shift.timeIn}
                        onChangeText={v => updateShift(ei, di, si, 'timeIn', v)}
                        placeholder="In (e.g. 7AM)"
                        placeholderTextColor={colors.textCaption}
                      />
                    </View>
                    <Ionicons name="arrow-forward" size={14} color={colors.textCaption} />
                    <View style={styles.flex}>
                      <TextInput
                        style={styles.timeInput}
                        value={shift.timeOut}
                        onChangeText={v => updateShift(ei, di, si, 'timeOut', v)}
                        placeholder="Out (e.g. 4PM)"
                        placeholderTextColor={colors.textCaption}
                      />
                    </View>
                    <View style={[styles.flex, { maxWidth: 80 }]}>
                      <TextInput
                        style={styles.timeInput}
                        value={shift.projectId}
                        onChangeText={v => updateShift(ei, di, si, 'projectId', v)}
                        placeholder="Proj ID"
                        placeholderTextColor={colors.textCaption}
                      />
                    </View>
                    <Text style={styles.hoursLabel}>
                      {calcHours(parseTimeInput(shift.timeIn), parseTimeInput(shift.timeOut)).toFixed(1)}h
                    </Text>
                  </View>
                ))}

                <Pressable style={styles.addShiftBtn} onPress={() => addShift(ei, di)}>
                  <Ionicons name="add" size={14} color={colors.primary} />
                  <Text style={styles.addShiftText}>Add shift</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ))}

        <Pressable style={styles.addEmpBtn} onPress={addEmployee}>
          <Ionicons name="person-add-outline" size={18} color={colors.primary} />
          <Text style={styles.addEmpText}>Add Employee</Text>
        </Pressable>

        <View style={styles.recipientNote}>
          <Ionicons name="mail-outline" size={14} color={colors.textCaption} />
          <Text style={styles.recipientText}>Will be sent to: rsilva@e4asolutions.com</Text>
        </View>

        <GradientButton
          title={saving ? 'Generating PDF...' : 'Save & Send Report'}
          onPress={handleSaveAndSend}
          loading={saving}
          style={{ marginTop: spacing.md, marginBottom: spacing.xxl }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textDark },
  scroll: { padding: spacing.md },
  weekBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary + '10', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md },
  weekText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  empCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  empHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  empTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  flex: { flex: 1 },
  label: { fontSize: 11, color: colors.textCaption, marginBottom: 4 },
  input: { backgroundColor: colors.background, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, fontSize: 14, color: colors.textDark },
  daySection: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.sm },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.xs },
  dayName: { fontSize: 13, fontWeight: '600', color: colors.textDark, width: 80 },
  dayDate: { fontSize: 12, color: colors.textCaption, flex: 1 },
  perDiemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  perDiemLabel: { fontSize: 11, color: colors.textCaption },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  shiftNum: { fontSize: 11, color: colors.textCaption, width: 18 },
  timeInput: { backgroundColor: colors.background, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: 6, fontSize: 12, color: colors.textDark, textAlign: 'center' },
  hoursLabel: { fontSize: 12, fontWeight: '600', color: colors.primary, width: 30, textAlign: 'right' },
  addShiftBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  addShiftText: { fontSize: 12, color: colors.primary },
  addEmpBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', backgroundColor: colors.primary + '10', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  addEmpText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  recipientNote: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: spacing.sm },
  recipientText: { fontSize: 12, color: colors.textCaption },
});
