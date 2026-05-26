export type ExpenseCategory = 'GasolinaDiesel' | 'Hotel' | 'Herramientas' | 'Material' | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'GasolinaDiesel',
  'Hotel',
  'Herramientas',
  'Material',
  'Other',
];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  GasolinaDiesel: 'Gas/Diesel',
  Hotel: 'Hotel',
  Herramientas: 'Tools',
  Material: 'Material',
  Other: 'Other',
};

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
