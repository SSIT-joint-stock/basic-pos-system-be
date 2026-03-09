import { ExcelTemplateConfig } from '../excel-template.types';

export const INVENTORY_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Inventory',
  fileName: 'ton_kho.xlsx',
  headerGroups: [
    {
      title: 'Sản phẩm',
      columns: [
        {
          header: 'Mã sản phẩm (SKU)',
          key: 'product_sku',
          width: 16,
          merge: true,
        },
        {
          header: 'Tên sản phẩm',
          key: 'product_name',
          width: 30,
          merge: true,
        },
        {
          header: 'Đơn vị gốc',
          key: 'base_unit',
          width: 18,
          merge: true,
        },
        {
          header: 'Trạng thái',
          key: 'product_status',
          width: 18,
          merge: true,
        },
      ],
    },
    {
      title: 'Biến thể',
      columns: [
        {
          header: 'Tên biến thể',
          key: 'variant_name',
          width: 40,
          // merge: true,
        },
        {
          header: 'Mã biến thể',
          key: 'variant_sku',
          width: 18,
          // merge: true,
        },
        {
          header: 'Mã vạch (barcode)',
          key: 'variant_barcode',
          width: 20,
          // merge: true,
        },
        {
          header: 'Đơn vị quy đổi',
          key: 'variant_unit',
          width: 28,
          // merge: true,
        },
        {
          header: 'Giá bán',
          key: 'variant_price',
          width: 16,
          // merge: true,
        },
        {
          header: 'Giá nhập',
          key: 'variant_cost',
          width: 16,
          // merge: true,
        },
        {
          header: 'Số lượng tồn kho',
          key: 'variant_stock',
          width: 16,
          // merge: true,
        },
      ],
    },
  ],
  columns: [],
};
