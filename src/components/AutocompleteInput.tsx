import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList } from 'react-native';
import { colors, spacing, radius } from '../theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
}

export function AutocompleteInput({ label, value, onChangeText, suggestions, placeholder }: Props) {
  const [show, setShow] = useState(false);

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
  ).slice(0, 5);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={v => { onChangeText(v); setShow(true); }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        placeholder={placeholder}
        placeholderTextColor={colors.textCaption}
      />
      {show && filtered.length > 0 && (
        <View style={styles.dropdown}>
          {filtered.map(s => (
            <Pressable key={s} style={styles.item} onPress={() => { onChangeText(s); setShow(false); }}>
              <Text style={styles.itemText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.sm, zIndex: 100 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textBody, marginBottom: 6 },
  input: { backgroundColor: colors.background, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, fontSize: 14, color: colors.textDark },
  dropdown: { position: 'absolute', top: 68, left: 0, right: 0, backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemText: { fontSize: 14, color: colors.textDark },
});
