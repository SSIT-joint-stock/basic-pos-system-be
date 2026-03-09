import { ExcelTemplateConfig } from '../excel-template.types';
import { ImportProductSchema } from '../zod/import-product.schema';

export interface ProductVariantExcel {
  product_name: string;
  product_sku?: string;
  base_unit: string;
  category_name?: string;
  description?: string;

  // Variant info
  variant_name: string;
  variant_sku?: string;
  barcode?: string;
  price: number;
  cost?: number;
  quantity?: number;
}

const EXAMPLE_PRODUCTS = [
  {
    product_name: 'Coca Cola',
    product_sku: 'COCA001',
    base_unit: 'Lon',
    category_name: 'Đồ uống',
    description: 'Nước ngọt Coca Cola',
    variants: [
      {
        variant_name: 'Coca Cola Lon 330ml',
        variant_sku: 'COCA001-330',
        barcode: '8934588012011',
        price: 10000,
        cost: 7000,
        quantity: 200,
      },
      {
        variant_name: 'Coca Cola Chai 390ml',
        variant_sku: 'COCA001-390',
        barcode: '8934588012012',
        price: 12000,
        cost: 8500,
        quantity: 150,
      },
      {
        variant_name: 'Coca Cola Chai 1.5L',
        variant_sku: 'COCA001-1500',
        barcode: '8934588012013',
        price: 28000,
        cost: 21000,
        quantity: 80,
      },
    ],
  },

  {
    product_name: 'Pepsi',
    product_sku: 'PEPSI001',
    base_unit: 'Lon',
    category_name: 'Đồ uống',
    description: 'Nước ngọt Pepsi',
    variants: [
      {
        variant_name: 'Pepsi Lon 330ml',
        variant_sku: 'PEPSI001-330',
        barcode: '8934588023011',
        price: 10000,
        cost: 7000,
        quantity: 180,
      },
      {
        variant_name: 'Pepsi Chai 390ml',
        variant_sku: 'PEPSI001-390',
        barcode: '8934588023012',
        price: 12000,
        cost: 8500,
        quantity: 140,
      },
      {
        variant_name: 'Pepsi Chai 1.5L',
        variant_sku: 'PEPSI001-1500',
        barcode: '8934588023013',
        price: 27000,
        cost: 20000,
        quantity: 90,
      },
    ],
  },

  {
    product_name: 'Mì Hảo Hảo',
    product_sku: 'MI001',
    base_unit: 'Gói',
    category_name: 'Thực phẩm',
    description: 'Mì ăn liền Hảo Hảo',
    variants: [
      {
        variant_name: 'Mì Hảo Hảo Tôm Chua Cay',
        variant_sku: 'MI001-TCC',
        barcode: '8934563132011',
        price: 3500,
        cost: 2500,
        quantity: 300,
      },
      {
        variant_name: 'Mì Hảo Hảo Sa Tế Hành',
        variant_sku: 'MI001-STH',
        barcode: '8934563132012',
        price: 3500,
        cost: 2500,
        quantity: 250,
      },
      {
        variant_name: 'Mì Hảo Hảo Gà Vàng',
        variant_sku: 'MI001-GV',
        barcode: '8934563132013',
        price: 3500,
        cost: 2500,
        quantity: 220,
      },
    ],
  },

  {
    product_name: 'Sữa tươi Vinamilk',
    product_sku: 'SUA002',
    base_unit: 'Hộp',
    category_name: 'Sữa',
    description: 'Sữa tươi tiệt trùng Vinamilk',
    variants: [
      {
        variant_name: 'Vinamilk Ít Đường 180ml',
        variant_sku: 'SUA002-ID-180',
        barcode: '8934673001011',
        price: 15000,
        cost: 11000,
        quantity: 120,
      },
      {
        variant_name: 'Vinamilk Không Đường 180ml',
        variant_sku: 'SUA002-KD-180',
        barcode: '8934673001012',
        price: 15000,
        cost: 11000,
        quantity: 100,
      },
      {
        variant_name: 'Vinamilk Có Đường 110ml',
        variant_sku: 'SUA002-CD-110',
        barcode: '8934673001013',
        price: 10000,
        cost: 7000,
        quantity: 140,
      },
    ],
  },

  {
    product_name: 'Bánh Oreo',
    product_sku: 'BANH001',
    base_unit: 'Gói',
    category_name: 'Bánh kẹo',
    description: 'Bánh quy Oreo',
    variants: [
      {
        variant_name: 'Oreo Original 133g',
        variant_sku: 'BANH001-ORI',
        barcode: '8936009201011',
        price: 18000,
        cost: 13000,
        quantity: 90,
      },
      {
        variant_name: 'Oreo Chocolate 133g',
        variant_sku: 'BANH001-CHO',
        barcode: '8936009201012',
        price: 18000,
        cost: 13000,
        quantity: 80,
      },
    ],
  },

  {
    product_name: 'Trà xanh C2',
    product_sku: 'TRA001',
    base_unit: 'Chai',
    category_name: 'Đồ uống',
    description: 'Trà xanh C2',
    variants: [
      {
        variant_name: 'C2 Trà Xanh 360ml',
        variant_sku: 'TRA001-360',
        barcode: '8935049501011',
        price: 10000,
        cost: 7000,
        quantity: 160,
      },
      {
        variant_name: 'C2 Trà Chanh 360ml',
        variant_sku: 'TRA001-CHANH',
        barcode: '8935049501012',
        price: 10000,
        cost: 7000,
        quantity: 150,
      },
    ],
  },

  {
    product_name: 'Nước suối Aquafina',
    product_sku: 'NUOC001',
    base_unit: 'Chai',
    category_name: 'Đồ uống',
    description: 'Nước suối tinh khiết',
    variants: [
      {
        variant_name: 'Aquafina 500ml',
        variant_sku: 'NUOC001-500',
        barcode: '8934588031011',
        price: 7000,
        cost: 4500,
        quantity: 200,
      },
      {
        variant_name: 'Aquafina 1.5L',
        variant_sku: 'NUOC001-1500',
        barcode: '8934588031012',
        price: 12000,
        cost: 8500,
        quantity: 120,
      },
    ],
  },
];

export const PRODUCT_VARIANT_EXAMPLE_DATA: ProductVariantExcel[] =
  EXAMPLE_PRODUCTS.flatMap((p) =>
    p.variants.map((v) => ({
      product_name: p.product_name,
      product_sku: p.product_sku,
      base_unit: p.base_unit,
      category_name: p.category_name,
      description: p.description,
      ...v,
    })),
  );

export const PRODUCT_VARIANT_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Danh sách sản phẩm',
  fileName: 'template_san_pham_bien_the.xlsx',

  headerGroups: [
    {
      title: 'Thông tin sản phẩm chính',
      columns: [
        {
          header: 'Tên sản phẩm*',
          key: 'product_name',
          width: 25,
          merge: true,
        },
        {
          header: 'Mã sản phẩm (SKU)',
          key: 'product_sku',
          width: 15,
          merge: true,
        },
        { header: 'Đơn vị tính*', key: 'base_unit', width: 12, merge: true },
        {
          header: 'Tên danh mục',
          key: 'category_name',
          width: 30,
          merge: true,
        },
        {
          header: 'Mô tả sản phẩm',
          key: 'description',
          width: 36,
          merge: true,
        },
      ],
    },
    {
      title: 'Thông tin biến thể',
      columns: [
        { header: 'Tên biến thể*', key: 'variant_name', width: 40 },
        { header: 'Mã biến thể (SKU)', key: 'variant_sku', width: 15 },
        { header: 'Mã vạch (Barcode)', key: 'barcode', width: 15 },
        { header: 'Giá bán* (VND)', key: 'price', width: 12 },
        { header: 'Giá vốn (VND)', key: 'cost', width: 12 },
        { header: 'Tồn kho ban đầu', key: 'quantity', width: 12 },
      ],
    },
  ],
  columns: [
    { header: 'Tên sản phẩm*', key: 'product_name', width: 25, merge: true },
    { header: 'Mã sản phẩm (SKU)', key: 'product_sku', width: 15, merge: true },
    { header: 'Đơn vị tính*', key: 'base_unit', width: 12, merge: true },
    { header: 'Tên danh mục', key: 'category_name', width: 30, merge: true },
    { header: 'Mô tả sản phẩm', key: 'description', width: 36, merge: true },
    { header: 'Tên biến thể', key: 'variant_name', width: 40 },
    { header: 'Mã biến thể (SKU)', key: 'variant_sku', width: 15 },
    { header: 'Mã vạch (Barcode)', key: 'barcode', width: 15 },
    { header: 'Giá bán (VND)', key: 'price', width: 12 },
    { header: 'Giá vốn (VND)', key: 'cost', width: 12 },
    { header: 'Tồn kho ban đầu', key: 'quantity', width: 12 },
  ],
  schema: ImportProductSchema,
  exampleData: PRODUCT_VARIANT_EXAMPLE_DATA,
  note: {
    text:
      'LƯU Ý:\n' +
      '- Các cột có dấu (*) là bắt buộc\n' +
      '- Giá nhập, Giá bán, Số lượng phải là số\n' +
      '- VAT, Chiết khấu nhập từ 0–100\n' +
      '- Không thay đổi tên hoặc thứ tự cột\n' +
      '- Nếu không nhập mã sản phẩm, hệ thống sẽ tự động tạo mã sản phẩm\n' +
      '- Nếu không nhập mã biến thể, hệ thống sẽ tự động tạo mã biến thể\n' +
      '- Với các sản phẩm không có thông tin biến thể hệ thống sẽ tự đông tạo 1 biến thể mặc định theo tên sản phẩm gốc',
    // height: 70,
    position: 'top',
    backgroundColor: 'FFF2F2F2',
  },
};
