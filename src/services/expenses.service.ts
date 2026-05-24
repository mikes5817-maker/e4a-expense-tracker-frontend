import api from './api';
import { Expense, ExpenseCategory } from '../types';

export const getExpenses = async (projectId: string): Promise<Expense[]> => {
  const res = await api.get(`/projects/${projectId}/expenses`);
  return res?.data?.items ?? [];
};

export const getExpense = async (id: string): Promise<Expense> => {
  const res = await api.get(`/expenses/${id}`);
  return res?.data ?? {} as Expense;
};

export const createExpense = async (
  projectId: string,
  data: { employeeName: string; date: string; category: ExpenseCategory; customCategory?: string; amount: number; receiptFileId?: string },
): Promise<Expense> => {
  const res = await api.post(`/projects/${projectId}/expenses`, data);
  return res?.data ?? {} as Expense;
};

export const updateExpense = async (
  id: string,
  data: { employeeName?: string; date?: string; category?: ExpenseCategory; customCategory?: string; amount?: number; receiptFileId?: string | null },
): Promise<Expense> => {
  const res = await api.patch(`/expenses/${id}`, data);
  return res?.data ?? {} as Expense;
};

export const deleteExpense = async (id: string): Promise<void> => {
  await api.delete(`/expenses/${id}`);
};
