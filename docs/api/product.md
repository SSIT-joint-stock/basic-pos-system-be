# Product API Routes

> Phiên bản: **v1**  
> Base URL: `http://localhost:3000`  
> Tất cả các endpoint trong tài liệu này **yêu cầu xác thực** bằng **Access Token** (JWT) theo chuẩn `Authorization: Bearer <access_token>`.

# Phân quyền (Permissions)

## Yêu cầu vai trò theo API (trong store)

> **Ghi chú:** Cột "Vai trò tối thiểu" nghĩa là vai trò thấp nhất có thể gọi được API đó. **OWNER** luôn có thể gọi tất cả các API.

| **Endpoint**                           | **Method** | **Vai trò tối thiểu** |
| -------------------------------------- | ---------- | --------------------- |
| `/stores/:storeId/products`            | POST       | OWNER                 |
| `/stores/:storeId/products`            | GET        | MEMBER                |
| `/stores/:storeId/products/:productId` | GET        | MEMBER                |
| `/stores/:storeId/products/:productId` | PATCH      | MEMBER                |
| `/stores/:storeId/products/:productId` | DELETE     | OWNER                 |

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
| Request URL    | `/stores/:storeId/products`                                         |
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

## 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                       |
| -------------- | --------------------------------- |
| Request URL    | `/stores/:storeId/products`       |
| Request Method | **GET**                           |
| Request Header | `Authorization: Bearer <token>`   |
| Quyền yêu cầu  | `PRODUCT_READ` hoặc `PRODUCT_ALL` |

---

## 2.2 Query Parameters

| Tên         | Kiểu              | Bắt buộc | Mặc định    | Mô tả                                                          |
| ----------- | ----------------- | -------- | ----------- | -------------------------------------------------------------- |
| `page`      | int (string)      | Không    | `1`         | Trang hiện tại                                                 |
| `limit`     | int (string)      | Không    | `10`        | Số bản ghi mỗi trang                                           |
| `sortBy`    | string            | Không    | `createdAt` | Trường sắp xếp. **Chỉ chấp nhận**: `createdAt`, `total_amount` |
| `sort`      | `'asc' \| 'desc'` | Không    | `desc`      | Thứ tự sắp xếp                                                 |
| `startDate` | string (ISO)      | Không    | —           | Lọc từ ngày bắt đầu (map `createdAt.gte`)                      |
| `endDate`   | string (ISO)      | Không    | —           | Lọc đến ngày kết thúc (map `createdAt.lte`)                    |

---

## 2.3 Dữ liệu đầu ra

### Success Response (200)

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

### Error Responses

**403 – Forbidden**

```json
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "Insufficient permission" },
  "meta": { "timestamp": "2025-09-10T08:20:11.000Z", "version": "v1" }
}
```

**404 – Store Not Found**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Store not found" },
  "meta": { "timestamp": "2025-09-10T08:20:11.000Z", "version": "v1" }
}
```

---

Bạn có muốn mình sửa lại phần **Query Parameters** này theo nghiệp vụ chuẩn của **Product** (lọc theo `q`, `min_price`, `max_price`, `status`) thay vì để `payment_method`/`order_status` như code hiện tại không?

---

# 3. Chi tiết Sản phẩm

## 3.1 Mô tả

| **Thuộc tính** | **Giá trị**                            |
| -------------- | -------------------------------------- |
| Request URL    | `/stores/:storeId/products/:productId` |
| Request Method | **GET**                                |
| Request Header | `Authorization: Bearer <token>`        |
| Quyền yêu cầu  | `PRODUCT_READ` or `PRODUCT_ALL`        |

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
| Request URL    | `/stores/:storeId/products/:productId`                              |
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

| **Thuộc tính** | **Giá trị**                            |
| -------------- | -------------------------------------- |
| Request URL    | `/stores/:storeId/products/:productId` |
| Request Method | **DELETE**                             |
| Request Header | `Authorization: Bearer <token>`        |
| Quyền yêu cầu  | `PRODUCT_DELETE`                       |

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

# 6. Lọc Sản phẩm

## 6.1 Mô tả

| **Thuộc tính** | **Giá trị**                                |
| -------------- | ------------------------------------------ |
| Request URL    | `/stores/:storeId/products/filter-product` |
| Request Method | **GET**                                    |
| Request Header | `Authorization: Bearer <token>`            |
| Quyền yêu cầu  | `PRODUCT_READ` hoặc `PRODUCT_ALL`          |

---

## 6.2 Query Parameters

### Phân trang, sắp xếp, khoảng ngày (từ `@FilterParse`)

| Tên         | Kiểu              | Bắt buộc | Mặc định    | Mô tả                                                          |
| ----------- | ----------------- | -------- | ----------- | -------------------------------------------------------------- |
| `page`      | int (string)      | Không    | `1`         | Trang hiện tại                                                 |
| `limit`     | int (string)      | Không    | `10`        | Số bản ghi mỗi trang                                           |
| `sortBy`    | string            | Không    | `createdAt` | Trường sắp xếp. **Chỉ chấp nhận**: `createdAt`, `total_amount` |
| `sort`      | `'asc' \| 'desc'` | Không    | `desc`      | Thứ tự sắp xếp                                                 |
| `startDate` | string (ISO)      | Không    | —           | Lọc từ ngày bắt đầu (map vào `createdAt.gte`)                  |
| `endDate`   | string (ISO)      | Không    | —           | Lọc đến ngày kết thúc (map vào `createdAt.lte`, endOf('day'))  |

> `startDate`/`endDate` được decorator convert sang `createdAt: { gte, lte }`.

### Trường lọc (từ `FilterProductsDto`)

| Tên              | Kiểu         | Bắt buộc | Mô tả                                                                            |
| ---------------- | ------------ | -------- | -------------------------------------------------------------------------------- |
| `sku`            | string       | Không    | Khớp chính xác SKU                                                               |
| `barcode`        | string       | Không    | Khớp chính xác barcode                                                           |
| `min_price`      | number       | Không    | Giá bán tối thiểu (`price >= min_price`)                                         |
| `max_price`      | number       | Không    | Giá bán tối đa (`price <= max_price`)                                            |
| `min_cost`       | number       | Không    | Giá vốn tối thiểu (`cost >= min_cost`)                                           |
| `max_cost`       | number       | Không    | Giá vốn tối đa (`cost <= max_cost`)                                              |
| `image_url`      | string (URL) | Không    | Khớp chính xác `image_url`                                                       |
| `product_status` | enum         | Không    | Lọc theo trạng thái sản phẩm                                                     |
| `q`              | string       | Không    | Tìm kiếm toàn văn trong **name** và **description** (không phân biệt hoa thường) |

---

## 6.3 Dữ liệu đầu ra

### Success (200)

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
      "product_status": "ACTIVE",
      "createdAt": "2025-09-10T08:12:34.000Z",
      "updatedAt": "2025-09-10T08:12:34.000Z"
    }
  ],
  "message": "Filter product successfully"
}
```

### Error Responses

**403 – Forbidden**

```json
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "Insufficient permission" },
  "meta": { "timestamp": "2025-09-10T08:20:11.000Z", "version": "v1" }
}
```

**404 – Store Not Found**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Store not found" },
  "meta": { "timestamp": "2025-09-10T08:20:11.000Z", "version": "v1" }
}
```

---

# 7. Gợi ý Sản phẩm (Suggestion Product)

## 7.1 Mô tả

| **Thuộc tính** | **Giá trị**                                        |
| -------------- | -------------------------------------------------- |
| Request URL    | `/stores/:storeId/products/suggestions`            |
| Request Method | **GET**                                            |
| Request Header | `Authorization: Bearer <token>`                    |
| Quyền yêu cầu  | `PRODUCT_READ` hoặc `PRODUCT_ALL`                  |
| Ghi chú        | Trả về **gộp**: `PRODUCT` (ưu tiên) rồi `TEMPLATE` |

**Hành vi:**

- Tìm theo chuỗi `q` trong `name` (không phân biệt hoa thường).
- Ưu tiên **Product** (hàng đã từng tạo trong store) đứng **trước**; sau đó là **ProductTemplate** (mẫu toàn cục).
- Tự động **loại bỏ trùng** theo `barcode` (không trả Template có `barcode` đã tồn tại trong Product của store).

---

## 7.2 Query Parameters

| Tên     | Kiểu       | Bắt buộc | Mặc định | Mô tả                                                                         |
| ------- | ---------- | -------- | -------- | ----------------------------------------------------------------------------- |
| `q`     | string     | Không    | `''`     | Từ khoá tìm kiếm (match `name`, `barcode`, `sku`, không phân biệt hoa thường) |
| `limit` | number/int | Không    | `10`     | Số lượng gợi ý tối đa trả về                                                  |
| `skip`  | number/int | Không    | `0`      | Bỏ qua N bản ghi đầu (phục vụ phân trang “thô” nếu cần)                       |

> **Khuyến nghị:** với autocomplete, chỉ cần `q` và `limit`.

---

## 7.3 Dữ liệu đầu ra

### Success (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-11-02T14:15:04.310Z",
    "version": "v1"
  },
  "data": [
    {
      "id": "21c125c4-70ff-4efa-ac4b-6f254b7c59da",
      "name": "iPhone 16 Pro Max",
      "barcode": "8931234567890",
      "price": 33990000,
      "cost": 28990000,
      "image_url": "https://example.com/images/iphone-16-pro-max.png",
      "source": "PRODUCT",
      "inventory": {
        "quantity": 0
      },
      "categories": [],
      "tags": []
    },
    {
      "id": "ef3e0094-e571-448a-9cac-683af3884520",
      "name": "MacBook Pro 16\"",
      "barcode": "123456789013",
      "price": 249900,
      "cost": 200000,
      "image_url": "https://example.com/macbook.jpg",
      "source": "PRODUCT",
      "inventory": {
        "quantity": 9
      },
      "categories": [
        {
          "id": "71f76ad2-46b6-46c4-8218-b7ef012304a5",
          "store_id": "dbb6c582-f244-478b-b9ee-7a051a5c09af",
          "name": "Laptops",
          "description": "Portable computers",
          "createdAt": "2025-10-29T13:59:43.104Z",
          "updatedAt": "2025-10-29T13:59:43.104Z"
        }
      ],
      "tags": [
        {
          "id": "7fe88678-ef85-4dce-851c-510b08fd47c8",
          "name": "New",
          "description": "New products",
          "createdAt": "2025-10-29T13:59:43.111Z",
          "updatedAt": "2025-10-29T13:59:43.111Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Error Responses

**403 – Forbidden**

```json
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "Insufficient permission" },
  "meta": { "timestamp": "2025-11-02T11:20:11.000Z", "version": "v1" }
}
```

**404 – Store Not Found**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Store not found" },
  "meta": { "timestamp": "2025-11-02T11:20:11.000Z", "version": "v1" }
}
```

---

# 8. Tạo Nhiều Sản phẩm (Batch)

## 8.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                        |
| -------------- | ------------------------------------------------------------------ |
| Request URL    | `/stores/:storeId/products/invoice-create-product`                 |
| Request Method | **POST**                                                           |
| Request Header | `Authorization: Bearer <token>` · `Content-Type: application/json` |
| Body data      | JSON theo schema bên dưới                                          |
| Quyền yêu cầu  | `PRODUCT_CREATE` (OWNER)                                           |

**JSON Schema (Body):**

```json
[
  {
    "name": "iPhone 15 Pro Max",
    "sku": "IP15PM-128GB123456",
    "barcode": "8931234567890",
    "price": 33990000,
    "cost": 28990000,
    "image_url": "https://example.com/images/iphone-15-pro-max.png",
    "description": "Apple iPhone 15 Pro Max 256GB - Titanium Black",
    "product_status": "ACTIVE",
    "initial_quantity": 100,
    "meta": {
      "color": "Titanium Black",
      "storage": "256GB",
      "warranty": "12 months"
    }
  },
  {
    "name": "Samsung Galaxy S24 Ultra",
    "sku": "SSG-S24U-512GB",
    "barcode": "8939876543210",
    "price": 32990000,
    "cost": 27990000,
    "image_url": "https://example.com/images/samsung-s24-ultra.png",
    "description": "Samsung Galaxy S24 Ultra 512GB - Titanium Gray",
    "product_status": "ACTIVE",
    "initial_quantity": 50,
    "meta": {
      "color": "Titanium Gray",
      "storage": "512GB",
      "warranty": "12 months"
    }
  }
]
```

## 8.2 Dữ liệu đầu vào

| **Tên trường**   | **Kiểu** | **Bắt buộc** | **Ghi chú**                                          |
| ---------------- | -------- | ------------ | ---------------------------------------------------- |
| name             | string   | ✓            | Tên sản phẩm                                         |
| sku              | string   | ✓            | **Duy nhất trong 1 store**                           |
| barcode          | string   |              | Có thể để trống; nếu dùng thì **nên** duy nhất       |
| price            | number   | ✓            | ≥ 0                                                  |
| cost             | number   | ✓            | ≥ 0                                                  |
| image_url        | string   |              | URL hợp lệ                                           |
| description      | string   |              | Mô tả                                                |
| initial_quantity | number   |              | Số lượng tồn kho ban đầu (mặc định: 0)               |
| meta             | object   |              | Object JSON. Ví dụ: {"brand":"Nike","color":"Black"} |
| product_status   | enum     |              | `ACTIVE` (mặc định) \| `INACTIVE`                    |

## 8.3 Dữ liệu đầu ra

**Success Response (201):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-06T04:51:00.632Z",
    "version": "v1"
  },
  "data": {
    "createdCount": 2,
    "created": [
      {
        "id": "7bec783e-2ec7-4748-b9ec-5a8d3cf5377d",
        "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
        "name": "iPhone 15 Pro Max",
        "sku": "IP15PM-128GB123456",
        "barcode": "8931234567890",
        "price": 33990000,
        "cost": 28990000,
        "image_url": "https://example.com/images/iphone-15-pro-max.png",
        "description": "Apple iPhone 15 Pro Max 256GB - Titanium Black",
        "product_status": "ACTIVE",
        "meta": {
          "color": "Titanium Black",
          "storage": "256GB",
          "warranty": "12 months"
        },
        "inventory": {
          "id": "inv-001",
          "product_id": "7bec783e-2ec7-4748-b9ec-5a8d3cf5377d",
          "quantity": 100,
          "createdAt": "2025-10-06T04:51:00.620Z",
          "updatedAt": "2025-10-06T04:51:00.620Z"
        },
        "created_by": "49708d54-cb9c-4e73-b118-0b815b555fbc",
        "createdAt": "2025-10-06T04:51:00.620Z",
        "updatedAt": "2025-10-06T04:51:00.620Z"
      },
      {
        "id": "91c736f0-c85d-4331-adb7-3090323f3a7f",
        "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
        "name": "Samsung Galaxy S24 Ultra",
        "sku": "SSG-S24U-512GB",
        "barcode": "8939876543210",
        "price": 32990000,
        "cost": 27990000,
        "image_url": "https://example.com/images/samsung-s24-ultra.png",
        "description": "Samsung Galaxy S24 Ultra 512GB - Titanium Gray",
        "product_status": "ACTIVE",
        "meta": {
          "color": "Titanium Gray",
          "storage": "512GB",
          "warranty": "12 months"
        },
        "inventory": {
          "id": "inv-002",
          "product_id": "91c736f0-c85d-4331-adb7-3090323f3a7f",
          "quantity": 50,
          "createdAt": "2025-10-06T04:51:00.622Z",
          "updatedAt": "2025-10-06T04:51:00.622Z"
        },
        "created_by": "49708d54-cb9c-4e73-b118-0b815b555fbc",
        "createdAt": "2025-10-06T04:51:00.622Z",
        "updatedAt": "2025-10-06T04:51:00.622Z"
      }
    ]
  },
  "message": "Create product successfully"
}
```

**Error Response:**

- **400 Bad Request – SKU trùng lặp**

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_SKU",
    "message": "Duplicated SKU(s) detected",
    "details": {
      "duplicated_in_payload": ["SSG-S24U-512GB"],
      "duplicated_in_database": ["IP15PM-128GB123456"]
    }
  },
  "meta": {
    "timestamp": "2025-10-06T04:55:38.283Z",
    "version": "v1"
  }
}
```

- **400 Bad Request – Items rỗng hoặc thiếu SKU**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Every item must have a non-empty sku"
  },
  "meta": {
    "timestamp": "2025-10-06T04:55:38.283Z",
    "version": "v1"
  }
}
```

- **403 Forbidden – Không có quyền**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permission"
  },
  "meta": {
    "timestamp": "2025-09-10T08:12:34.000Z",
    "version": "v1"
  }
}
```

## 8.4 Lưu ý đặc biệt

- **Tự động tạo inventory**: Khi tạo product, hệ thống sẽ tự động tạo record `inventory` với số lượng = `initial_quantity` (mặc định 0)
- **Tự động tạo stock_movement**: Nếu `initial_quantity > 0`, hệ thống sẽ ghi lại 1 stock movement với type = `PURCHASE`
- **Transaction**: Toàn bộ quá trình tạo product + inventory + stock_movement được thực hiện trong 1 transaction, đảm bảo tính toàn vẹn dữ liệu
- **SKU validation**:
  - Kiểm tra trùng trong payload
  - Kiểm tra trùng với database
  - Nếu có bất kỳ trùng lặp nào, toàn bộ batch sẽ bị reject

---

# 8. Mẫu Lỗi chung

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

# 9. Tạo Nhiều Sản phẩm Template (Bulk Create/Update Product Templates)

## 9.1 Mô tả

| **Thuộc tính**   | **Giá trị**                                                                |
| ---------------- | -------------------------------------------------------------------------- |
| Request URL      | `/product-templates/bulk`                                                  |
| Request Method   | **POST**                                                                   |
| Request Header   | `Authorization: Bearer <token>`                                            |
| Quyền yêu cầu    | `PRODUCT_TEMPLATE_WRITE` hoặc `PRODUCT_ALL`                                |
| Phạm vi          | **Global** (không gắn `storeId`)                                           |
| Hành vi mặc định | **Upsert theo `barcode`**: tạo mới nếu chưa có; nếu đã có thì **cập nhật** |

> Nếu muốn **chỉ tạo mới** và báo lỗi khi `barcode` đã tồn tại, dùng `allowUpdate=false`.

---

## 9.2 Query Parameters

| Tên           | Kiểu    | Mặc định | Mô tả                                                                                 |
| ------------- | ------- | -------- | ------------------------------------------------------------------------------------- |
| `allowUpdate` | boolean | `true`   | `true`: cho phép cập nhật nếu `barcode` đã tồn tại. `false`: trả lỗi `409` khi trùng. |

Ví dụ:
`POST /product-templates/bulk?allowUpdate=false`

---

## 9.3 Request Body

**Kiểu:** Array of `CreateProductTemplateDto`

Mỗi phần tử:

| Trường             | Kiểu              | Bắt buộc | Ghi chú                                           |
| ------------------ | ----------------- | -------- | ------------------------------------------------- |
| `name`             | string            | ✅       |                                                   |
| `barcode`          | string            | ✅       | Khóa định danh để upsert                          |
| `price`            | number (>=0)      | ✅       |                                                   |
| `cost`             | number (>=0)      | ✅       |                                                   |
| `image_url`        | string (URL)      | ❌       |                                                   |
| `description`      | string            | ❌       |                                                   |
| `meta`             | object            | ❌       | Key–value mở rộng                                 |
| `initial_quantity` | number (int, >=0) | ❌       | **Chỉ lưu metadata** (template không giữ tồn kho) |
| `categoryIds`      | string[] (UUID)   | ❌       | Kết nối Category **nếu tồn tại**                  |

### Ví dụ Body hợp lệ

```json
[
  {
    "name": "Bim bim khoai tây BBQ",
    "barcode": "BBQ001",
    "price": 15000,
    "cost": 8000,
    "image_url": "https://example.com/images/bbq001.jpg",
    "description": "Vị BBQ cay nhẹ",
    "meta": { "brand": "Oishi", "weight": "45g" },
    "initial_quantity": 100,
    "categoryIds": ["9df47a10-582b-4f0d-97a3-f5c91e22bdb8"]
  },
  {
    "name": "Bim bim tôm cay",
    "barcode": "TOM002",
    "price": 12000,
    "cost": 6000
  }
]
```

---

## 9.4 Quy tắc xử lý & Validate

1. **Payload phải là mảng** và **không rỗng**.
2. **`barcode` không được rỗng** (sau `trim`) cho **mọi** phần tử.
3. **Không được trùng `barcode` trong cùng payload** → 400.
4. **`allowUpdate=true` (mặc định)**
   - Nếu `barcode` **đã tồn tại** → **cập nhật** các trường gửi lên.

5. **`allowUpdate=false`**
   - Nếu `barcode` **đã tồn tại** → **409 CONFLICT**, không tạo/cập nhật phần tử đó.

6. **`categoryIds`**
   - Chỉ `connect` **những ID tồn tại**; ID không tồn tại sẽ **bị bỏ qua** (không gây lỗi).

7. Bọc **transaction**; trả về **thống kê** `createdCount` / `updatedCount` và danh sách `created` / `updated`.

---

## 9.5 Response

### 200 – Success (mặc định `allowUpdate=true`)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-11-02T13:24:22.934Z",
    "version": "v1"
  },
  "data": {
    "updatedCount": 2,
    "createdCount": 0,
    "updated": [
      {
        "id": "887f8abf-bdfd-43fc-b4d1-69cb4a6f8c54",
        "name": "Bim bim khoai",
        "barcode": "BBQ001",
        "price": 15000,
        "cost": 8000,
        "image_url": "https://example.com/images/bbq001.jpg",
        "description": "Bim bim khoai tây giòn vị BBQ cay nhẹ",
        "meta": {
          "brand": "Oishi",
          "weight": "45g"
        },
        "createdAt": "2025-11-02T13:14:44.626Z",
        "updatedAt": "2025-11-02T13:24:22.904Z"
      },
      {
        "id": "0fc0fb77-1a70-43ea-b328-9a9cead29384",
        "name": "Bim bim tôm cay",
        "barcode": "TOM002",
        "price": 12000,
        "cost": 6000,
        "image_url": "https://example.com/images/tom002.jpg",
        "description": "Snack vị tôm cay giòn rụm",
        "meta": {
          "brand": "Poca",
          "weight": "35g"
        },
        "createdAt": "2025-11-02T13:14:44.628Z",
        "updatedAt": "2025-11-02T13:24:22.905Z"
      }
    ],
    "created": []
  },
  "message": "Create product successfully"
}
```

### 400 – Bad Request (trùng `barcode` trong payload)

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Duplicate barcodes found in payload: BBQ001, TOM002"
  },
  "meta": { "timestamp": "2025-11-02T11:45:13.000Z", "version": "v1" }
}
```

### 409 – Conflict (`allowUpdate=false` và `barcode` đã tồn tại)

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Some barcodes already exist and allowUpdate=false: BBQ001"
  },
  "meta": { "timestamp": "2025-11-02T11:45:13.000Z", "version": "v1" }
}
```

---

# 10. Ghi chú triển khai

- `:storeId` và `:id` là **UUID**.
