import api from './api';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export async function getReportPreview(projectId: string) {
  const res = await api.get(`/projects/${projectId}/report/preview`);
  return res.data;
}

export async function sendReport(projectId: string) {
  const res = await api.post(`/projects/${projectId}/report/send`);
  return res.data;
}

async function getToken(): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('auth_token') ?? '';
    }
    return (await AsyncStorage.getItem('auth_token')) ?? '';
  } catch {
    return '';
  }
}

export async function downloadReportPdf(projectId: string): Promise<string> {
  const token = await getToken();
  const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/').replace(/\/$/, '');
  const url = `${base}/api/projects/${projectId}/report/download`;

  const dest = FileSystem.cacheDirectory + `report_${projectId}_${Date.now()}.pdf`;
  const result = await FileSystem.downloadAsync(url, dest, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return await FileSystem.readAsStringAsync(result.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}
