import api from './api';
import { Project } from '../types';

export const getProjects = async (search?: string): Promise<Project[]> => {
  const params = search ? { search } : {};
  const res = await api.get('/projects', { params });
  return res?.data?.items ?? [];
};

export const getProject = async (id: string): Promise<Project> => {
  const res = await api.get(`/projects/${id}`);
  return res?.data ?? {} as Project;
};

export const createProject = async (data: { projectNumber: string; name: string; date: string }): Promise<Project> => {
  const res = await api.post('/projects', data);
  return res?.data ?? {} as Project;
};

export const updateProject = async (id: string, data: { projectNumber?: string; name?: string; date?: string }): Promise<Project> => {
  const res = await api.patch(`/projects/${id}`, data);
  return res?.data ?? {} as Project;
};

export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/projects/${id}`);
};
