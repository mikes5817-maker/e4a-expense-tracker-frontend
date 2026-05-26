import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../theme';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 15, 30, 45];
const AMPM = ['AM', 'PM'];

interface TimePickerProps {
  value: number | null;
  onChange: (minutes: number | null) => void;
  placeholder?: string;
}

function minsToDisplay(mins: number | null): { h: number; m: number; ampm: string } | null {
  if (mins === null) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { h: hh, m, ampm };
}

function displayToMins(h: number, m: number, ampm: string): number {
  let hour = h;
  if (ampm === 'PM' && h < 12) hour += 12;
  if (ampm === 'AM' && h === 12) hour = 0;
  return hour * 60 + m;
}

export function TimePicker({ value, onChange, placeholder = 'Select time' }: TimePickerProps) {
  const [visible, setVisible] = useState(false);
  const parsed = minsToDisplay(value);
  const [selH, setSelH] = useState(parsed?.h ?? 8);
  const [selM, setSelM] = useState(parsed?.m ?? 0);
  const [selAmPm, setSelAmPm] = useState(parsed?.ampm ?? 'AM');

  const displayStr = parsed
    ? `${parsed.h}:${parsed.m.toString().padStart(2, '0')} ${parsed.ampm}`
    : placeholder;

  const handleOpen = () => {
    const p = minsToDisplay(value);
    setSelH(p?.h ?? 8);
    setSelM(p?.m ?? 0);
    setSelAmPm(p?.ampm ?? 'AM');
    setVisible(true);
  };

  const handleConfirm = () => {
    onChange(displayToMins(selH, selM, selAmPm));
    setVisible(false);
  };

  const handleClear = () => {
    onChange(null);
    setVisible(false);
  };

  return (
    <>
      <Pressable style={[styles.trigger, value !== null && styles.triggerActive]} onPress={handleOpen}>
        <Text style={[styles.triggerText, value === null && styles.placeholder]}>{displayStr}</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <Text style={styles.title}>Select time</Text>

            <View style={styles.columns}>
              {/* Hour */}
              <View style={styles.col}>
                <Text style={styles.colLabel}>Hour</Text>
                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                  {HOURS.map(h => (
                    <Pressable
                      key={h}
                      style={[styles.item, selH === h && styles.itemSelected]}
                      onPress={() => setSelH(h)}
                    >
                      <Text style={[styles.itemText, selH === h && styles.itemTextSelected]}>{h}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Minutes */}
              <View style={styles.col}>
                <Text style={styles.colLabel}>Min</Text>
                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                  {MINUTES.map(m => (
                    <Pressable
                      key={m}
                      style={[styles.item, selM === m && styles.itemSelected]}
                      onPress={() => setSelM(m)}
                    >
                      <Text style={[styles.itemText, selM === m && styles.itemTextSelected]}>
                        {m.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* AM/PM */}
              <View style={styles.col}>
                <Text style={styles.colLabel}>AM/PM</Text>
                <View style={styles.scroll}>
                  {AMPM.map(ap => (
                    <Pressable
                      key={ap}
                      style={[styles.item, selAmPm === ap && styles.itemSelected]}
                      onPress={() => setSelAmPm(ap)}
                    >
                      <Text style={[styles.itemText, selAmPm === ap && styles.itemTextSelected]}>{ap}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.clearBtn} onPress={handleClear}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  triggerActive: { borderColor: colors.primary },
  triggerText: { fontSize: 13, color: colors.textDark, fontWeight: '500' },
  placeholder: { color: colors.textCaption },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.textDark, textAlign: 'center', marginBottom: spacing.md },
  columns: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  col: { flex: 1, alignItems: 'center' },
  colLabel: { fontSize: 11, color: colors.textCaption, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  scroll: { width: '100%', maxHeight: 200 },
  item: { paddingVertical: 12, alignItems: 'center', borderRadius: radius.sm },
  itemSelected: { backgroundColor: colors.primary },
  itemText: { fontSize: 18, fontWeight: '500', color: colors.textDark },
  itemTextSelected: { color: '#FFFFFF' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  clearBtn: { flex: 1, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  clearText: { fontSize: 14, color: colors.textCaption },
  confirmBtn: { flex: 2, padding: 14, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center' },
  confirmText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});
