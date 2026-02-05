# Purchase Return API Routes

# Ghi chú về Purchase Return

## Khái niệm chung

Purchase Return là quá trình trả lại hàng nhập từ nhà cung cấp. Hệ thống hỗ trợ hai loại trả hàng:

- **Trả hàng theo đơn nhập (Purchase Order)**: Trả hàng dựa trên một đơn nhập hàng đã được duyệt
- **Trả hàng tự do**: Trả hàng không cần phải theo đơn nhập hàng cụ thể

## Trạng thái (Status)

- **DRAFT**: Đơn trả hàng vừa được tạo
- **COMPLETED**: Đơn trả hàng đã hoàn tất
- **CANCELLED**: Đơn trả hàng đã bị hủy

## Trạng thái thanh toán (Payment Status)

- **UNPAID**: Chưa thanh toán
- **PAID**: Đã thanh toán

---

# 1. Tạo đơn trả hàng theo đơn nhập

### 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                          |
| -------------- | -------------------------------------------------------------------- |
| Request URL    | `/purchase-return/order/:purchaseOrderId`                            |
| Request Method | POST                                                                 |
| Request Header | Content-Type: application/json, Authorization: Bearer {access_token} |
| Body data      | JSON schema bên dưới                                                 |
| Permission     | PURCHASE_RETURN_CREATE, PURCHASE_RETURN_ALL                          |

**JSON Schema:**

```json
{
  "items": [
    {
      "purchase_order_item_id": "string (UUID)",
      "quantity": "number",
      "unit_cost": "number",
      "reason": "string (optional)"
    }
  ],
  "reason": "string (optional)",
  "notes": "string (optional)",
  "return_date": "ISO 8601 DateTime (optional)"
}
```

### 1.2 Dữ liệu đầu vào

**Path Parameters:**

| **Tên trường**  | **Kiểu** | **Bắt buộc** | **Ghi chú**            |
| --------------- | -------- | ------------ | ---------------------- |
| purchaseOrderId | string   | ✓            | UUID của đơn nhập hàng |

**Body Parameters:**

| **Tên trường**                 | **Kiểu**      | **Bắt buộc** | **Ghi chú**                        |
| ------------------------------ | ------------- | ------------ | ---------------------------------- |
| items                          | array         | ✓            | Danh sách sản phẩm trả hàng        |
| items[].purchase_order_item_id | string (UUID) | ✓            | ID của item trong đơn nhập         |
| items[].quantity               | number        | ✓            | Số lượng trả (phải > 0)            |
| items[].unit_cost              | number        | ✓            | Giá tiền trả > 0                   |
| items[].reason                 | string        | ✗            | Lý do trả hàng                     |
| reason                         | string        | ✗            | Lý do chung cho đơn trả            |
| notes                          | string        | ✗            | Ghi chú thêm                       |
| return_date                    | DateTime      | ✗            | Ngày trả hàng (mặc định: hiện tại) |

### 1.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-01-14T10:30:45.123Z",
    "version": "v1"
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "store_id": "550e8400-e29b-41d4-a716-446655440001",
    "return_number": "PRN-2025-001",
    "supplier_id": "550e8400-e29b-41d4-a716-446655440002",
    "supplier_name": "Công ty XYZ",
    "supplier_code": "SUP001",
    "purchase_order_id": "550e8400-e29b-41d4-a716-446655440003",
    "status": "COMPLETED",
    "payment_status": "UNPAID",
    "total": "1500000.00",
    "reason": "Sản phẩm lỗi",
    "notes": "Trả hàng do lỗi chất lượng",
    "created_by": "550e8400-e29b-41d4-a716-446655440004",
    "return_date": "2025-01-14T10:30:45.123Z",
    "createdAt": "2025-01-14T10:30:45.123Z",
    "updatedAt": "2025-01-14T10:30:45.123Z",
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "purchase_return_id": "550e8400-e29b-41d4-a716-446655440000",
        "product_id": "550e8400-e29b-41d4-a716-446655440020",
        "variant_id": "550e8400-e29b-41d4-a716-446655440021",
        "purchase_order_item_id": "550e8400-e29b-41d4-a716-446655440030",
        "item_name": "Áo phông đen size M",
        "quantity": 10,
        "unit": "Cái",
        "applied_factor": 1,
        "total_base_qty": 10,
        "unit_cost": "150000.00",
        "base_unit_cost": "150000.00",
        "total": "1500000.00",
        "reason": "Sản phẩm lỗi"
      }
    ]
  },
  "message": "Tạo đơn trả hàng nhập thành công!"
}
```

**Error Response:**

**400 Bad Request – Số lượng trả không hợp lệ**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Số lượng xuất không được lớn hơn số lượng nhập",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-01-14T10:30:45.123Z",
    "version": "v1"
  }
}
```

**400 Bad Request – Đơn nhập chưa được duyệt**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Đơn hàng nhập hiện chưa được duyệt",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-01-14T10:30:45.123Z",
    "version": "v1"
  }
}
```

**404 Not Found – Đơn nhập không tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy đơn nhập hàng",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-01-14T10:30:45.123Z",
    "version": "v1"
  }
}
```

**404 Not Found – Item trong đơn nhập không tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy sản phẩm trong đơn nhập",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-01-14T10:30:45.123Z",
    "version": "v1"
  }
}
```

**404 Not Found – Nhà cung cấp không tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy nhà cung cấp",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-01-14T10:30:45.123Z",
    "version": "v1"
  }
}
```

---

# 2. Tạo đơn trả hàng tự do (không theo đơn nhập)

### 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                          |
| -------------- | -------------------------------------------------------------------- |
| Request URL    | `/purchase-return/free`                                              |
| Request Method | POST                                                                 |
| Request Header | Content-Type: application/json, Authorization: Bearer {access_token} |
| Body data      | JSON schema bên dưới                                                 |
| Permission     | PURCHASE_RETURN_CREATE, PURCHASE_RETURN_ALL                          |

**JSON Schema:**

```json
{
  "supplier_id": "string (UUID)",
  "items": [
    {
      "variant_id": "string (UUID)",
      "product_id": "string (UUID)",
      "quantity": "number",
      "unit_cost": "number",
      "reason": "string (optional)"
    }
  ],
  "reason": "string (optional)",
  "notes": "string (optional)"
}
```

### 2.2 Dữ liệu đầu vào

**Body Parameters:**

| **Tên trường**     | **Kiểu**      | **Bắt buộc** | **Ghi chú**                 |
| ------------------ | ------------- | ------------ | --------------------------- |
| supplier_id        | string (UUID) | ✓            | ID của nhà cung cấp         |
| items              | array         | ✓            | Danh sách sản phẩm trả hàng |
| items[].variant_id | string (UUID) | ✓            | ID của biến thể sản phẩm    |
| items[].product_id | string (UUID) | ✓            | ID của sản phẩm             |
| items[].quantity   | number        | ✓            | Số lượng trả (phải > 0)     |
| items[].unit_cost  | number        | ✓            | Giá tiền trả > 0            |
| items[].reason     | string        | ✗            | Lý do trả hàng              |
| reason             | string        | ✗            | Lý do chung cho đơn trả     |
| notes              | string        | ✗            | Ghi chú thêm                |

### 2.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-01-14T10:35:20.456Z",
    "version": "v1"
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "store_id": "550e8400-e29b-41d4-a716-446655440001",
    "return_number": "PRN-2025-002",
    "supplier_id": "550e8400-e29b-41d4-a716-446655440002",
    "supplier_name": "Công ty ABC",
    "supplier_code": "SUP002",
    "purchase_order_id": null,
    "status": "COMPLETED",
    "payment_status": "UNPAID",
    "total": "2000000.00",
    "reason": "Đơn trả tự do",
    "notes": "Trả hàng thừa",
    "created_by": "550e8400-e29b-41d4-a716-446655440004",
    "return_date": "2025-01-14T10:35:20.456Z",
    "createdAt": "2025-01-14T10:35:20.456Z",
    "updatedAt": "2025-01-14T10:35:20.456Z",
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440011",
        "purchase_return_id": "550e8400-e29b-41d4-a716-446655440000",
        "product_id": "550e8400-e29b-41d4-a716-446655440020",
        "variant_id": "550e8400-e29b-41d4-a716-446655440021",
        "purchase_order_item_id": null,
        "item_name": "Quần jean xanh size 32",
        "quantity": 20,
        "unit": "Cái",
        "applied_factor": 1,
        "total_base_qty": 20,
        "unit_cost": "100000.00",
        "base_unit_cost": "100000.00",
        "total": "2000000.00",
        "reason": "Hàng thừa"
      }
    ]
  },
  "message": "Tạo đơn trả hàng thành công!"
}
```

**Error Response:**

**400 Bad Request – Nhà cung cấp không tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy nhà cung cấp",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-01-14T10:35:20.456Z",
    "version": "v1"
  }
}
```

**400 Bad Request – Sản phẩm/biến thể không tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Sản phẩm/biến thể không tìm thấy hoặc không tồn tại!",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-01-14T10:35:20.456Z",
    "version": "v1"
  }
}
```

**400 Bad Request – Tồn kho không đủ**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Số lượng xuất không được lớn hơn số lượng nhập: 50 Áo phông",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-01-14T10:35:20.456Z",
    "version": "v1"
  }
}
```

---

# 3. Lấy chi tiết đơn trả hàng

### 3.1 Mô tả

Endpoint này được dùng để lấy toàn bộ thông tin chi tiết của một

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-01-14T10:40:15.789Z",
    "version": "v1"
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "store_id": "550e8400-e29b-41d4-a716-446655440001",
    "return_number": "PRN-2025-001",
    "supplier_id": "550e8400-e29b-41d4-a716-446655440002",
    "supplier_name": "Công ty XYZ",
    "supplier_code": "SUP001",
    "purchase_order_id": "550e8400-e29b-41d4-a716-446655440003",
    "status": "COMPLETED",
    "payment_status": "UNPAID",
    "total": "1500000.00",
    "reason": "Sản phẩm lỗi",
    "notes": "Trả hàng do lỗi chất lượng",
    "created_by": "550e8400-e29b-41d4-a716-446655440004",
    "return_date": "2025-01-14T10:30:45.123Z",
    "createdAt": "2025-01-14T10:30:45.123Z",
    "updatedAt": "2025-01-14T10:30:45.123Z",
    "supplier": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Công ty XYZ",
      "code": "SUP001",
      "email": "contact@xyz.com",
      "tax_code": "0123456789"
    },
    "creator": {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "username": "admin"
    },
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "purchase_return_id": "550e8400-e29b-41d4-a716-446655440000",
        "product_id": "550e8400-e29b-41d4-a716-446655440020",
        "variant_id": "550e8400-e29b-41d4-a716-446655440021",
        "purchase_order_item_id": "550e8400-e29b-41d4-a716-446655440030",
        "item_name": "Áo phông đen size M",
        "quantity": 10,
        "unit": "Cái",
        "applied_factor": 1,
        "total_base_qty": 10,
        "unit_cost": "150000.00",
        "base_unit_cost": "150000.00",
        "total": "1500000.00",
        "reason": "Sản phẩm lỗi",
        "variant": {
          "id": "550e8400-e29b-41d4-a716-446655440021",
          "name": "Áo phông đen size M"
        },
        "product": {
          "id": "550e8400-e29b-41d4-a716-446655440020",
          "name": "Áo phông"
        }
      }
    ],
    "payments": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440040",
        "purchase_return_id": "550e8400-e29b-41d4-a716-446655440000",
        "amount": "1500000.00",
        "payment_method": "BANK_TRANSFER",
        "payment_date": "2025-01-14T10:30:45.123Z",
        "reference": "TRF123456",
        "notes": "Thanh toán hoàn tiền",
        "createdAt": "2025-01-14T10:30:45.123Z"
      }
    ]
  }
}
```

**Error Response:**

**404 Not Found – Đơn trả hàng không tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy đơn xuất/trả",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-01-14T10:40:15.789Z",
    "version": "v1"
  }
}
```

---

# 4. Lấy danh sách đơn trả hàng

### 4.1 Mô tả

| **Thuộc tính** | **Giá trị**                               |
| -------------- | ----------------------------------------- |
| Request URL    | `/purchase-return`                        |
| Request Method | GET                                       |
| Request Header | Authorization: Bearer {access_token}      |
| Permission     | PURCHASE_RETURN_READ, PURCHASE_RETURN_ALL |

### 4.2 Dữ liệu đầu vào

**Query Parameters:**

| **Tên trường** | **Kiểu** | **Ghi chú**                                               |
| -------------- | -------- | --------------------------------------------------------- |
| page           | number   | Trang (mặc định: 1)                                       |
| limit          | number   | Số bản ghi trên trang (mặc định: 10)                      |
| q              | string   | Tìm kiếm theo return_number, supplier_code, supplier_name |
| createdAt.gte  | string   | Ngày tạo từ (ISO 8601)                                    |
| createdAt.lte  | string   | Ngày tạo đến (ISO 8601)                                   |
| status         | enum     | Trạng thái: DRAFT, COMPLETED, CANCELLED                   |
| payment_status | enum     | Trạng thái thanh toán: UNPAID, PAID, PARTIAL              |
| sortBy         | string   | Sắp xếp theo: createdAt (mặc định)                        |
| sort           | string   | Thứ tự: asc, desc (mặc định: desc)                        |
| total.gte      | number   | Tổng tiền từ                                              |
| total.lte      | number   | Tổng tiền đến                                             |

### 4.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-01-14T10:45:30.123Z",
    "version": "v1"
  },
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "store_id": "550e8400-e29b-41d4-a716-446655440001",
      "return_number": "PRN-2025-001",
      "supplier_id": "550e8400-e29b-41d4-a716-446655440002",
      "supplier_name": "Công ty XYZ",
      "supplier_code": "SUP001",
      "purchase_order_id": "550e8400-e29b-41d4-a716-446655440003",
      "status": "COMPLETED",
      "payment_status": "UNPAID",
      "total": "1500000.00",
      "reason": "Sản phẩm lỗi",
      "notes": "Trả hàng do lỗi chất lượng",
      "created_by": "550e8400-e29b-41d4-a716-446655440004",
      "return_date": "2025-01-14T10:30:45.123Z",
      "createdAt": "2025-01-14T10:30:45.123Z",
      "updatedAt": "2025-01-14T10:30:45.123Z",
      "purchase_order": {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "order_number": "PO-2025-001"
      },
      "supplier": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "name": "Công ty XYZ",
        "code": "SUP001",
        "email": "contact@xyz.com",
        "tax_code": "0123456789"
      },
      "creator": {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "username": "admin",
        "email": "admin@company.com"
      },
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440010",
          "item_name": "Áo phông đen size M",
          "quantity": 10,
          "unit": "Cái",
          "total": "1500000.00"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPage": 3
  }
}
```

---

# 5. Xác nhận hoàn tiền đơn trả hàng

### 5.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                          |
| -------------- | -------------------------------------------------------------------- |
| Request URL    | `/purchase-return/accept-payment/:id`                                |
| Request Method | PUT                                                                  |
| Request Header | Content-Type: application/json, Authorization: Bearer {access_token} |
| Body data      | JSON schema bên dưới                                                 |
| Permission     | PURCHASE_RETURN_ACCEPT_PAYMENT, PURCHASE_RETURN_ALL                  |

**JSON Schema:**

```json
{
  "amount": "number",
  "payment_method": "string",
  "reference": "string (optional)",
  "notes": "string (optional)"
}
```

### 5.2 Dữ liệu đầu vào

**Path Parameters:**

| **Tên trường** | **Kiểu** | **Bắt buộc** | **Ghi chú**           |
| -------------- | -------- | ------------ | --------------------- |
| id             | string   | ✓            | UUID của đơn trả hàng |

**Body Parameters:**

| **Tên trường** | **Kiểu** | **Bắt buộc** | **Ghi chú**                                    |
| -------------- | -------- | ------------ | ---------------------------------------------- |
| amount         | number   | ✓            | Số tiền thanh toán (> 0)                       |
| payment_method | string   | ✓            | Phương thức: BANK_TRANSFER, CASH, CHEQUE, etc. |
| reference      | string   | ✗            | Mã tham chiếu (VD: số tài khoản, mã chứng từ)  |
| notes          | string   | ✗            | Ghi chú thêm                                   |

### 5.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-01-14T10:50:45.456Z",
    "version": "v1"
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "purchase_return_id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": "1500000.00",
    "payment_method": "BANK_TRANSFER",
    "payment_date": "2025-01-14T10:50:45.456Z",
    "reference": "TRF123456",
    "notes": "Thanh toán hoàn tiền",
    "createdAt": "2025-01-14T10:50:45.456Z"
  },
  "message": "Xác nhận hoàn tiền đơn trả hàng thành công!"
}
```

**Error Response:**

**404 Not Found – Đơn trả hàng không tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy đơn xuất/trả",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-01-14T10:50:45.456Z",
    "version": "v1"
  }
}
```

**400 Bad Request – Số tiền không hợp lệ**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Số tiền thanh toán không hợp lệ",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-01-14T10:50:45.456Z",
    "version": "v1"
  }
}
```

---

# Ghi chú bổ sung

## Authentication

Tất cả các API endpoint đều yêu cầu access token được truyền trong Authorization Header theo format: `Authorization: Bearer {access_token}`

## Error Handling

Các lỗi được trả về với mã HTTP tương ứng:

- **400 Bad Request**: Dữ liệu đầu vào không hợp lệ
- **404 Not Found**: Dữ liệu không tồn tại
- **403 Forbidden**: Không có quyền truy cập
- **422 Unprocessable Entity**: Dữ liệu không thể xử lý

## Pagination

Danh sách được trả về với thông tin phân trang:

- `page`: Trang hiện tại
- `limit`: Số bản ghi trên trang
- `total`: Tổng số bản ghi
- `totalPage`: Tổng số trang

## Độc lập Store

Tất cả các dữ liệu đều được lọc theo `store_id` của người dùng hiện tại. Người dùng chỉ có thể truy cập dữ liệu của cửa hàng mà họ được gán.
