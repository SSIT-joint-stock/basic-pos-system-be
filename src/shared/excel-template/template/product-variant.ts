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
    product_name: 'Áo thun Cotton Premium',
    product_sku: 'AT001',
    base_unit: 'Cái',
    category_name: 'Thời trang nam',
    description: 'Áo thun chất liệu 100% cotton thoáng mát',
    variants: [
      {
        variant_name: 'Áo thun Cotton Premium - Trắng - S',
        variant_sku: 'AT001-WHT-S',
        barcode: '8930000001',
        price: 250000,
        cost: 120000,
        quantity: 50,
      },
      {
        variant_name: 'Áo thun Cotton Premium - Trắng - M',
        variant_sku: 'AT001-WHT-M',
        barcode: '8930000002',
        price: 250000,
        cost: 120000,
        quantity: 40,
      },
      {
        variant_name: 'Áo thun Cotton Premium - Trắng - L',
        variant_sku: 'AT001-WHT-L',
        barcode: '8930000008',
        price: 250000,
        cost: 120000,
        quantity: 35,
      },
      {
        variant_name: 'Áo thun Cotton Premium - Đen - S',
        variant_sku: 'AT001-BLK-S',
        barcode: '8930000006',
        price: 260000,
        cost: 130000,
        quantity: 45,
      },
      {
        variant_name: 'Áo thun Cotton Premium - Đen - M',
        variant_sku: 'AT001-BLK-M',
        barcode: '8930000007',
        price: 260000,
        cost: 130000,
        quantity: 40,
      },
      {
        variant_name: 'Áo thun Cotton Premium - Đen - L',
        variant_sku: 'AT001-BLK-L',
        barcode: '8930000003',
        price: 260000,
        cost: 130000,
        quantity: 30,
      },
    ],
  },
  {
    product_name: 'Sữa tươi Tiệt trùng',
    product_sku: 'SUA001',
    base_unit: 'Hộp',
    category_name: 'Thực phẩm',
    description: 'Sữa tươi nguyên chất tiệt trùng',
    variants: [
      {
        variant_name: 'Sữa tươi Tiệt trùng ít đường 180ml',
        variant_sku: 'SUA001-ID-180',
        barcode: '8930000004',
        price: 15000,
        cost: 10000,
        quantity: 100,
      },
      {
        variant_name: 'Sữa tươi Tiệt trùng ít đường 110ml',
        variant_sku: 'SUA001-ID-110',
        barcode: '8930000009',
        price: 10000,
        cost: 7000,
        quantity: 120,
      },
      {
        variant_name: 'Sữa tươi Tiệt trùng không đường 180ml',
        variant_sku: 'SUA001-KD-180',
        barcode: '8930000005',
        price: 15500,
        cost: 10500,
        quantity: 80,
      },
      {
        variant_name: 'Sữa tươi Tiệt trùng không đường 110ml',
        variant_sku: 'SUA001-KD-110',
        barcode: '8930000010',
        price: 10500,
        cost: 7500,
        quantity: 90,
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
