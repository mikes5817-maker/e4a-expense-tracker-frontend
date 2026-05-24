import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../src/theme';
import { InputField } from '../../src/components/InputField';
import { GradientButton } from '../../src/components/GradientButton';
import { createProject } from '../../src/services/projects.service';
import { DatePickerModal } from 'react-native-paper-dates';

export default function CreateProjectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [projectNumber, setProjectNumber] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!projectNumber?.trim()) { setError('Project number is required'); return; }
    if (!name?.trim()) { setError('Project name is required'); return; }
    setLoading(true);
    try {
      await createProject({ projectNumber: projectNumber.trim(), name: name.trim(), date: date.toISOString() });
      router.back();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create project';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>New Project</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <InputField label="Project Number" value={projectNumber} onChangeText={setProjectNumber} placeholder="e.g. PRJ-001" />
            <InputField label="Project Name" value={name} onChangeText={setName} placeholder="e.g. Office Renovation" />
            <Text style={styles.label}>Date</Text>
            <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)} accessibilityLabel="Pick date">
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.dateText}>{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
            </Pressable>
            <DatePickerModal
              locale="en"
              mode="single"
              visible={showDatePicker}
              onDismiss={() => setShowDatePicker(false)}
              date={date}
              onConfirm={({ date: d }) => { if (d) setDate(d); setShowDatePicker(false); }}
            />
          </View>
          <GradientButton title="Save Project" onPress={handleSave} loading={loading} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textDark },
  scroll: { padding: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  error: { backgroundColor: colors.error + '15', color: colors.error, fontSize: 13, padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.sm, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textBody, marginBottom: 6 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAFBFC' },
  dateText: { fontSize: 15, color: colors.textDark },
});
