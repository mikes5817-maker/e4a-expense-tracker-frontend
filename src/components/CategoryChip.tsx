import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';
import { CATEGORY_LABELS, type ExpenseCategory } from '../types';

interface Props {
  category: string;
  customCategory?: string | null;
  small?: boolean;
}

export const CategoryChip: React.FC<Props> = ({ category, customCategory, small }) => {
  const color = colors.categoryColors?.[category] ?? '#6B7280';
  const label = category === 'Other' && customCategory
    ? customCategory
    : CATEGORY_LABELS?.[category as ExpenseCategory] ?? category;
  return (
    <View style={[styles.chip, { backgroundColor: color + '1A' }, small && styles.small]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, small && styles.smallText]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  small: { paddingHorizontal: 8, paddingVertical: 3 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  text: { fontSize: 13, fontWeight: '600' },
  smallText: { fontSize: 11 },
});
