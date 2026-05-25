import api from './api';

export async function getReportPreview(projectId: string) {
  const res = await api.get(`/projects/${projectId}/report/preview`);
  return res.data;
}

export async function sendReport(projectId: string) {
  const res = await api.post(`/projects/${projectId}/report/send`);
  return res.data;
}

export async function downloadReportPdf(projectId: string): Promise<string> {
  const res = await api.get(`/projects/${projectId}/report/download`, {
    responseType: 'arraybuffer',
  });
  // Convert arraybuffer to base64
  const bytes = new Uint8Array(res.data);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
