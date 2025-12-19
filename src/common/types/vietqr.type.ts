export interface GenerateVietQRDto {
  bank_code: string;
  bank_account_number: string;
  bank_name: string;
  amount?: number;
  add_info?: string;
  template?: 'compact2' | 'compact' | 'qr_only' | 'print';
}
