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

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email?.trim()) { setError('Email is required'); return; }
    if (!password) { setError('Password is required'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Login failed. Please try again.';
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
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <InputField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
              <InputField label="Password" value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry />
              <GradientButton title="Log In" onPress={handleLogin} loading={loading} style={{ marginTop: spacing.sm }} />
              <Pressable onPress={() => router.push('/auth/register')} style={styles.link}>
                <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
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