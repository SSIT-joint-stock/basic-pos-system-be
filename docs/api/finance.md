# Finance API Routes

> Phiên bản: **v1**  
> Base URL: `http://localhost:3002`  
> Tất cả các endpoint trong tài liệu này **yêu cầu xác thực** bằng **Access Token** (JWT) theo chuẩn `Authorization: Bearer <access_token>`.

---

# Phân quyền (Permissions)

## Yêu cầu vai trò theo API (trong store)

> **Ghi chú:** Cột "Vai trò tối thiểu" nghĩa là vai trò thấp nhất có thể gọi được API đó. **OWNER** luôn có thể gọi tất cả các API.

| **Endpoint**                        | **Method** | **Vai trò tối thiểu** |
| ----------------------------------- | ---------- | --------------------- |
| `/finance/receipts`                 | POST       | MEMBER                |
| `/finance/payments`                 | POST       | MEMBER                |
| `/finance/transactions`             | GET        | MEMBER                |
| `/finance/transactions/:id`         | GET        | MEMBER                |
| `/finance/transactions/:id`         | PATCH      | MEMBER                |
| `/finance/transactions/:id`         | DELETE     | OWNER                 |
| `/finance/transactions/:id/approve` | POST       | OWNER                 |
| `/finance/receipts`                 | GET        | MEMBER                |
| `/finance/payments`                 | GET        | MEMBER                |
| `/finance/cash-book`                | GET        | MEMBER                |
| `/finance/balance`                  | GET        | MEMBER                |
| `/finance/statistics/daily`         | GET        | MEMBER                |
| `/finance/statistics/monthly`       | GET        | OWNER                 |
| `/finance/dashboard`                | GET        | MEMBER                |
| `/finance/sync-cash-book`           | POST       | OWNER                 |
| `/finance/transactions/export`      | GET        | OWNER                 |
| `/finance/cash-book/export`         | GET        | OWNER                 |

## Permissions Map

| **Vai trò** | **Permissions**                                                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OWNER**   | **ALL** (`FINANCE_ALL`, `FINANCE_READ`, `FINANCE_CREATE`, `FINANCE_UPDATE`, `FINANCE_DELETE`, `FINANCE_APPROVE`, `FINANCE_SYNC`, `FINANCE_EXPORT`) |
| **MEMBER**  | `FINANCE_READ`, `FINANCE_CREATE`, `FINANCE_UPDATE`                                                                                                 |

**Hệ quả theo endpoint:**

- **Tạo phiếu thu/chi** (`POST /finance/receipts`, `POST /finance/payments`): OWNER ✅, MEMBER ✅
- **Xem danh sách/chi tiết** (`GET /finance/transactions[/:id]`): OWNER ✅, MEMBER ✅
- **Cập nhật** (`PATCH /finance/transactions/:id`): OWNER ✅, MEMBER ✅
- **Hủy giao dịch** (`DELETE /finance/transactions/:id`): OWNER ✅, MEMBER ❌
- **Duyệt giao dịch** (`POST /finance/transactions/:id/approve`): OWNER ✅, MEMBER ❌
- **Thống kê tháng** (`GET /finance/statistics/monthly`): OWNER ✅, MEMBER ❌
- **Export Excel** (`GET /finance/*/export`): OWNER ✅, MEMBER ❌
- **Sync sổ quỹ** (`POST /finance/sync-cash-book`): OWNER ✅, MEMBER ❌

---

# 1. Tạo Phiếu Thu (Receipt)

## 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/finance/receipts`                                                 |
| Request Method | **POST**                                                            |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | JSON schema bên dưới                                                |
| Quyền yêu cầu  | `FINANCE_CREATE`                                                    |

**JSON Schema (Body):**

```json
{
  "amount": "number (> 0)",
  "payment_method": "CASH | CREDIT_CARD | DEBIT_CARD | BANK_TRANSFER | DIGITAL_WALLET",
  "transaction_source": "SALE | PURCHASE_RETURN | CUSTOMER_DEBT | OTHER_INCOME | OPENING_BALANCE",
  "contact_id": "string (UUID)",
  "contact_type": "Customer | Supplier | Other",
  "description": "string (optional)",
  "notes": "string (optional)"
}
```

### 1.2 Dữ liệu đầu vào

| **Tên trường**     | **Kiểu** | **Bắt buộc** | **Ghi chú**                                                                   |
| ------------------ | -------- | ------------ | ----------------------------------------------------------------------------- |
| amount             | number   | ✓            | Số tiền thu (> 0, tối đa 999,999,999,999.99)                                  |
| payment_method     | enum     | ✓            | `CASH`, `CREDIT_CARD`, `DEBIT_CARD`, `BANK_TRANSFER`, `DIGITAL_WALLET`        |
| transaction_source | enum     | ✓            | `SALE`, `PURCHASE_RETURN`, `CUSTOMER_DEBT`, `OTHER_INCOME`, `OPENING_BALANCE` |
| contact_id         | string   | ✓            | ID khách hàng/nhà cung cấp (UUID)                                             |
| contact_type       | string   | ✓            | `Customer`, `Supplier`, `Other`                                               |
| description        | string   |              | Lý do thu tiền                                                                |
| notes              | string   |              | Ghi chú thêm                                                                  |

**LƯU Ý QUAN TRỌNG:**

- ❌ **KHÔNG** truyền `store_id` - Hệ thống tự động lấy từ `currentStoreId` trong access token
- ❌ **KHÔNG** truyền `created_by` - Hệ thống tự động lấy từ `user.id` trong access token
- ❌ **KHÔNG** truyền `contact_name` - Hệ thống tự động query từ database dựa trên `contact_id` và `contact_type`
- ❌ **KHÔNG** truyền `reference_id`, `reference_type` - Chỉ set tự động từ module khác (Order, PurchaseReturn...)

### 1.3 Dữ liệu đầu ra

**Success Response (201):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T10:30:00.000Z",
    "version": "v1"
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "PT00001",
    "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
    "transaction_type": "RECEIPT",
    "transaction_source": "SALE",
    "amount": "500000",
    "payment_method": "CASH",
    "contact_name": "Nguyễn Văn A",
    "contact_id": "customer-uuid",
    "contact_type": "Customer",
    "description": "Thu tiền bán hàng",
    "notes": null,
    "reference_type": null,
    "reference_id": null,
    "status": "CONFIRMED",
    "transaction_date": "2025-02-07T10:30:00.000Z",
    "created_by": "user-uuid",
    "approved_by": null,
    "cancelled_by": null,
    "createdAt": "2025-02-07T10:30:00.000Z",
    "updatedAt": "2025-02-07T10:30:00.000Z",
    "store": {
      "id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
      "name": "Chi nhánh 1"
    }
  },
  "message": "Create receipt successfully"
}
```

**Error Response:**

- **400 Bad Request – Số tiền không hợp lệ**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Số tiền thu phải lớn hơn 0",
    "field": "amount",
    "value": 0
  },
  "meta": {
    "timestamp": "2025-02-07T10:30:00.000Z",
    "version": "v1"
  }
}
```

- **404 Not Found – Không tìm thấy khách hàng**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy khách hàng",
    "field": "contact_id",
    "value": "invalid-uuid"
  },
  "meta": {
    "timestamp": "2025-02-07T10:30:00.000Z",
    "version": "v1"
  }
}
```

---

# 2. Tạo Phiếu Chi (Payment)

## 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/finance/payments`                                                 |
| Request Method | **POST**                                                            |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | JSON schema bên dưới                                                |
| Quyền yêu cầu  | `FINANCE_CREATE`                                                    |

**JSON Schema (Body):**

```json
{
  "amount": "number (> 0)",
  "payment_method": "CASH | CREDIT_CARD | DEBIT_CARD | BANK_TRANSFER | DIGITAL_WALLET",
  "transaction_source": "PURCHASE | ORDER_RETURN | SUPPLIER_DEBT | OTHER_EXPENSE",
  "contact_id": "string (UUID)",
  "contact_type": "Customer | Supplier | Other",
  "description": "string (optional)",
  "notes": "string (optional)"
}
```

### 2.2 Dữ liệu đầu vào

| **Tên trường**     | **Kiểu** | **Bắt buộc** | **Ghi chú**                                                            |
| ------------------ | -------- | ------------ | ---------------------------------------------------------------------- |
| amount             | number   | ✓            | Số tiền chi (> 0, tối đa 999,999,999,999.99)                           |
| payment_method     | enum     | ✓            | `CASH`, `CREDIT_CARD`, `DEBIT_CARD`, `BANK_TRANSFER`, `DIGITAL_WALLET` |
| transaction_source | enum     | ✓            | `PURCHASE`, `ORDER_RETURN`, `SUPPLIER_DEBT`, `OTHER_EXPENSE`           |
| contact_id         | string   | ✓            | ID khách hàng/nhà cung cấp (UUID)                                      |
| contact_type       | string   | ✓            | `Customer`, `Supplier`, `Other`                                        |
| description        | string   |              | Lý do chi tiền                                                         |
| notes              | string   |              | Ghi chú thêm                                                           |

### 2.3 Dữ liệu đầu ra

**Success Response (201):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T11:00:00.000Z",
    "version": "v1"
  },
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "code": "PC00001",
    "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
    "transaction_type": "PAYMENT",
    "transaction_source": "PURCHASE",
    "amount": "300000",
    "payment_method": "CASH",
    "contact_name": "Công ty ABC",
    "contact_id": "supplier-uuid",
    "contact_type": "Supplier",
    "description": "Chi tiền nhập hàng",
    "notes": null,
    "reference_type": null,
    "reference_id": null,
    "status": "CONFIRMED",
    "transaction_date": "2025-02-07T11:00:00.000Z",
    "created_by": "user-uuid",
    "approved_by": null,
    "cancelled_by": null,
    "createdAt": "2025-02-07T11:00:00.000Z",
    "updatedAt": "2025-02-07T11:00:00.000Z",
    "store": {
      "id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
      "name": "Chi nhánh 1"
    }
  },
  "message": "Create payment successfully"
}
```

---

# 3. Danh sách Giao dịch

## 3.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/finance/transactions`         |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `FINANCE_READ`                  |

## 3.2 Query Parameters

| Tên                  | Kiểu                | Bắt buộc | Mặc định | Mô tả                                                                     |
| -------------------- | ------------------- | -------- | -------- | ------------------------------------------------------------------------- |
| `store_id`           | string (UUID)       | Không    | —        | Filter theo cửa hàng                                                      |
| `transaction_type`   | enum                | Không    | —        | `RECEIPT` hoặc `PAYMENT`                                                  |
| `transaction_source` | enum                | Không    | —        | `SALE`, `PURCHASE`, `ORDER_RETURN`, `PURCHASE_RETURN`, `CUSTOMER_DEBT`... |
| `status`             | enum                | Không    | —        | `PENDING`, `CONFIRMED`, `CANCELLED`                                       |
| `payment_method`     | enum                | Không    | —        | `CASH`, `CREDIT_CARD`, `DEBIT_CARD`, `BANK_TRANSFER`, `DIGITAL_WALLET`    |
| `from_date`          | string (YYYY-MM-DD) | Không    | —        | Từ ngày (map `transaction_date.gte`)                                      |
| `to_date`            | string (YYYY-MM-DD) | Không    | —        | Đến ngày (map `transaction_date.lte`)                                     |
| `search`             | string              | Không    | —        | Tìm kiếm theo mã phiếu, tên người liên hệ, hoặc mô tả                     |
| `page`               | int (string)        | Không    | `1`      | Trang hiện tại                                                            |
| `limit`              | int (string)        | Không    | `20`     | Số bản ghi mỗi trang (1-100)                                              |

### 3.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T12:00:00.000Z",
    "version": "v1"
  },
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "code": "PT00001",
        "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
        "transaction_type": "RECEIPT",
        "transaction_source": "SALE",
        "amount": "500000",
        "payment_method": "CASH",
        "contact_name": "Nguyễn Văn A",
        "description": "Thu tiền bán hàng",
        "status": "CONFIRMED",
        "transaction_date": "2025-02-07T10:30:00.000Z",
        "createdAt": "2025-02-07T10:30:00.000Z",
        "store": {
          "id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
          "name": "Chi nhánh 1"
        }
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "code": "PC00001",
        "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
        "transaction_type": "PAYMENT",
        "transaction_source": "PURCHASE",
        "amount": "300000",
        "payment_method": "CASH",
        "contact_name": "Công ty ABC",
        "description": "Chi tiền nhập hàng",
        "status": "CONFIRMED",
        "transaction_date": "2025-02-07T11:00:00.000Z",
        "createdAt": "2025-02-07T11:00:00.000Z",
        "store": {
          "id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
          "name": "Chi nhánh 1"
        }
      }
    ],
    "meta": {
      "total": 2,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  },
  "message": "Get transactions successfully"
}
```

---

# 4. Chi tiết Giao dịch

## 4.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/finance/transactions/:id`     |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `FINANCE_READ`                  |

### 4.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T12:05:00.000Z",
    "version": "v1"
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "PT00001",
    "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
    "transaction_type": "RECEIPT",
    "transaction_source": "SALE",
    "amount": "500000",
    "payment_method": "CASH",
    "contact_name": "Nguyễn Văn A",
    "contact_id": "customer-uuid",
    "contact_type": "Customer",
    "description": "Thu tiền bán hàng",
    "notes": "Khách thanh toán đúng hạn",
    "reference_type": "Order",
    "reference_id": "order-uuid",
    "status": "CONFIRMED",
    "transaction_date": "2025-02-07T10:30:00.000Z",
    "created_by": "user-uuid",
    "approved_by": null,
    "cancelled_by": null,
    "createdAt": "2025-02-07T10:30:00.000Z",
    "updatedAt": "2025-02-07T10:30:00.000Z",
    "store": {
      "id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
      "name": "Chi nhánh 1"
    }
  },
  "message": "Get transaction successfully"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy giao dịch",
    "details": {
      "field": "id",
      "value": "invalid-uuid"
    }
  },
  "meta": {
    "timestamp": "2025-02-07T12:05:00.000Z",
    "version": "v1"
  }
}
```

---

# 5. Cập nhật Giao dịch

## 5.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/finance/transactions/:id`                                         |
| Request Method | **PATCH**                                                           |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | JSON schema (partial) bên dưới                                      |
| Quyền yêu cầu  | `FINANCE_UPDATE`                                                    |

**JSON Schema (Body – mọi trường đều optional):**

```json
{
  "amount": "number",
  "payment_method": "enum",
  "transaction_source": "enum",
  "contact_name": "string",
  "contact_type": "string",
  "contact_id": "string (UUID)",
  "description": "string",
  "notes": "string",
  "reference_type": "string",
  "reference_id": "string (UUID)"
}
```

### 5.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T12:10:00.000Z",
    "version": "v1"
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "PT00001",
    "amount": "550000",
    "description": "Thu tiền bán hàng (đã cập nhật)",
    "updatedAt": "2025-02-07T12:10:00.000Z"
  },
  "message": "Update transaction successfully"
}
```

**Error Response (400 – Không thể cập nhật giao dịch đã hủy):**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Không thể cập nhật giao dịch đã bị hủy",
    "details": {
      "field": "status",
      "value": "CANCELLED"
    }
  },
  "meta": {
    "timestamp": "2025-02-07T12:10:00.000Z",
    "version": "v1"
  }
}
```

---

# 6. Hủy Giao dịch

## 6.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/finance/transactions/:id`     |
| Request Method | **DELETE**                      |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `FINANCE_DELETE`                |

## 6.2 Query Parameters

| Tên            | Kiểu          | Bắt buộc | Mô tả        |
| -------------- | ------------- | -------- | ------------ |
| `cancelled_by` | string (UUID) | ✓        | ID người hủy |

### 6.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T12:15:00.000Z",
    "version": "v1"
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "PT00001",
    "status": "CANCELLED",
    "cancelled_by": "user-uuid"
  },
  "message": "Cancel transaction successfully"
}
```

**Error Response (400 – Giao dịch đã bị hủy trước đó):**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Giao dịch đã bị hủy trước đó",
    "details": {
      "field": "status",
      "value": "CANCELLED"
    }
  },
  "meta": {
    "timestamp": "2025-02-07T12:15:00.000Z",
    "version": "v1"
  }
}
```

---

# 7. Duyệt Giao dịch

## 7.1 Mô tả

| **Thuộc tính** | **Giá trị**                         |
| -------------- | ----------------------------------- |
| Request URL    | `/finance/transactions/:id/approve` |
| Request Method | **POST**                            |
| Request Header | `Authorization: Bearer <token>`     |
| Quyền yêu cầu  | `FINANCE_APPROVE`                   |

## 7.2 Query Parameters

| Tên           | Kiểu          | Bắt buộc | Mô tả          |
| ------------- | ------------- | -------- | -------------- |
| `approved_by` | string (UUID) | ✓        | ID người duyệt |

### 7.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T12:20:00.000Z",
    "version": "v1"
  },
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "PT00001",
    "status": "CONFIRMED",
    "approved_by": "owner-uuid"
  },
  "message": "Approve transaction successfully"
}
```

---

# 8. Danh sách Phiếu Thu

## 8.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/finance/receipts`             |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `FINANCE_READ`                  |

> **Note:** API này tự động filter `transaction_type=RECEIPT`, các query parameters khác giống `/finance/transactions`

## 8.2 Query Parameters

Giống như `/finance/transactions` (section 3.2), ngoại trừ:

- Không cần `transaction_type` (auto filter RECEIPT)

### 8.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T12:25:00.000Z",
    "version": "v1"
  },
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "code": "PT00001",
        "transaction_type": "RECEIPT",
        "amount": "500000",
        "contact_name": "Nguyễn Văn A",
        "transaction_date": "2025-02-07T10:30:00.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "code": "PT00002",
        "transaction_type": "RECEIPT",
        "amount": "300000",
        "contact_name": "Trần Thị B",
        "transaction_date": "2025-02-07T11:30:00.000Z"
      }
    ],
    "meta": {
      "total": 2,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  },
  "message": "Get receipts successfully"
}
```

---

# 9. Danh sách Phiếu Chi

## 9.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/finance/payments`             |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `FINANCE_READ`                  |

> **Note:** API này tự động filter `transaction_type=PAYMENT`, các query parameters khác giống `/finance/transactions`

## 9.2 Query Parameters

Giống như `/finance/transactions` (section 3.2), ngoại trừ:

- Không cần `transaction_type` (auto filter PAYMENT)

### 9.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T12:30:00.000Z",
    "version": "v1"
  },
  "data": {
    "data": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "code": "PC00001",
        "transaction_type": "PAYMENT",
        "amount": "300000",
        "contact_name": "Công ty ABC",
        "transaction_date": "2025-02-07T11:00:00.000Z"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440003",
        "code": "PC00002",
        "transaction_type": "PAYMENT",
        "amount": "200000",
        "contact_name": "Công ty XYZ",
        "transaction_date": "2025-02-07T12:00:00.000Z"
      }
    ],
    "meta": {
      "total": 2,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  },
  "message": "Get payments successfully"
}
```

---

# 10. Báo cáo Sổ Quỹ

## 10.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/finance/cash-book`            |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `FINANCE_READ`                  |

## 10.2 Query Parameters

| Tên         | Kiểu                | Bắt buộc | Mặc định | Mô tả       |
| ----------- | ------------------- | -------- | -------- | ----------- |
| `store_id`  | string (UUID)       | ✓        | —        | ID cửa hàng |
| `from_date` | string (YYYY-MM-DD) | Không    | —        | Từ ngày     |
| `to_date`   | string (YYYY-MM-DD) | Không    | —        | Đến ngày    |

### 10.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T13:00:00.000Z",
    "version": "v1"
  },
  "data": {
    "entries": [
      {
        "id": "entry-uuid-1",
        "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
        "date": "2025-02-01T00:00:00.000Z",
        "opening_balance": "0",
        "total_receipts": "1000000",
        "total_payments": "0",
        "closing_balance": "1000000",
        "createdAt": "2025-02-01T23:59:59.000Z",
        "updatedAt": "2025-02-01T23:59:59.000Z"
      },
      {
        "id": "entry-uuid-2",
        "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
        "date": "2025-02-02T00:00:00.000Z",
        "opening_balance": "1000000",
        "total_receipts": "500000",
        "total_payments": "300000",
        "closing_balance": "1200000",
        "createdAt": "2025-02-02T23:59:59.000Z",
        "updatedAt": "2025-02-02T23:59:59.000Z"
      }
    ],
    "summary": {
      "opening_balance": "0",
      "total_receipts": "1500000",
      "total_payments": "300000",
      "closing_balance": "1200000"
    }
  },
  "message": "Get cash book successfully"
}
```

---

# 11. Số dư Hiện tại

## 11.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/finance/balance`              |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `FINANCE_READ`                  |

## 11.2 Query Parameters

| Tên        | Kiểu          | Bắt buộc | Mô tả       |
| ---------- | ------------- | -------- | ----------- |
| `store_id` | string (UUID) | ✓        | ID cửa hàng |

### 11.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T13:05:00.000Z",
    "version": "v1"
  },
  "data": {
    "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
    "current_balance": "1200000"
  },
  "message": "Get current balance successfully"
}
```

---

# 12. Thống kê Theo Ngày

## 12.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/finance/statistics/daily`     |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `FINANCE_READ`                  |

## 12.2 Query Parameters

| Tên         | Kiểu                | Bắt buộc | Mô tả       |
| ----------- | ------------------- | -------- | ----------- |
| `store_id`  | string (UUID)       | ✓        | ID cửa hàng |
| `from_date` | string (YYYY-MM-DD) | Không    | Từ ngày     |
| `to_date`   | string (YYYY-MM-DD) | Không    | Đến ngày    |

### 12.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T13:10:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "date": "2025-02-01T00:00:00.000Z",
      "opening_balance": "0",
      "total_receipts": "1000000",
      "total_payments": "0",
      "closing_balance": "1000000",
      "net_change": "1000000"
    },
    {
      "date": "2025-02-02T00:00:00.000Z",
      "opening_balance": "1000000",
      "total_receipts": "500000",
      "total_payments": "300000",
      "closing_balance": "1200000",
      "net_change": "200000"
    },
    {
      "date": "2025-02-03T00:00:00.000Z",
      "opening_balance": "1200000",
      "total_receipts": "0",
      "total_payments": "200000",
      "closing_balance": "1000000",
      "net_change": "-200000"
    }
  ],
  "message": "Get daily statistics successfully"
}
```

---

# 13. Thống kê Theo Tháng

## 13.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/finance/statistics/monthly`   |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `FINANCE_READ`                  |

## 13.2 Query Parameters

| Tên        | Kiểu          | Bắt buộc | Mặc định     | Mô tả                       |
| ---------- | ------------- | -------- | ------------ | --------------------------- |
| `store_id` | string (UUID) | ✓        | —            | ID cửa hàng                 |
| `year`     | number        | Không    | Năm hiện tại | Năm cần thống kê (vd: 2025) |

### 13.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T13:15:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "month": 1,
      "year": 2025,
      "opening_balance": "0",
      "total_receipts": "10000000",
      "total_payments": "5000000",
      "closing_balance": "5000000",
      "net_change": "5000000"
    },
    {
      "month": 2,
      "year": 2025,
      "opening_balance": "5000000",
      "total_receipts": "15000000",
      "total_payments": "8000000",
      "closing_balance": "12000000",
      "net_change": "7000000"
    }
  ],
  "message": "Get monthly statistics successfully"
}
```

---

# 14. Dashboard Tài chính

## 14.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/finance/dashboard`            |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `FINANCE_READ`                  |

## 14.2 Query Parameters

| Tên        | Kiểu          | Bắt buộc | Mô tả       |
| ---------- | ------------- | -------- | ----------- |
| `store_id` | string (UUID) | ✓        | ID cửa hàng |

### 14.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T13:20:00.000Z",
    "version": "v1"
  },
  "data": {
    "current_balance": "1200000",
    "today": {
      "receipts": {
        "total": "500000",
        "count": 5
      },
      "payments": {
        "total": "300000",
        "count": 3
      },
      "net": "200000"
    },
    "this_week": {
      "receipts": {
        "total": "2000000",
        "count": 20
      },
      "payments": {
        "total": "1000000",
        "count": 15
      },
      "net": "1000000"
    },
    "this_month": {
      "receipts": {
        "total": "10000000",
        "count": 100
      },
      "payments": {
        "total": "6000000",
        "count": 80
      },
      "net": "4000000"
    }
  },
  "message": "Get dashboard successfully"
}
```

---

# 15. Sync Sổ Quỹ

## 15.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/finance/sync-cash-book`       |
| Request Method | **POST**                        |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `FINANCE_SYNC`                  |

> **Note:** API này dùng để tính toán lại sổ quỹ khi có sai lệch. Chỉ OWNER được phép gọi.

## 15.2 Query Parameters

| Tên         | Kiểu                | Bắt buộc | Mô tả       |
| ----------- | ------------------- | -------- | ----------- |
| `store_id`  | string (UUID)       | ✓        | ID cửa hàng |
| `from_date` | string (YYYY-MM-DD) | ✓        | Từ ngày     |
| `to_date`   | string (YYYY-MM-DD) | ✓        | Đến ngày    |

### 15.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-02-07T13:25:00.000Z",
    "version": "v1"
  },
  "data": {
    "message": "Sổ quỹ đã được đồng bộ thành công",
    "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
    "from_date": "2025-02-01",
    "to_date": "2025-02-28"
  },
  "message": "Sync cash book successfully"
}
```

---

# 16. Export Giao dịch ra Excel

## 16.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/finance/transactions/export`  |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `FINANCE_EXPORT`                |
| Response       | File `.xlsx`                    |

## 16.2 Query Parameters

Giống như `/finance/transactions` (section 3.2) để filter dữ liệu cần export

### 16.3 Response

**Success Response (200):**

- Trả về file Excel: `danh_sach_giao_dich_2025-02-07.xlsx`
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="danh_sach_giao_dich_2025-02-07.xlsx"`

**Nội dung file Excel:**

| STT | Mã phiếu | Loại      | Nguồn     | Số tiền (VNĐ) | Phương thức | Người liên hệ | Mô tả              | Ghi chú | Trạng thái | Ngày giao dịch   |
| --- | -------- | --------- | --------- | ------------- | ----------- | ------------- | ------------------ | ------- | ---------- | ---------------- |
| 1   | PT00001  | Phiếu thu | Bán hàng  | 500,000       | Tiền mặt    | Nguyễn Văn A  | Thu tiền bán hàng  |         | Đã duyệt   | 07/02/2025 10:30 |
| 2   | PC00001  | Phiếu chi | Nhập hàng | 300,000       | Tiền mặt    | Công ty ABC   | Chi tiền nhập hàng |         | Đã duyệt   | 07/02/2025 11:00 |

---

# 17. Export Sổ Quỹ ra Excel

## 17.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/finance/cash-book/export`     |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `FINANCE_EXPORT`                |
| Response       | File `.xlsx`                    |

## 17.2 Query Parameters

| Tên         | Kiểu                | Bắt buộc | Mô tả       |
| ----------- | ------------------- | -------- | ----------- |
| `store_id`  | string (UUID)       | ✓        | ID cửa hàng |
| `from_date` | string (YYYY-MM-DD) | Không    | Từ ngày     |
| `to_date`   | string (YYYY-MM-DD) | Không    | Đến ngày    |

### 17.3 Response

**Success Response (200):**

- Trả về file Excel: `so_quy_tien_mat_2025-02-07.xlsx`
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="so_quy_tien_mat_2025-02-07.xlsx"`

**Nội dung file Excel:**

| STT              | Ngày       | Số dư đầu kỳ (VNĐ) | Tổng thu (VNĐ) | Tổng chi (VNĐ) | Số dư cuối kỳ (VNĐ) | Phát sinh thuần (VNĐ) |
| ---------------- | ---------- | ------------------ | -------------- | -------------- | ------------------- | --------------------- |
| 1                | 01/02/2025 | 0                  | 1,000,000      | 0              | 1,000,000           | +1,000,000            |
| 2                | 02/02/2025 | 1,000,000          | 500,000        | 300,000        | 1,200,000           | +200,000              |
| **📊 TỔNG CỘNG** |            | 0                  | 1,500,000      | 300,000        | 1,200,000           | +1,200,000            |

---

# 18. Mẫu Lỗi chung

```json
{
  "success": false,
  "error": {
    "code": "<ERROR_CODE>",
    "message": "<mô tả lỗi>",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-02-07T14:00:00.000Z",
    "version": "v1"
  }
}
```

## Các mã lỗi thường gặp

| Error Code       | HTTP Status | Mô tả                                 |
| ---------------- | ----------- | ------------------------------------- |
| `BAD_REQUEST`    | 400         | Dữ liệu không hợp lệ                  |
| `UNAUTHORIZED`   | 401         | Chưa xác thực hoặc token không hợp lệ |
| `FORBIDDEN`      | 403         | Không có quyền truy cập               |
| `NOT_FOUND`      | 404         | Không tìm thấy resource               |
| `CONFLICT`       | 409         | Xung đột dữ liệu                      |
| `INTERNAL_ERROR` | 500         | Lỗi server                            |

---

# 19. Ghi chú triển khai

## 19.1 Định dạng dữ liệu

- Tất cả `id`, `store_id`, `created_by`, `reference_id`, `contact_id` đều là **UUID v4**
- `amount` là **Decimal(15,2)** - tối đa 999,999,999,999.99
- `code` tự động sinh: **PT00001, PT00002...** (Receipt) và **PC00001, PC00002...** (Payment)
- `transaction_date`, `createdAt`, `updatedAt` theo chuẩn **ISO 8601** (UTC)
- `date` trong Cash Book Entry: **YYYY-MM-DD 00:00:00**

## 19.2 Business Rules

### Phiếu Thu/Chi

- Mã phiếu tự động tăng theo store
- Status mặc định: `CONFIRMED` (có thể đổi thành `PENDING` nếu cần workflow approval)
- Không cho phép xóa vĩnh viễn, chỉ chuyển status = `CANCELLED`
- Không update được phiếu đã `CANCELLED`

### Sổ Quỹ

- Tự động tính toán mỗi ngày dựa trên transactions với `status=CONFIRMED`
- Số dư cuối ngày = Số dư đầu ngày + Tổng thu - Tổng chi
- Số dư cuối ngày hôm nay = Số dư đầu ngày hôm sau
- Khi tạo/sửa/hủy transaction → auto sync cash book của ngày đó

### Dashboard

- **Hôm nay**: Từ 00:00:00 đến 23:59:59 hôm nay
- **Tuần này**: Từ Chủ nhật tuần này đến hiện tại
- **Tháng này**: Từ ngày 1 của tháng đến hiện tại

## 19.3 Performance Notes

- API `/finance/transactions`: Có pagination (max 100 records/page)
- Export APIs: Không có giới hạn nhưng nên limit trong query
- Dashboard API: Cache 5 phút (recommended)
- Statistics APIs: Tính toán từ Cash Book Entry (đã aggregate)

## 19.4 Integration với Modules khác

Finance Module cung cấp helper methods để tích hợp:

```typescript
// Tự động tạo phiếu thu khi hoàn thành đơn bán hàng
financeService.createReceiptFromOrder(orderId, userId, amount, paymentMethod);

// Tự động tạo phiếu chi khi hoàn thành đơn nhập hàng
financeService.createPaymentFromPurchase(
  purchaseId,
  userId,
  amount,
  paymentMethod,
);

// Tự động tạo phiếu chi khi khách trả hàng
financeService.createPaymentFromOrderReturn(
  returnId,
  userId,
  amount,
  paymentMethod,
);

// Tự động tạo phiếu thu khi trả hàng cho NCC
financeService.createReceiptFromPurchaseReturn(
  returnId,
  userId,
  amount,
  paymentMethod,
);
```

---

# 20. Changelog

| Phiên bản | Ngày       | Thay đổi                                             |
| --------- | ---------- | ---------------------------------------------------- |
| v1.0.1    | 2025-02-07 | Sửa permissions: Bỏ MANAGER, chỉ giữ OWNER và MEMBER |
| v1.0      | 2025-02-07 | Phiên bản đầu tiên - 17 APIs                         |

---

**Hết tài liệu Finance API Routes v1**
