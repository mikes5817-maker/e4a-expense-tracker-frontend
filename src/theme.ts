import { Platform } from 'react-native';

export const colors = {
  primary: '#1E6FD9',
  primaryDark: '#1558B0',
  accent: '#38BDF8',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  textDark: '#1A2332',
  textBody: '#4A5568',
  textCaption: '#718096',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  border: '#E2E8F0',
  gradientPrimary: ['#1E6FD9', '#38BDF8'] as const,
  categoryColors: {
    GasolinaDiesel: '#F59E0B',
    Hotel: '#8B5CF6',
    Herramientas: '#3B82F6',
    Material: '#10B981',
    Other: '#6B7280',
  } as Record<string, string>,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const fonts = {
  heading: Platform.select({ ios: 'System', android: 'Roboto', default: 'Arial, sans-serif' }) ?? 'System',
  body: Platform.select({ ios: 'System', android: 'Roboto', default: 'Arial, sans-serif' }) ?? 'System',
};
