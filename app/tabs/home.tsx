import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing, radius } from '../../src/theme';

const logo = require('../../assets/logo.png');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
        <Text style={styles.subtitle}>What would you like to do today?</Text>
      </View>

      <View style={styles.cards}>

        {/* Expense Report Card */}
        <Pressable
          style={({ pressed }) => [styles.card, styles.cardBlue, pressed && styles.pressed]}
          onPress={() => router.push('/tabs/projects')}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="receipt-outline" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.cardTitle}>Expense Report</Text>
          <Text style={styles.cardDesc}>Track project expenses, upload receipts, and generate expense reports</Text>
          <View style={styles.cardArrow}>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </View>
        </Pressable>

        {/* Time Report Card */}
        <Pressable
          style={({ pressed }) => [styles.card, styles.cardAmber, pressed && styles.pressed]}
          onPress={() => router.push('/tabs/time-reports')}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="time-outline" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.cardTitle}>Time Report</Text>
          <Text style={styles.cardDesc}>Log weekly work hours, project IDs, per diem, and generate time reports</Text>
          <View style={styles.cardArrow}>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </View>
        </Pressable>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { width: 120, height: 55, marginBottom: spacing.md },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.textDark, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textCaption },
  cards: { gap: spacing.md },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cardBlue: { backgroundColor: '#1E6FD9' },
  cardAmber: { backgroundColor: '#D4830A' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  cardIcon: { marginBottom: spacing.sm },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  cardArrow: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 6,
  },
});
