import api from './api';
import { PresignedResponse, CompleteUploadResponse } from '../types';

export const getPresignedUrl = async (fileName: string, contentType: string): Promise<PresignedResponse> => {
  const res = await api.post('/upload/presigned', { fileName, contentType, isPublic: false });
  return res?.data ?? { uploadUrl: '', cloud_storage_path: '' };
};

export const uploadFileToS3 = async (
  uploadUrl: string,
  fileUri: string,
  contentType: string,
  onProgress?: (progress: number) => void,
): Promise<void> => {
  const fileResponse = await fetch(fileUri);
  const blob = await fileResponse.blob();

  // Check X-Amz-SignedHeaders
  const headers: Record<string, string> = { 'Content-Type': contentType };
  try {
    const urlObj = new URL(uploadUrl);
    const signedHeaders = urlObj.searchParams.get('X-Amz-SignedHeaders') ?? '';
    if (signedHeaders.includes('content-disposition')) {
      headers['Content-Disposition'] = 'attachment';
    }
  } catch {
    // ignore URL parse errors
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(e.loaded / e.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Upload network error'));
    xhr.send(blob);
  });
};

export const completeUpload = async (
  cloud_storage_path: string,
  fileName: string,
  contentType: string,
  fileSize?: number,
): Promise<CompleteUploadResponse> => {
  const res = await api.post('/upload/complete', { cloud_storage_path, fileName, contentType, fileSize });
  return res?.data ?? { id: '', cloud_storage_path: '' };
};

export const getFileUrl = async (fileId: string, mode: 'view' | 'download' = 'view'): Promise<string> => {
  const res = await api.get(`/files/${fileId}/url`, { params: { mode } });
  return res?.data?.url ?? '';
};

export const deleteFile = async (fileId: string): Promise<void> => {
  await api.delete(`/files/${fileId}`);
};
