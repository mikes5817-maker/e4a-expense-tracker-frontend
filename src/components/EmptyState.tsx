import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { GradientButton } from './GradientButton';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<Props> = ({ icon, title, subtitle, actionLabel, onAction }) => (
  <View style={styles.container}>
    <Ionicons name={icon} size={64} color={colors.textCaption} />
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {actionLabel && onAction ? <GradientButton title={actionLabel} onPress={onAction} style={{ marginTop: spacing.md }} /> : null}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  title: { fontSize: 18, fontWeight: '600', color: colors.textDark, marginTop: spacing.md, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textCaption, marginTop: spacing.xs, textAlign: 'center' },
});
