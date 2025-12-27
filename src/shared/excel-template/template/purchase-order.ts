import { ExcelTemplateConfig } from '../excel-template.types';

export interface PurchaseOrderExcel {
  order_number: string;
  order_date: string;
  expected_date?: string;
  received_date?: string;

  supplier_code?: string;
  supplier_name?: string;

  status: string;
  payment_status: string;
  payment_method?: string;

  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_fee: number;
  total: number;
  paid_amount: number;
  remain_amount: number;

  notes?: string;
}
export const PURCHASE_ORDER_EXAMPLE_DATA: PurchaseOrderExcel[] = [
  {
    order_number: 'DNH00001',
    order_date: '2024-12-01',
    expected_date: '2024-12-05',
    received_date: '2024-12-05',

    supplier_code: 'NCC00001',
    supplier_name: 'Công ty Thực Phẩm Minh Long',

    status: 'Chờ xử lý',
    payment_status: 'Chưa thanh toán',
    payment_method: 'Chuyển khoản',

    subtotal: 1000000,
    discount_amount: 50000,
    tax_amount: 95000,
    shipping_fee: 30000,
    total: 1075000,
    paid_amount: 500000,
    remain_amount: 575000,

    notes: 'Nhập hàng đầu tháng',
  },
  {
    order_number: 'DNH00002',
    order_date: '2024-12-03',
    expected_date: '2024-12-08',

    supplier_code: 'NCC00002',
    supplier_name: 'Nhà cung cấp An Phát',

    status: 'Đã duyệt',
    payment_status: 'Đã thanh toán',
    payment_method: 'Tiền mặt',

    subtotal: 750000,
    discount_amount: 0,
    tax_amount: 75000,
    shipping_fee: 20000,
    total: 845000,
    paid_amount: 845000,
    remain_amount: 0,

    notes: '',
  },
  {
    order_number: 'DNH00003',
    order_date: '2024-12-05',
    expected_date: '2024-12-10',

    supplier_code: 'NCC00003',
    supplier_name: 'Công ty Vina Food',

    status: 'Đang nhận hàng',
    payment_status: 'Chưa thanh toán',

    subtotal: 420000,
    discount_amount: 20000,
    tax_amount: 40000,
    shipping_fee: 15000,
    total: 455000,
    paid_amount: 0,
    remain_amount: 455000,

    notes: 'Chưa nhận đủ hàng',
  },
  {
    order_number: 'DNH00004',
    order_date: '2024-12-07',

    supplier_code: 'NCC00004',
    supplier_name: 'Nhà cung cấp Hoàng Gia',

    status: 'Hoàn thành',
    payment_status: 'Đã thanh toán',
    payment_method: 'Chuyển khoản',

    subtotal: 1200000,
    discount_amount: 100000,
    tax_amount: 110000,
    shipping_fee: 40000,
    total: 1250000,
    paid_amount: 1250000,
    remain_amount: 0,

    notes: 'Đã nhận đủ hàng',
  },
  {
    order_number: 'DNH00005',
    order_date: '2024-12-09',

    supplier_code: 'NCC00005',
    supplier_name: 'Công ty Thịnh Phát',

    status: 'Đã hủy',
    payment_status: 'Chưa thanh toán',

    subtotal: 300000,
    discount_amount: 0,
    tax_amount: 30000,
    shipping_fee: 0,
    total: 330000,
    paid_amount: 0,
    remain_amount: 330000,

    notes: 'Nhà cung cấp không giao hàng',
  },
];

export const PURCHASE_ORDER_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Phiếu nhập hàng',
  fileName: 'phieu_nhap_hang.xlsx',

  headerGroups: [
    {
      title: 'Thông tin phiếu nhập',
      columns: [
        { header: 'Mã phiếu nhập', key: 'order_number', width: 16 },
        { header: 'Ngày đặt hàng', key: 'order_date', width: 18 },
        { header: 'Ngày dự kiến nhận', key: 'expected_date', width: 20 },
        { header: 'Ngày nhận thực tế', key: 'received_date', width: 20 },
      ],
    },
    {
      title: 'Nhà cung cấp',
      columns: [
        { header: 'Mã nhà cung cấp', key: 'supplier_code', width: 18 },
        { header: 'Tên nhà cung cấp', key: 'supplier_name', width: 28 },
      ],
    },
    {
      title: 'Trạng thái',
      columns: [
        { header: 'Trạng thái đơn', key: 'status', width: 18 },
        { header: 'Trạng thái thanh toán', key: 'payment_status', width: 22 },
        { header: 'Phương thức thanh toán', key: 'payment_method', width: 22 },
      ],
    },
    {
      title: 'Thông tin tài chính',
      columns: [
        { header: 'Tạm tính', key: 'subtotal', width: 16 },
        { header: 'Chiết khấu', key: 'discount_amount', width: 16 },
        { header: 'Thuế', key: 'tax_amount', width: 16 },
        { header: 'Phí vận chuyển', key: 'shipping_fee', width: 18 },
        { header: 'Tổng cộng', key: 'total', width: 18 },
        { header: 'Đã thanh toán', key: 'paid_amount', width: 18 },
        { header: 'Còn nợ', key: 'remain_amount', width: 18 },
      ],
    },
    {
      title: 'Ghi chú',
      columns: [{ header: 'Ghi chú', key: 'notes', width: 32 }],
    },
  ],

  columns: [],
  exampleData: PURCHASE_ORDER_EXAMPLE_DATA,
};
