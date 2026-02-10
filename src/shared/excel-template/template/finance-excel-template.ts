import { ExcelTemplateConfig } from '../excel-template.types';

/**
 * Interface cho data export Transactions
 */
export interface TransactionExcelData {
  stt: number | string;
  code: string;
  type: string;
  source: string;
  amount: number;
  payment_method: string;
  contact_name: string;
  description: string;
  notes: string;
  status: string;
  transaction_date: string;
}

/**
 * Interface cho data export Cash Book
 */
export interface CashBookExcelData {
  stt: number | string;
  date: string;
  opening_balance: number;
  total_receipts: number;
  total_payments: number;
  closing_balance: number;
  net_change: number;
}

/**
 * Template Excel cho danh sách giao dịch thu chi
 */
export const TRANSACTIONS_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Danh sách giao dịch',
  fileName: 'danh_sach_giao_dich.xlsx',
  columns: [
    { header: 'STT', key: 'stt', width: 10 },
    { header: 'Mã phiếu', key: 'code', width: 15 },
    { header: 'Loại', key: 'type', width: 24 },
    { header: 'Nguồn', key: 'source', width: 28 },
    { header: 'Số tiền (VNĐ)', key: 'amount', width: 18 },
    { header: 'Phương thức', key: 'payment_method', width: 18 },
    { header: 'Người liên hệ', key: 'contact_name', width: 36 },
    { header: 'Mô tả', key: 'description', width: 35 },
    { header: 'Ghi chú', key: 'notes', width: 30 },
    { header: 'Trạng thái', key: 'status', width: 15 },
    { header: 'Ngày giao dịch', key: 'transaction_date', width: 20 },
  ],
};

/**
 * Template Excel cho sổ quỹ tiền mặt
 */
export const CASH_BOOK_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Sổ quỹ tiền mặt',
  fileName: 'so_quy_tien_mat.xlsx',
  columns: [
    { header: 'STT', key: 'stt', width: 10 },
    { header: 'Ngày', key: 'date', width: 15 },
    { header: 'Số dư đầu kỳ (VNĐ)', key: 'opening_balance', width: 20 },
    { header: 'Tổng thu (VNĐ)', key: 'total_receipts', width: 20 },
    { header: 'Tổng chi (VNĐ)', key: 'total_payments', width: 20 },
    { header: 'Số dư cuối kỳ (VNĐ)', key: 'closing_balance', width: 20 },
    { header: 'Phát sinh thuần (VNĐ)', key: 'net_change', width: 20 },
  ],
};
