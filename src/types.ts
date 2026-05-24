export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Project {
  id: string;
  projectNumber: string;
  name: string;
  date: string;
  expenseCount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 'GasolinaDiesel' | 'Hotel' | 'Herramientas' | 'Material' | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['GasolinaDiesel', 'Hotel', 'Herramientas', 'Material', 'Other'];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  GasolinaDiesel: 'Gasolina/Diesel',
  Hotel: 'Hotel',
  Herramientas: 'Herramientas',
  Material: 'Material',
  Other: 'Otro',
};

export interface Expense {
  id: string;
  projectId: string;
  employeeName: string;
  date: string;
  category: ExpenseCategory;
  customCategory: string | null;
  amount: number;
  receiptFileId: string | null;
  receiptUrl: string | null;
  receiptFileName: string | null;
  receiptContentType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportPreview {
  projectId: string;
  projectNumber: string;
  projectName: string;
  projectDate: string;
  expenseCount: number;
  totalAmount: number;
  dateRange: { earliest: string | null; latest: string | null };
  categoryBreakdown: { category: string; subtotal: number; count: number }[];
}

export interface PresignedResponse {
  uploadUrl: string;
  cloud_storage_path: string;
}

export interface CompleteUploadResponse {
  id: string;
  cloud_storage_path: string;
}
