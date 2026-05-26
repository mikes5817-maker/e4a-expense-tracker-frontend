import api from './api';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export async function getTimeReports() {
  const res = await api.get('/time-reports');
  return res.data;
}

export async function getTimeReport(id: string) {
  const res = await api.get(`/time-reports/${id}`);
  return res.data;
}

export async function createTimeReport(data: any) {
  const res = await api.post('/time-reports', data);
  return res.data;
}

async function getToken(): Promise<string> {
  try {
    if (Platform.OS === 'web') return localStorage.getItem('auth_token') ?? '';
    return (await AsyncStorage.getItem('auth_token')) ?? '';
  } catch { return ''; }
}

export async function downloadTimeReportPdf(id: string): Promise<string> {
  const token = await getToken();
  const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/').replace(/\/$/, '');
  const url = `${base}/api/time-reports/${id}/download`;
  const dest = FileSystem.cacheDirectory + `timereport_${id}_${Date.now()}.pdf`;
  const result = await FileSystem.downloadAsync(url, dest, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await FileSystem.readAsStringAsync(result.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}
