# Product API Routes

> Phiên bản: **v1**  
> Base URL: `http://localhost:3000`  
> Tất cả các endpoint trong tài liệu này **yêu cầu xác thực** bằng **Access Token** (JWT) theo chuẩn `Authorization: Bearer <access_token>`.

# Phân quyền (Permissions)

## Yêu cầu vai trò theo API (trong store)

> **Ghi chú:** Cột "Vai trò tối thiểu" nghĩa là vai trò thấp nhất có thể gọi được API đó. **OWNER** luôn có thể gọi tất cả các API.

| **Endpoint**                               | **Method** | **Vai trò tối thiểu** |
| ------------------------------------------ | ---------- | --------------------- |
| `/api/stores/:storeId/products`            | POST       | OWNER                 |
| `/api/stores/:storeId/products`            | GET        | MEMBER                |
| `/api/stores/:storeId/products/:productId` | GET        | MEMBER                |
| `/api/stores/:storeId/products/:productId` | PATCH      | MEMBER                |
| `/api/stores/:storeId/products/:productId` | DELETE     | OWNER                 |

--- | --- |
| **OWNER** | **ALL** (`PRODUCT_ALL` ,`PRODUCT_READ`, `PRODUCT_CREATE`, `PRODUCT_UPDATE`, `PRODUCT_DELETE`) |
| **MEMBER** | `PRODUCT_READ`, `PRODUCT_UPDATE` |

**Hệ quả theo endpoint:**

- **Tạo sản phẩm** (`POST /stores/:storeId/products`): OWNER ✅, MEMBER ❌
- **Danh sách/Chi tiết** (`GET /stores/:storeId/products[/:productId]`): OWNER ✅, MEMBER ✅
- **Cập nhật** (`PATCH /stores/:storeId/products/:productId`): OWNER ✅, MEMBER ✅
- **Xoá** (`DELETE /stores/:storeId/products/:productId`): OWNER ✅, MEMBER ❌
- **Kích hoạt/Ngừng kích hoạt** (`POST .../activate|deactivate`): OWNER ✅, MEMBER ✅

> Cần thay đổi hành vi? Hãy cập nhật mapping trên hoặc cấp thêm permission cho `MEMBER` khi khởi tạo user/role.

---

# 1. Tạo Sản phẩm

## 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/api/stores/:storeId/products`                                     |
| Request Method | **POST**                                                            |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | JSON schema bên dưới                                                |
| Quyền yêu cầu  | `PRODUCT_CREATE`                                                    |

**JSON Schema (Body):**

```json
{
  "name": "string",
  "sku": "string",
  "barcode": "string (optional)",
  "price": 0,
  "cost": 0,
  "image_url": "string (URL, optional)",
  "description": "string (optional)",
  "product_status": "ACTIVE | INACTIVE (optional)",
  "meta": "string (JSON, optional)"
}
```

### 1.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu** | **Bắt buộc** | **Ghi chú**                                                               |
| -------------- | -------- | ------------ | ------------------------------------------------------------------------- |
| name           | string   | ✓            | Tên sản phẩm                                                              |
| sku            | string   | ✓            | **Duy nhất trong 1 store**                                                |
| barcode        | string   |              | Có thể để trống; nếu dùng thì **nên** duy nhất                            |
| price          | number   | ✓            | ≥ 0                                                                       |
| cost           | number   | ✓            | ≥ 0                                                                       |
| image_url      | string   |              | URL hợp lệ                                                                |
| description    | string   |              | Mô tả                                                                     |
| meta           | string   |              | **JSON string hợp lệ**. Ví dụ: "{\"brand\":\"Nike\",\"color\":\"Black\"}" |
| product_status | enum     |              | `ACTIVE` (mặc định) \| `INACTIVE`                                         |

### 1.3 Dữ liệu đầu ra

**Success Response (201):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-10T08:12:34.000Z",
    "version": "v1"
  },
  "data": {
    "id": "b2e3e0d3-f9a6-4d94-8a7f-2a3c8b3d7f51",
    "store_id": "14a04419-ca46-4244-b42a-ca3d94ef9c48",
    "name": "Áo Thun Nam Basic",
    "sku": "TSHIRT-001",
    "barcode": "8938505971234",
    "price": 199000,
    "cost": 120000,
    "image_url": "https://example.com/images/tshirt-basic.jpg",
    "description": "Áo thun cotton thoáng mát",
    "status": "ACTIVE",
    "createdAt": "2025-09-10T08:12:34.000Z",
    "updatedAt": "2025-09-10T08:12:34.000Z"
  },
  "message": "Product created successfully"
}
```

**Error Response:**

- **409 Conflict – SKU đã tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "A product with this SKU already exists",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:22:54.387Z",
    "version": "v1"
  }
}
```

- **400 Bad Request – Dữ liệu không hợp lệ**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": {
      "validationErrors": ["price must not be less than 0"]
    }
  },
  "meta": {
    "timestamp": "2025-09-10T09:25:45.211Z",
    "version": "v1"
  }
}
```

- **403 Forbidden – Không có quyền**

```json
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "Insufficient permission" },
  "meta": { "timestamp": "2025-09-10T08:12:34.000Z", "version": "v1" }
}
```

---

# 2. Danh sách Sản phẩm

**NOTE** chua xong

## 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/api/stores/:storeId/products` |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `PRODUCT_READ` or `PRODUCT_ALL` |

### 2.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-10T08:20:11.000Z",
    "version": "v1",
    "pagination": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 }
  },
  "data": [
    {
      "id": "b2e3e0d3-f9a6-4d94-8a7f-2a3c8b3d7f51",
      "store_id": "14a04419-ca46-4244-b42a-ca3d94ef9c48",
      "name": "Áo Thun Nam Basic",
      "sku": "TSHIRT-001",
      "barcode": "8938505971234",
      "price": 199000,
      "cost": 120000,
      "image_url": "https://example.com/images/tshirt-basic.jpg",
      "description": "Áo thun cotton thoáng mát",
      "status": "ACTIVE",
      "createdAt": "2025-09-10T08:12:34.000Z",
      "updatedAt": "2025-09-10T08:12:34.000Z"
    }
  ],
  "message": "Find all product successfully"
}
```

**Error Response:**

- **404 Not Found – Store không tồn tại**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Store not found" },
  "meta": { "timestamp": "2025-09-10T08:20:11.000Z", "version": "v1" }
}
```

- **403 Forbidden – Không có quyền**

```json
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "Insufficient permission" },
  "meta": { "timestamp": "2025-09-10T08:20:11.000Z", "version": "v1" }
}
```

---

# 3. Chi tiết Sản phẩm

## 3.1 Mô tả

| **Thuộc tính** | **Giá trị**                                |
| -------------- | ------------------------------------------ |
| Request URL    | `/api/stores/:storeId/products/:productId` |
| Request Method | **GET**                                    |
| Request Header | `Authorization: Bearer <token>`            |
| Quyền yêu cầu  | `PRODUCT_READ` or `PRODUCT_ALL`            |

### 3.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": { "timestamp": "2025-09-10T08:21:55.000Z", "version": "v1" },
  "data": {
    "id": "b2e3e0d3-f9a6-4d94-8a7f-2a3c8b3d7f51",
    "store_id": "14a04419-ca46-4244-b42a-ca3d94ef9c48",
    "name": "Áo Thun Nam Basic",
    "sku": "TSHIRT-001",
    "barcode": "8938505971234",
    "price": 199000,
    "cost": 120000,
    "image_url": "https://example.com/images/tshirt-basic.jpg",
    "description": "Áo thun cotton thoáng mát",
    "status": "ACTIVE",
    "createdAt": "2025-09-10T08:12:34.000Z",
    "updatedAt": "2025-09-10T08:12:34.000Z"
  },
  "message": "Product fetched successfully"
}
```

**Error Response:**

- **404 Not Found – Product không tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product not found not found",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:31:14.235Z",
    "version": "v1"
  }
}
```

---

# 4. Cập nhật Sản phẩm

## 4.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/api/stores/:storeId/products/:productId`                          |
| Request Method | **PATCH**                                                           |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | JSON schema (partial) bên dưới                                      |
| Quyền yêu cầu  | `PRODUCT_UPDATE` or `PRODUCT_ALL`                                   |

**JSON Schema (Body – mọi trường đều **optional**):**

```json
{
  "name": "string",
  "sku": "string",
  "barcode": "string",
  "price": 0,
  "cost": 0,
  "image_url": "string",
  "description": "string",
  "product_status": "ACTIVE | INACTIVE",
  "meta": "string (JSON)"
}
```

### 4.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": { "timestamp": "2025-09-10T08:25:02.000Z", "version": "v1" },
  "data": {
    "id": "b2e3e0d3-f9a6-4d94-8a7f-2a3c8b3d7f51",
    "store_id": "14a04419-ca46-4244-b42a-ca3d94ef9c48",
    "name": "Áo Thun Basic (2025)",
    "sku": "TSHIRT-001",
    "barcode": "8938505971234",
    "price": 209000,
    "cost": 125000,
    "image_url": "https://example.com/images/tshirt-basic-2025.jpg",
    "description": "Bản nâng cấp 2025",
    "status": "ACTIVE",
    "createdAt": "2025-09-10T08:12:34.000Z",
    "updatedAt": "2025-09-10T08:25:02.000Z"
  },
  "message": "Product updated successfully"
}
```

**Error Response:**

- **409 Conflict – SKU đã tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "A product with this SKU already exists",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:22:54.387Z",
    "version": "v1"
  }
}
```

- **404 Not Found – Product không tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product not found not found",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:31:14.235Z",
    "version": "v1"
  }
}
```

- **403 Forbidden – Không có quyền**

```json
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "Insufficient permission" },
  "meta": { "timestamp": "2025-09-10T08:25:02.000Z", "version": "v1" }
}
```

---

# 5. Xoá Sản phẩm

## 5.1 Mô tả

| **Thuộc tính** | **Giá trị**                                |
| -------------- | ------------------------------------------ |
| Request URL    | `/api/stores/:storeId/products/:productId` |
| Request Method | **DELETE**                                 |
| Request Header | `Authorization: Bearer <token>`            |
| Quyền yêu cầu  | `PRODUCT_DELETE`                           |

### 5.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": { "timestamp": "2025-09-10T08:28:40.000Z", "version": "v1" },
  "message": "Product deleted successfully"
}
```

**Error Response:**

- **404 Not Found – Product không tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product not found not found",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:31:14.235Z",
    "version": "v1"
  }
}
```

- **403 Forbidden – Không có quyền**

```json
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "Insufficient permission" },
  "meta": { "timestamp": "2025-09-10T08:28:40.000Z", "version": "v1" }
}
```

---

# 7. Mẫu Lỗi chung

Các lỗi có cấu trúc:

```json
{
  "success": false,
  "error": {
    "code": "<ERROR_CODE>",
    "message": "<mô tả lỗi>",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T08:35:00.000Z",
    "version": "v1"
  }
}
```

---

# 8. Ghi chú triển khai

- `:storeId` và `:productId` là **UUID**.
