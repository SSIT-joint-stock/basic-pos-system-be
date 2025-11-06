export function generateVietQRUrl({
  bankCode = '',
  bankAccountNumber = '',
  bankAccountName = '',
  amount,
  addInfo = 'Thanh toan don hang',
  template = 'compact2',
}: {
  bankCode?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  amount?: number;
  addInfo?: string;
  template?: 'compact2' | 'compact' | 'qr_only' | 'print';
}) {
  const baseUrl = 'https://img.vietqr.io/image';
  const params = new URLSearchParams();

  if (amount) params.append('amount', amount.toString());
  if (addInfo) params.append('addInfo', addInfo);

  params.append('accountName', bankAccountName);
  return `${baseUrl}/${bankCode}-${bankAccountNumber}-${template}.png?${params.toString()}`;
}
