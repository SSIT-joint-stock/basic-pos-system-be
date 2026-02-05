import { ExcelTemplateConfig } from 'app/shared/excel-template/excel-template.types';
import { PurchaseOrderSchema } from 'app/shared/excel-template/zod/import-purchase-order.schame';
export interface PurchaseOrderExcel {
  item_name: string;
  base_unit: string;
  category: string;
  sku: string;
  barcode: string;
  unit_cost: number;
  price: number;
  quantity: number;
  tax_rate: number;
  discount_rate: number;
  notes: string;
}
export const EXAMPLE_PRODUCT_DATA = [
  {
    item_name: 'Gạo ST25 túi 5kg',
    base_unit: 'túi',
    category: 'Gạo',
    sku: 'GAO-ST25-5KG',
    barcode: '8938502000001',
    unit_cost: 120000,
    price: 145000,
    quantity: 40,
    tax_rate: 5,
    discount_rate: 0,
    notes: '2026-01-30',
  },
  {
    item_name: 'Gạo Jasmine túi 5kg',
    base_unit: 'túi',
    category: 'Gạo',
    sku: 'GAO-JAS-5KG',
    barcode: '8938502000002',
    unit_cost: 105000,
    price: 125000,
    quantity: 50,
    tax_rate: 5,
    discount_rate: 0,
    notes: '2026-01-30',
  },
  {
    item_name: 'Mì Hảo Hảo tôm chua cay',
    base_unit: 'gói',
    category: 'Mì gói',
    sku: 'MI-HH-TCC',
    barcode: '8938502000003',
    unit_cost: 3500,
    price: 5000,
    quantity: 300,
    tax_rate: 8,
    discount_rate: 0,
    notes: '2026-01-30',
  },
  {
    item_name: 'Mì Omachi bò hầm',
    base_unit: 'gói',
    category: 'Mì gói',
    sku: 'MI-OM-BH',
    barcode: '8938502000004',
    unit_cost: 6500,
    price: 9000,
    quantity: 200,
    tax_rate: 8,
    discount_rate: 0,
    notes: '2026-01-30',
  },
  {
    item_name: 'Nước mắm Nam Ngư 500ml',
    base_unit: 'chai',
    category: 'Gia vị',
    sku: 'NM-NAMNGU-500',
    barcode: '8938502000005',
    unit_cost: 28000,
    price: 38000,
    quantity: 80,
    tax_rate: 10,
    discount_rate: 0,
    notes: '2026-01-30',
  },
  {
    item_name: 'Muối i-ốt gói 500g',
    base_unit: 'gói',
    category: 'Gia vị',
    sku: 'MUOI-IOT-500',
    barcode: '8938502000007',
    unit_cost: 6000,
    price: 9000,
    quantity: 120,
    tax_rate: 5,
    discount_rate: 0,
    notes: '2026-01-30',
  },
  {
    item_name: 'Dầu ăn Simply 1L',
    base_unit: 'chai',
    category: 'Dầu ăn',
    sku: 'DA-SIM-1L',
    barcode: '8938502000009',
    unit_cost: 42000,
    price: 56000,
    quantity: 60,
    tax_rate: 10,
    discount_rate: 0,
    notes: '2026-01-30',
  },
  {
    item_name: 'Sữa tươi Vinamilk 1L',
    base_unit: 'hộp',
    category: 'Sữa',
    sku: 'SUA-VM-1L',
    barcode: '8938502000011',
    unit_cost: 28000,
    price: 36000,
    quantity: 100,
    tax_rate: 5,
    discount_rate: 0,
    notes: '2026-01-30',
  },
  {
    item_name: 'Nước ngọt Coca-Cola lon',
    base_unit: 'lon',
    category: 'Nước giải khát',
    sku: 'COCA-LON',
    barcode: '8938502000013',
    unit_cost: 7000,
    price: 12000,
    quantity: 200,
    tax_rate: 10,
    discount_rate: 0,
    notes: '2026-01-30',
  },
  {
    item_name: 'Bột giặt OMO 3kg',
    base_unit: 'túi',
    category: 'Hóa phẩm',
    sku: 'BG-OMO-3KG',
    barcode: '8938502000018',
    unit_cost: 98000,
    price: 125000,
    quantity: 40,
    tax_rate: 10,
    discount_rate: 5,
    notes: '2026-01-30',
  },
  {
    item_name: 'Giấy vệ sinh Bless You',
    base_unit: 'gói',
    category: 'Giấy tiêu dùng',
    sku: 'GV-BY',
    barcode: '8938502000020',
    unit_cost: 38000,
    price: 52000,
    quantity: 60,
    tax_rate: 8,
    discount_rate: 0,
    notes: '2026-01-30',
  },
];

export const EXAMPLE_PURCHASE_ORDER_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Phiếu nhập hàng',
  fileName: 'mau_phieu_nhap_hang.xlsx',

  columns: [
    { header: 'Tên sản phẩm *', key: 'item_name', width: 30 },
    { header: 'Đơn vị ', key: 'base_unit', width: 30 },
    { header: 'Danh mục', key: 'category', width: 20 },
    { header: 'SKU *', key: 'sku', width: 18 },
    { header: 'Barcode', key: 'barcode', width: 20 },
    { header: 'Giá nhập *', key: 'unit_cost', width: 16 },
    { header: 'Giá bán', key: 'price', width: 16 },
    { header: 'Số lượng *', key: 'quantity', width: 14 },
    { header: 'VAT (%)', key: 'tax_rate', width: 12 },
    { header: 'Chiết khấu (%)', key: 'discount_rate', width: 16 },
    { header: 'Ghi chú', key: 'notes', width: 18 },
  ],

  exampleData: EXAMPLE_PRODUCT_DATA,
  schema: PurchaseOrderSchema,
  note: {
    text:
      'LƯU Ý:\n' +
      '- Các cột có dấu (*) là bắt buộc\n' +
      '- Giá nhập, Giá bán, Số lượng phải là số\n' +
      '- VAT, Chiết khấu nhập từ 0–100\n' +
      '- Không thay đổi tên hoặc thứ tự cột',
    // height: 70,
    position: 'top',
    backgroundColor: 'FFF2F2F2',
  },
};
