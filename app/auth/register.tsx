import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { InputField } from '../../src/components/InputField';
import { GradientButton } from '../../src/components/GradientButton';
import { colors, spacing, radius } from '../../src/theme';

const logo = require('../../assets/logo.png');

export default function RegisterScreen() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!name?.trim()) { setError('Name is required'); return; }
    if (!email?.trim()) { setError('Email is required'); return; }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await signup(email.trim(), password, name.trim());
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={colors.gradientPrimary} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <View style={styles.card}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up to get started</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <InputField label="Full Name" value={name} onChangeText={setName} placeholder="Jane Doe" />
              <InputField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
              <InputField label="Password" value={password} onChangeText={setPassword} placeholder="Min 6 characters" secureTextEntry />
              <InputField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat password" secureTextEntry />
              <GradientButton title="Sign Up" onPress={handleRegister} loading={loading} style={{ marginTop: spacing.sm }} />
              <Pressable onPress={() => router.back()} style={styles.link}>
                <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Log In</Text></Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  logo: { width: 100, height: 50, alignSelf: 'center', marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: '700', color: colors.textDark, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.textCaption, textAlign: 'center', marginBottom: spacing.md },
  error: { backgroundColor: colors.error + '15', color: colors.error, fontSize: 13, padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.sm, textAlign: 'center' },
  link: { marginTop: spacing.md, alignItems: 'center' },
  linkText: { fontSize: 14, color: colors.textBody },
  linkBold: { color: colors.primary, fontWeight: '600' },
});