import { ExcelTemplateConfig } from '../excel-template.types';
export interface OrderExcel {
  code: string;
  createdAt: string;
  status: string;
  payment_method: string;

  customer_name: string;
  email: string;
  phone: string;

  product_name: string;
  quantity: number;
  price: string;

  total: string;
  paid: string;
  remain: string;
}
export const ORDER_EXAMPLE_DATA = [
  {
    code: 'DH001',
    createdAt: '2024-12-01',
    status: 'Đã thanh toán',

    customer_name: 'Nguyễn Văn A',
    email: 'nguyenvana@gmail.com',
    phone: '0901234567',

    product_name: 'Cà phê sữa',
    quantity: 2,
    price: 30000,

    total: 60000,
    paid: 60000,
    remain: 0,
  },
  {
    code: 'DH002',
    createdAt: '2024-12-02',
    status: 'Chưa thanh toán',

    customer_name: 'Trần Thị B',
    email: 'tranthib@gmail.com',
    phone: '0912345678',

    product_name: 'Trà sữa trân châu',
    quantity: 1,
    price: 45000,

    total: 45000,
    paid: 20000,
    remain: 25000,
  },
];

export const ORDER_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Order',
  fileName: 'don_hang.xlsx',
  headerGroups: [
    {
      title: 'Đơn hàng',
      columns: [
        {
          header: 'Mã đơn',
          key: 'code',
          width: 12,
          merge: true,
        },
        {
          header: 'Ngày tạo đơn',
          key: 'createdAt',
          width: 28,
          merge: true,
        },
        {
          header: 'Trạng thái',
          key: 'status',
          width: 18,
          merge: true,
        },
        {
          header: 'Phương thức thanh toán',
          key: 'payment_method',
          width: 20,
          merge: true,
        },
      ],
    },
    {
      title: 'Khách hàng',
      columns: [
        {
          header: 'Tên khách hàng',
          key: 'customer_name',
          merge: true,
        },
        {
          header: 'Email',
          key: 'email',
          width: 16,
          merge: true,
        },
        {
          header: 'Số điện thoại',
          key: 'phone',
          width: 16,
          merge: true,
        },
      ],
    },
    {
      title: 'Sản phẩm mua',
      columns: [
        {
          header: 'Tên sản phẩm',
          key: 'product_name',
          merge: false,
        },
        {
          header: 'Số lượng',
          key: 'quantity',
          width: 12,
          merge: false,
        },
        {
          header: 'Đơn giá',
          key: 'price',
          width: 24,
          merge: false,
        },
      ],
    },
    {
      title: 'Thông tin thanh toán',

      columns: [
        {
          header: 'Tổng tiền',
          key: 'total',
          width: 14,
          merge: true,
        },
        {
          header: 'Thanh toán',
          key: 'paid',
          width: 14,
          merge: true,
        },
        {
          header: 'Còn nợ',
          key: 'remain',
          width: 14,
          merge: true,
        },
      ],
    },
  ],
  columns: [],
  exampleData: ORDER_EXAMPLE_DATA,
};
