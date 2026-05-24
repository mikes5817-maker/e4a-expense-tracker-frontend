import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const GradientButton: React.FC<Props> = ({ title, onPress, loading, disabled, style }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || loading}
    style={({ pressed }) => [
      styles.wrapper,
      pressed && { transform: [{ scale: 0.97 }] },
      (disabled || loading) && { opacity: 0.5 },
      style,
    ]}
    accessibilityRole="button"
    accessibilityLabel={title}
  >
    <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
    </LinearGradient>
  </Pressable>
);

const styles = StyleSheet.create({
  wrapper: { borderRadius: radius.md, overflow: 'hidden' },
  gradient: { paddingVertical: 14, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  text: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
