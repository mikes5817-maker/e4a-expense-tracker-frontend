import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, type KeyboardTypeOptions, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  style?: StyleProp<ViewStyle>;
  multiline?: boolean;
  editable?: boolean;
}

export const InputField: React.FC<Props> = ({
  label, value, onChangeText, placeholder, secureTextEntry, keyboardType, error, style, multiline, editable = true,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, focused && { color: colors.primary }, error ? { color: colors.error } : undefined]}>{label}</Text>
      <View style={[styles.inputWrapper, focused && styles.focused, error ? styles.errorBorder : undefined]}>
        <TextInput
          style={[styles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textCaption}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          editable={editable}
          accessibilityLabel={label}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} accessibilityLabel="Toggle password visibility">
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textCaption} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.textBody, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: '#FAFBFC',
  },
  focused: { borderColor: colors.primary },
  errorBorder: { borderColor: colors.error },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textDark },
  eyeIcon: { paddingHorizontal: 12 },
  errorText: { fontSize: 12, color: colors.error, marginTop: 4 },
});
