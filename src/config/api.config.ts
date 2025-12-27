import { registerAs } from '@nestjs/config';

// register the app config
export default registerAs('api', () => ({
  bank_vn: process.env.BANK_API_VN ?? 'https://api.bankvietnam.vn/',
  provinces_vn:
    process.env.PROVINCES_API_VN ??
    'https://production.cas.so/address-kit/2025-07-01/provinces',
  viet_qr: process.env.QR_API_VN ?? 'https://img.vietqr.io/image',
  tax_code_vn:
    process.env.TAX_CODE_API_VN ?? 'https://api.vietqr.io/v2/business',

  fe_url: process.env.FE_URL ?? 'http://localhost:3000',
}));
