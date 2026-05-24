import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { LoadingSplash } from '../../src/components/LoadingSplash';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSplash />;
  if (isAuthenticated) return <Redirect href="/tabs/projects" />;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
