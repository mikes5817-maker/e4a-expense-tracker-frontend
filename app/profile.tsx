import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../src/context/AuthContext';
import { colors, spacing, radius } from '../src/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const initials = (user?.name ?? '').split(' ').map((n) => n?.[0] ?? '').join('').toUpperCase().slice(0, 2) || '?';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <LinearGradient colors={colors.gradientPrimary} style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>
        <Text style={styles.name}>{user?.name ?? 'Unknown'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
      </View>
      <View style={styles.bottom}>
        <Pressable style={styles.logoutBtn} onPress={logout} accessibilityLabel="Log out">
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textDark },
  content: { alignItems: 'center', paddingTop: spacing.xxl },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: colors.textDark, marginTop: spacing.md },
  email: { fontSize: 14, color: colors.textCaption, marginTop: 4 },
  bottom: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg, paddingBottom: spacing.xxl },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.error },
});
