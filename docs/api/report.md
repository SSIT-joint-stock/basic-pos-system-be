# Report API Routes

> Phiên bản: **v1**  
> Base URL: `http://localhost:3000`  
> Tất cả các endpoint trong tài liệu này **yêu cầu xác thực** bằng **Access Token** (JWT) theo chuẩn `Authorization: Bearer <access_token>`.

> **Lưu ý:** Báo cáo dùng **storeId trong token** (được set qua API `POST /auth/set-current-store/:storeId`).

---

# Phân quyền (Permissions)

## Yêu cầu quyền theo API

| **Endpoint**                   | **Method** | **Quyền tối thiểu** |
| ------------------------------ | ---------- | ------------------- |
| `/report/customers`            | GET        | `REPORT_READ`       |
| `/report/suppliers`            | GET        | `REPORT_READ`       |
| `/report/supplier/:supplierId` | GET        | `REPORT_READ`       |
| `/report/order-items`          | GET        | `REPORT_READ`       |
| `/report/stocks`               | GET        | `REPORT_READ`       |
| `/report/stock-ledger`         | GET        | `REPORT_READ`       |
| `/report/purchase-returns`     | GET        | `REPORT_READ`       |
| `/report/order-returns`        | GET        | `REPORT_READ`       |
| `/report/purchase-invoices`    | GET        | `REPORT_READ`       |
| `/report/excel/customers`      | GET        | `REPORT_READ`       |
| `/report/excel/suppliers`      | GET        | `REPORT_READ`       |
| `/report/excel/order-items`    | GET        | `REPORT_READ`       |
| `/report/excel/stocks`         | GET        | `REPORT_READ`       |
| `/report/excel/stock-ledger`   | GET        | `REPORT_READ`       |
| `/report/excel/purchase-returns` | GET      | `REPORT_READ`       |
| `/report/excel/order-returns`  | GET        | `REPORT_READ`       |
| `/report/excel/purchase-invoices` | GET     | `REPORT_READ`       |

> **OWNER** có thể gọi tất cả các endpoint nếu được cấp `REPORT_ALL`.

---

# 1. Báo cáo Khách hàng

## 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/report/customers`             |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `REPORT_READ`                   |

## 1.2 Query Parameters

| Tên         | Kiểu              | Bắt buộc | Mặc định    | Mô tả                                    |
| ----------- | ----------------- | -------- | ----------- | ---------------------------------------- |
| `page`      | int (string)      | Không    | `1`         | Trang hiện tại                           |
| `limit`     | int (string)      | Không    | `10`        | Số bản ghi mỗi trang                     |
| `sortBy`    | string            | Không    | `createdAt` | Chỉ chấp nhận: `createdAt`               |
| `sort`      | `'asc' \| 'desc'` | Không    | `desc`      | Thứ tự sắp xếp                           |
| `startDate` | string (ISO)      | Không    | —           | Lọc từ ngày (map `createdAt.gte`)        |
| `endDate`   | string (ISO)      | Không    | —           | Lọc đến ngày (map `createdAt.lte`)       |
| `q`         | string            | Không    | —           | Tìm kiếm theo `name`, `email`, `phone`   |

## 1.3 Dữ liệu đầu ra (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2026-02-04T10:30:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "customer_id": "uuid",
      "customer_email": "customer@example.com",
      "customer_name": "Nguyễn Văn A",
      "customer_phone": "0900000000",
      "total_products_in_orders": 5,
      "total_orders": 2,
      "total_customer_paid": 200000,
      "total_paid": 190000,
      "total_unpaid_amount": 10000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

# 2. Báo cáo Nhà cung cấp

## 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/report/suppliers`             |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `REPORT_READ`                   |

## 2.2 Query Parameters

| Tên         | Kiểu              | Bắt buộc | Mặc định    | Mô tả                                                   |
| ----------- | ----------------- | -------- | ----------- | ------------------------------------------------------- |
| `page`      | int (string)      | Không    | `1`         | Trang hiện tại                                          |
| `limit`     | int (string)      | Không    | `10`        | Số bản ghi mỗi trang                                    |
| `sortBy`    | string            | Không    | `createdAt` | Chỉ chấp nhận: `createdAt`, `total_purchased`, `name`, `code` |
| `sort`      | `'asc' \| 'desc'` | Không    | `desc`      | Thứ tự sắp xếp                                          |
| `startDate` | string (ISO)      | Không    | —           | Lọc từ ngày (map `createdAt.gte`)                       |
| `endDate`   | string (ISO)      | Không    | —           | Lọc đến ngày (map `createdAt.lte`)                      |
| `q`         | string            | Không    | —           | Tìm kiếm theo `name`, `code`, `email`, `phone`, `tax_code` |

## 2.3 Dữ liệu đầu ra (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2026-02-04T10:30:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "supplier_id": "uuid",
      "supplier_code": "NCC001",
      "supplier_name": "Công ty ABC",
      "supplier_tax_code": "0312345678",
      "supplier_status": "ACTIVE",
      "purchase_orders_code_numbers": ["PN0001"],
      "purchase_return_code_numbers": ["PR0001"],
      "total_purchase_returns": 1,
      "total_products_in_purchase": 10,
      "total_purchase_orders": 2,
      "total_purchase_paid": 1000000,
      "total_paid": 1000000,
      "total_unpaid_amount": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

# 3. Chi tiết Nhà cung cấp

## 3.1 Mô tả

| **Thuộc tính** | **Giá trị**                             |
| -------------- | --------------------------------------- |
| Request URL    | `/report/supplier/:supplierId`          |
| Request Method | **GET**                                 |
| Request Header | `Authorization: Bearer <token>`         |
| Quyền yêu cầu  | `REPORT_READ`                           |

## 3.2 Dữ liệu đầu ra (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2026-02-04T10:30:00.000Z",
    "version": "v1"
  },
  "data": {
    "data": [
      {
        "id": "uuid",
        "code": "PN0001",
        "amount": 500000,
        "status": "COMPLETED",
        "payment_status": "PAID",
        "createdAt": "2026-02-04T09:00:00.000Z",
        "purchase_type": "purchase_order"
      }
    ],
    "totalPurchaseOrders": 1,
    "totalPurchaseReturns": 0
  }
}
```

---

# 4. Báo cáo chi tiết bán hàng theo dòng sản phẩm (Order Items)

## 4.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/report/order-items`           |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `REPORT_READ`                   |

## 4.2 Query Parameters

| Tên         | Kiểu              | Bắt buộc | Mặc định    | Mô tả                                                  |
| ----------- | ----------------- | -------- | ----------- | ------------------------------------------------------ |
| `page`      | int (string)      | Không    | `1`         | Trang hiện tại                                         |
| `limit`     | int (string)      | Không    | `10`        | Số bản ghi mỗi trang                                   |
| `sortBy`    | string            | Không    | `createdAt` | Chỉ chấp nhận: `createdAt`, `code` (map theo Order)    |
| `sort`      | `'asc' \| 'desc'` | Không    | `desc`      | Thứ tự sắp xếp                                         |
| `startDate` | string (ISO)      | Không    | —           | Lọc từ ngày (map `createdAt.gte`)                      |
| `endDate`   | string (ISO)      | Không    | —           | Lọc đến ngày (map `createdAt.lte`)                     |
| `q`         | string            | Không    | —           | Tìm theo `order.code`, `order.customer_name` (và `customer.name` nếu có) |

> **Ghi chú:** `total` trong pagination là **tổng số dòng order_item**, không phải tổng số đơn hàng.

## 4.3 Dữ liệu đầu ra (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2026-02-04T10:30:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "stt": 1,
      "order_created_at": "2026-02-04T09:30:00.000Z",
      "order_code": "DH0001",
      "customer_name": "Nguyễn Văn A",
      "order_total_amount": 200000,
      "variant_name": "Cà phê sữa",
      "product_name": "Cà phê",
      "base_unit": "ly",
      "quantity": 2,
      "price": 100000,
      "line_total": 200000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

# 5. Báo cáo tồn kho (Variant Stock)

## 5.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/report/stocks`                |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `REPORT_READ`                   |

## 5.2 Query Parameters

| Tên         | Kiểu              | Bắt buộc | Mặc định    | Mô tả                                                   |
| ----------- | ----------------- | -------- | ----------- | ------------------------------------------------------- |
| `page`      | int (string)      | Không    | `1`         | Trang hiện tại                                          |
| `limit`     | int (string)      | Không    | `10`        | Số bản ghi mỗi trang                                    |
| `sortBy`    | string            | Không    | `createdAt` | Chỉ chấp nhận: `createdAt`, `onHand`                    |
| `sort`      | `'asc' \| 'desc'` | Không    | `desc`      | Thứ tự sắp xếp                                          |
| `startDate` | string (ISO)      | Không    | —           | Lọc từ ngày (map `createdAt.gte`)                       |
| `endDate`   | string (ISO)      | Không    | —           | Lọc đến ngày (map `createdAt.lte`)                      |
| `q`         | string            | Không    | —           | Tìm theo `variant.name`, `variant.sku`, `product.name`  |

## 5.3 Dữ liệu đầu ra (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2026-02-08T10:30:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "stt": 1,
      "product_name": "Cà phê",
      "variant_name": "Cà phê sữa",
      "sku": "SP0001",
      "base_unit": "ly",
      "on_hand": 50,
      "reserved": 5,
      "damaged": 0,
      "price": 100000,
      "cost": 70000,
      "stock_value": 3500000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

# 6. Báo cáo sổ kho (Stock Ledger)

## 6.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/report/stock-ledger`          |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `REPORT_READ`                   |

## 6.2 Query Parameters

| Tên         | Kiểu              | Bắt buộc | Mặc định    | Mô tả                                                                 |
| ----------- | ----------------- | -------- | ----------- | --------------------------------------------------------------------- |
| `page`      | int (string)      | Không    | `1`         | Trang hiện tại                                                        |
| `limit`     | int (string)      | Không    | `10`        | Số bản ghi mỗi trang                                                  |
| `sortBy`    | string            | Không    | `createdAt` | Chỉ chấp nhận: `createdAt`                                            |
| `sort`      | `'asc' \| 'desc'` | Không    | `desc`      | Thứ tự sắp xếp                                                        |
| `startDate` | string (ISO)      | Không    | —           | Lọc từ ngày (map `createdAt.gte`)                                     |
| `endDate`   | string (ISO)      | Không    | —           | Lọc đến ngày (map `createdAt.lte`)                                    |
| `q`         | string            | Không    | —           | Tìm theo `code`, `partner_name`, `variant_name`, `product_name`, `type` |

## 6.3 Dữ liệu đầu ra (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2026-02-08T10:30:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "stt": 1,
      "created_at": "2026-02-08T10:00:00.000Z",
      "code": "PN0001",
      "type": "NHẬP",
      "partner_name": "NCC Test",
      "variant_name": "Cà phê sữa",
      "product_name": "Cà phê",
      "base_unit": "ly",
      "quantity_in": 10,
      "quantity_out": 0,
      "unit_price": 50000,
      "line_total": 500000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

# 7. Báo cáo trả hàng nhập (Purchase Returns)

## 7.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/report/purchase-returns`      |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `REPORT_READ`                   |

## 7.2 Query Parameters

| Tên         | Kiểu              | Bắt buộc | Mặc định    | Mô tả                                                    |
| ----------- | ----------------- | -------- | ----------- | -------------------------------------------------------- |
| `page`      | int (string)      | Không    | `1`         | Trang hiện tại                                           |
| `limit`     | int (string)      | Không    | `10`        | Số bản ghi mỗi trang                                     |
| `sortBy`    | string            | Không    | `createdAt` | Chỉ chấp nhận: `createdAt`, `return_number`, `supplier_name` |
| `sort`      | `'asc' \| 'desc'` | Không    | `desc`      | Thứ tự sắp xếp                                           |
| `startDate` | string (ISO)      | Không    | —           | Lọc từ ngày (map `createdAt.gte`)                        |
| `endDate`   | string (ISO)      | Không    | —           | Lọc đến ngày (map `createdAt.lte`)                       |
| `q`         | string            | Không    | —           | Tìm theo `return_number`, `supplier_code`, `supplier_name` |
| `payment_status` | enum          | Không    | —           | Lọc theo trạng thái thanh toán                           |
| `status`    | enum              | Không    | —           | Lọc theo trạng thái trả hàng                             |

> **Ghi chú:** `total` là tổng số **dòng trả hàng** (purchase_return_item).

## 7.3 Dữ liệu đầu ra (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2026-02-08T10:30:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "stt": 1,
      "return_date": "2026-02-08T10:00:00.000Z",
      "return_number": "PR0001",
      "supplier_name": "NCC Test",
      "supplier_code": "NCC001",
      "status": "COMPLETED",
      "payment_status": "PAID",
      "total_return": 500000,
      "variant_name": "Cà phê sữa",
      "product_name": "Cà phê",
      "base_unit": "ly",
      "quantity": 2,
      "unit_cost": 50000,
      "line_total": 100000,
      "reason": ""
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

# 8. Báo cáo trả hàng bán (Order Returns)

## 8.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/report/order-returns`         |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `REPORT_READ`                   |

## 8.2 Query Parameters

| Tên         | Kiểu              | Bắt buộc | Mặc định    | Mô tả                                                      |
| ----------- | ----------------- | -------- | ----------- | ---------------------------------------------------------- |
| `page`      | int (string)      | Không    | `1`         | Trang hiện tại                                             |
| `limit`     | int (string)      | Không    | `10`        | Số bản ghi mỗi trang                                       |
| `sortBy`    | string            | Không    | `createdAt` | Chỉ chấp nhận: `createdAt`, `order_return_number`, `order_number` |
| `sort`      | `'asc' \| 'desc'` | Không    | `desc`      | Thứ tự sắp xếp                                             |
| `startDate` | string (ISO)      | Không    | —           | Lọc từ ngày (map `createdAt.gte`)                          |
| `endDate`   | string (ISO)      | Không    | —           | Lọc đến ngày (map `createdAt.lte`)                         |
| `q`         | string            | Không    | —           | Tìm theo `order_return_number`, `order_number`, `customer_name`, `customer_phone` |
| `return_type` | enum            | Không    | —           | Lọc theo loại trả hàng                                     |
| `return_status` | enum          | Không    | —           | Lọc theo trạng thái trả hàng                                |

> **Ghi chú:** `total` là tổng số **dòng trả hàng** (order_return_item).

## 8.3 Dữ liệu đầu ra (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2026-02-08T10:30:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "stt": 1,
      "return_date": "2026-02-08T10:00:00.000Z",
      "return_number": "OR0001",
      "order_number": "DH0001",
      "customer_name": "Nguyễn Văn A",
      "return_status": "PENDING",
      "return_type": "PARTIAL",
      "total_return": 100000,
      "variant_name": "Cà phê sữa",
      "product_name": "Cà phê",
      "base_unit": "ly",
      "quantity": 1,
      "line_total": 100000,
      "reason_status": "DAMAGED",
      "condition": ""
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

# 9. Báo cáo hóa đơn NCC (Purchase Invoices)

## 9.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/report/purchase-invoices`     |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `REPORT_READ`                   |

## 9.2 Query Parameters

| Tên         | Kiểu              | Bắt buộc | Mặc định    | Mô tả                                               |
| ----------- | ----------------- | -------- | ----------- | --------------------------------------------------- |
| `page`      | int (string)      | Không    | `1`         | Trang hiện tại                                      |
| `limit`     | int (string)      | Không    | `10`        | Số bản ghi mỗi trang                                |
| `sortBy`    | string            | Không    | `createdAt` | Chỉ chấp nhận: `createdAt`, `code`, `supplier_name` |
| `sort`      | `'asc' \| 'desc'` | Không    | `desc`      | Thứ tự sắp xếp                                      |
| `startDate` | string (ISO)      | Không    | —           | Lọc từ ngày (map `createdAt.gte`)                   |
| `endDate`   | string (ISO)      | Không    | —           | Lọc đến ngày (map `createdAt.lte`)                  |
| `q`         | string            | Không    | —           | Tìm theo `invoice_code`, `supplier_name`, `supplier_code` |

## 9.3 Dữ liệu đầu ra (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2026-02-08T10:30:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "stt": 1,
      "date": "2026-02-08T10:00:00.000Z",
      "invoice_type": "NHẬP",
      "invoice_code": "PN0001",
      "supplier_name": "NCC Test",
      "supplier_code": "NCC001",
      "status": "RECEIVED",
      "payment_status": "PAID",
      "payment_method": "CASH",
      "total_amount": 500000,
      "note": "Nhap hang"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

# 10. Xuất Excel báo cáo

## 10.1 Báo cáo Khách hàng

| **Thuộc tính** | **Giá trị**                                   |
| -------------- | --------------------------------------------- |
| Request URL    | `/report/excel/customers`                     |
| Request Method | **GET**                                       |
| Request Header | `Authorization: Bearer <token>`               |
| Response       | File Excel (`.xlsx`)                          |
| Tên file        | `orders.xlsx` (theo code hiện tại)           |

## 10.2 Báo cáo Nhà cung cấp

| **Thuộc tính** | **Giá trị**                                   |
| -------------- | --------------------------------------------- |
| Request URL    | `/report/excel/suppliers`                     |
| Request Method | **GET**                                       |
| Request Header | `Authorization: Bearer <token>`               |
| Response       | File Excel (`.xlsx`)                          |
| Tên file        | `orders.xlsx` (theo code hiện tại)           |

## 10.3 Báo cáo chi tiết đơn hàng (Order Items)

| **Thuộc tính** | **Giá trị**                                   |
| -------------- | --------------------------------------------- |
| Request URL    | `/report/excel/order-items`                   |
| Request Method | **GET**                                       |
| Request Header | `Authorization: Bearer <token>`               |
| Response       | File Excel (`.xlsx`)                          |
| Tên file        | `order-items.xlsx`                            |

## 10.4 Báo cáo tồn kho

| **Thuộc tính** | **Giá trị**                                   |
| -------------- | --------------------------------------------- |
| Request URL    | `/report/excel/stocks`                        |
| Request Method | **GET**                                       |
| Request Header | `Authorization: Bearer <token>`               |
| Response       | File Excel (`.xlsx`)                          |
| Tên file        | `report-stocks.xlsx`                          |

## 10.5 Báo cáo sổ kho

| **Thuộc tính** | **Giá trị**                                   |
| -------------- | --------------------------------------------- |
| Request URL    | `/report/excel/stock-ledger`                  |
| Request Method | **GET**                                       |
| Request Header | `Authorization: Bearer <token>`               |
| Response       | File Excel (`.xlsx`)                          |
| Tên file        | `stock-ledger.xlsx`                           |

## 10.6 Báo cáo trả hàng nhập

| **Thuộc tính** | **Giá trị**                                   |
| -------------- | --------------------------------------------- |
| Request URL    | `/report/excel/purchase-returns`              |
| Request Method | **GET**                                       |
| Request Header | `Authorization: Bearer <token>`               |
| Response       | File Excel (`.xlsx`)                          |
| Tên file        | `purchase-returns.xlsx`                       |

## 10.7 Báo cáo trả hàng bán

| **Thuộc tính** | **Giá trị**                                   |
| -------------- | --------------------------------------------- |
| Request URL    | `/report/excel/order-returns`                 |
| Request Method | **GET**                                       |
| Request Header | `Authorization: Bearer <token>`               |
| Response       | File Excel (`.xlsx`)                          |
| Tên file        | `order-returns.xlsx`                          |

## 10.8 Báo cáo hóa đơn NCC

| **Thuộc tính** | **Giá trị**                                   |
| -------------- | --------------------------------------------- |
| Request URL    | `/report/excel/purchase-invoices`             |
| Request Method | **GET**                                       |
| Request Header | `Authorization: Bearer <token>`               |
| Response       | File Excel (`.xlsx`)                          |
| Tên file        | `purchase-invoices.xlsx`                      |
