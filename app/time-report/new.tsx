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
import { TimePicker } from '../../src/components/TimePicker';
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

function calcHours(inMins: number | null, outMins: number | null): number {
  if (inMins === null || outMins === null) return 0;
  const diff = outMins - inMins;
  return diff > 0 ? Math.round(diff * 100 / 60) / 100 : 0;
}

type Shift = { projectId: string; timeIn: number | null; timeOut: number | null; shiftNum: number };
type Day = { dayName: string; date: Date; perDiem: boolean; shifts: Shift[] };
type Employee = { name: string; employeeId: string; days: Day[] };

function makeEmployee(weekStart: Date): Employee {
  return {
    name: '', employeeId: '', days: DAYS.map((d, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return { dayName: d, date, perDiem: false, shifts: [{ projectId: '', timeIn: null, timeOut: null, shiftNum: 1 }] };
    })
  };
}

export default function NewTimeReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [weekStart] = useState(() => getMondayOf(new Date()));
  const [employees, setEmployees] = useState<Employee[]>([makeEmployee(getMondayOf(new Date()))]);
  const [saving, setSaving] = useState(false);

  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const updateEmp = (ei: number, field: 'name' | 'employeeId', val: string) => {
    setEmployees(prev => prev.map((e, i) => i === ei ? { ...e, [field]: val } : e));
  };

  const togglePerDiem = (ei: number, di: number, val: boolean) => {
    setEmployees(prev => prev.map((e, i) => i === ei ? {
      ...e, days: e.days.map((d, j) => j === di ? { ...d, perDiem: val } : d)
    } : e));
  };

  const updateShiftTime = (ei: number, di: number, si: number, field: 'timeIn' | 'timeOut', val: number | null) => {
    setEmployees(prev => prev.map((e, i) => i === ei ? {
      ...e, days: e.days.map((d, j) => j === di ? {
        ...d, shifts: d.shifts.map((s, k) => k === si ? { ...s, [field]: val } : s)
      } : d)
    } : e));
  };

  const updateShiftProject = (ei: number, di: number, si: number, val: string) => {
    setEmployees(prev => prev.map((e, i) => i === ei ? {
      ...e, days: e.days.map((d, j) => j === di ? {
        ...d, shifts: d.shifts.map((s, k) => k === si ? { ...s, projectId: val } : s)
      } : d)
    } : e));
  };

  const addShift = (ei: number, di: number) => {
    setEmployees(prev => prev.map((e, i) => i === ei ? {
      ...e, days: e.days.map((d, j) => j === di ? {
        ...d, shifts: [...d.shifts, { projectId: '', timeIn: null, timeOut: null, shiftNum: d.shifts.length + 1 }]
      } : d)
    } : e));
  };

  const removeShift = (ei: number, di: number, si: number) => {
    setEmployees(prev => prev.map((e, i) => i === ei ? {
      ...e, days: e.days.map((d, j) => j === di ? {
        ...d, shifts: d.shifts.filter((_, k) => k !== si).map((s, k) => ({ ...s, shiftNum: k + 1 }))
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
              timeIn: s.timeIn,
              timeOut: s.timeOut,
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
      Alert.alert('Error', e?.response?.data?.message ?? e?.message ?? 'Failed to save report');
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
                <Pressable onPress={() => setEmployees(prev => prev.filter((_, i) => i !== ei))}>
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
              <View style={[styles.flex, { maxWidth: 110 }]}>
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

            {emp.days.map((day, di) => {
              const dayTotal = day.shifts.reduce((s, sh) => s + calcHours(sh.timeIn, sh.timeOut), 0);
              return (
                <View key={di} style={styles.daySection}>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayNameBox}>
                      <Text style={styles.dayName}>{day.dayName.slice(0, 3).toUpperCase()}</Text>
                      <Text style={styles.dayDate}>{day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                    </View>
                    <View style={styles.perDiemRow}>
                      <Text style={styles.perDiemLabel}>Per Diem</Text>
                      <Switch
                        value={day.perDiem}
                        onValueChange={v => togglePerDiem(ei, di, v)}
                        trackColor={{ false: colors.border, true: colors.primary + '80' }}
                        thumbColor={day.perDiem ? colors.primary : '#ccc'}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                    </View>
                    {dayTotal > 0 && (
                      <Text style={styles.dayTotal}>{dayTotal.toFixed(1)}h</Text>
                    )}
                  </View>

                  {day.shifts.map((shift, si) => (
                    <View key={si} style={styles.shiftRow}>
                      <View style={styles.timeBlock}>
                        <Text style={styles.timeLabel}>In</Text>
                        <TimePicker
                          value={shift.timeIn}
                          onChange={v => updateShiftTime(ei, di, si, 'timeIn', v)}
                          placeholder="In"
                        />
                      </View>
                      <Ionicons name="arrow-forward" size={14} color={colors.textCaption} style={{ marginTop: 18 }} />
                      <View style={styles.timeBlock}>
                        <Text style={styles.timeLabel}>Out</Text>
                        <TimePicker
                          value={shift.timeOut}
                          onChange={v => updateShiftTime(ei, di, si, 'timeOut', v)}
                          placeholder="Out"
                        />
                      </View>
                      <View style={[styles.timeBlock, { maxWidth: 80 }]}>
                        <Text style={styles.timeLabel}>Proj ID</Text>
                        <TextInput
                          style={[styles.input, { textAlign: 'center', fontSize: 12 }]}
                          value={shift.projectId}
                          onChangeText={v => updateShiftProject(ei, di, si, v)}
                          placeholder="—"
                          placeholderTextColor={colors.textCaption}
                        />
                      </View>
                      {shift.timeIn !== null && shift.timeOut !== null && (
                        <Text style={styles.hoursLabel}>{calcHours(shift.timeIn, shift.timeOut).toFixed(1)}h</Text>
                      )}
                      {day.shifts.length > 1 && (
                        <Pressable onPress={() => removeShift(ei, di, si)} style={{ marginTop: 16 }}>
                          <Ionicons name="close-circle" size={18} color={colors.error} />
                        </Pressable>
                      )}
                    </View>
                  ))}

                  <Pressable style={styles.addShiftBtn} onPress={() => addShift(ei, di)}>
                    <Ionicons name="add" size={14} color={colors.primary} />
                    <Text style={styles.addShiftText}>Add shift</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}

        <Pressable style={styles.addEmpBtn} onPress={() => setEmployees(prev => [...prev, makeEmployee(weekStart)])}>
          <Ionicons name="person-add-outline" size={18} color={colors.primary} />
          <Text style={styles.addEmpText}>Add Employee</Text>
        </Pressable>

        <View style={styles.recipientNote}>
          <Ionicons name="mail-outline" size={14} color={colors.textCaption} />
          <Text style={styles.recipientText}>PDF will open in your email app → rsilva@e4asolutions.com</Text>
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
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  dayNameBox: { width: 52 },
  dayName: { fontSize: 12, fontWeight: '700', color: colors.textDark },
  dayDate: { fontSize: 10, color: colors.textCaption },
  perDiemRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  perDiemLabel: { fontSize: 11, color: colors.textCaption },
  dayTotal: { fontSize: 13, fontWeight: '700', color: colors.primary },
  shiftRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 8 },
  timeBlock: { flex: 1 },
  timeLabel: { fontSize: 10, color: colors.textCaption, marginBottom: 4 },
  hoursLabel: { fontSize: 12, fontWeight: '700', color: colors.primary, paddingBottom: 10, minWidth: 28 },
  addShiftBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  addShiftText: { fontSize: 12, color: colors.primary },
  addEmpBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', backgroundColor: colors.primary + '10', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  addEmpText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  recipientNote: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: spacing.sm },
  recipientText: { fontSize: 12, color: colors.textCaption, textAlign: 'center', flex: 1 },
});
