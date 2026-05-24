import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { LoadingSplash } from '../src/components/LoadingSplash';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSplash />;
  if (isAuthenticated) return <Redirect href="/tabs/projects" />;
  return <Redirect href="/auth/login" />;
}
