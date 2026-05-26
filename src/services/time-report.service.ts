import api from './api';

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

export async function downloadTimeReportPdf(id: string): Promise<string> {
  const res = await api.get(`/time-reports/${id}/download`, {
    responseType: 'arraybuffer',
  });
  const bytes = new Uint8Array(res.data);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
