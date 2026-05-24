import api from './api';
import { ReportPreview } from '../types';

export const getReportPreview = async (projectId: string): Promise<ReportPreview> => {
  const res = await api.get(`/projects/${projectId}/report/preview`);
  return res?.data ?? {} as ReportPreview;
};

export const sendReport = async (projectId: string): Promise<{ success: boolean; message: string }> => {
  const res = await api.post(`/projects/${projectId}/report/send`);
  return res?.data ?? { success: false, message: 'Unknown error' };
};
