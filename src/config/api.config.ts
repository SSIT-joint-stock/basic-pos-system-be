import { registerAs } from '@nestjs/config';

// register the app config
export default registerAs('api', () => ({
  bank_vn: process.env.BANK_API_VN ?? 'https://api.bankvietnam.vn/',
  provinces_vn:
    process.env.PROVINCES_API_VN ??
    'https://production.cas.so/address-kit/2025-07-01/provinces',
  viet_qr: process.env.VIET_QR_API ?? 'https://img.vietqr.io/image',
}));
