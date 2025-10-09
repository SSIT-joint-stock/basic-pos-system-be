# Customer API Routes

> Phiên bản: **v1**
> Base URL: `http://localhost:3000`
> Tất cả các endpoint trong tài liệu này **yêu cầu xác thực** bằng **Access Token** (JWT) theo chuẩn `Authorization: Bearer <access_token>`.

---

# Phân quyền (Permissions)

## Yêu cầu vai trò theo API (trong store)

> **Ghi chú:** Cột "Vai trò tối thiểu" nghĩa là vai trò thấp nhất có thể gọi được API đó. **OWNER** luôn có thể gọi tất cả các API.

| **Endpoint**                             | **Method** | **Vai trò tối thiểu** |
| ---------------------------------------- | ---------- | --------------------- |
| `/stores/:storeId/customers`             | POST       | MEMBER                |
| `/stores/:storeId/customers`             | GET        | MEMBER                |
| `/stores/:storeId/customers/:customerId` | GET        | MEMBER                |
| `/stores/:storeId/customers/:customerId` | PATCH      | MEMBER                |
| `/stores/:storeId/customers/:customerId` | DELETE     | OWNER                 |

--- | --- |
| **OWNER** | **ALL** (`CUSTOMER_ALL`, `CUSTOMER_READ`, `CUSTOMER_CREATE`, `CUSTOMER_UPDATE`, `CUSTOMER_DELETE`) |
| **MEMBER** | `CUSTOMER_READ`, `CUSTOMER_CREATE`, `CUSTOMER_UPDATE` |

**Hệ quả theo endpoint:**

- **Tạo khách hàng** (`POST /stores/:storeId/customers`): OWNER ✅, MEMBER ✅
- **Danh sách/Chi tiết** (`GET /stores/:storeId/customers[/:customerId]`): OWNER ✅, MEMBER ✅
- **Cập nhật** (`PATCH /stores/:storeId/customers/:customerId`): OWNER ✅, MEMBER ✅
- **Xoá** (`DELETE /stores/:storeId/customers/:customerId`): OWNER ✅, MEMBER ❌

---

# 1. Tạo Khách hàng

## 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/stores/:storeId/customers`                                        |
| Request Method | **POST**                                                            |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | JSON schema bên dưới                                                |
| Quyền yêu cầu  | `CUSTOMER_CREATE`                                                   |

**JSON Schema (Body):**

```json
{
  "name": "string",
  "phone": "string (optional, 9–20 chữ số)",
  "email": "string (optional, email hợp lệ)",
  "address": "string (optional)",
  "city": "string (optional)",
  "state": "string (optional)",
  "zip": "string (5 chữ số)",
  "country": "string (optional)"
}
```

### 1.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu** | **Bắt buộc** | **Ghi chú**                |
| -------------- | -------- | ------------ | -------------------------- |
| name           | string   | ✓            | Tên khách hàng             |
| phone          | string   |              | Số điện thoại, 9–20 chữ số |
| email          | string   |              | Email hợp lệ               |
| address        | string   |              | Địa chỉ                    |
| city           | string   |              | Thành phố                  |
| state          | string   |              | Tỉnh / khu vực             |
| zip            | string   |              | Mã bưu điện (5 chữ số)     |
| country        | string   |              | Quốc gia                   |

### 1.3 Dữ liệu đầu ra

**Success Response (201):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-09T12:21:32.544Z",
    "version": "v1"
  },
  "data": {
    "id": "1187e86c-a7ae-401c-acb9-c2a4766c5b36",
    "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
    "name": "Nguyễn Văn A",
    "phone": "+84901234567",
    "email": "nguyenvana@example.com",
    "address": "123 Đường Trần Phú",
    "city": "Hà Nội",
    "state": "Ba Đình",
    "zip": "10000",
    "country": "Việt Nam",
    "createdAt": "2025-10-09T12:21:32.514Z",
    "updatedAt": "2025-10-09T12:21:32.514Z"
  },
  "message": "Create customer successfully"
}
```

**Error Response:**

- **400 Bad Request – Dữ liệu không hợp lệ**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": {
      "validationErrors": [
        "Email không hợp lệ",
        "Mã ZIP phải gồm đúng 5 chữ số"
      ]
    }
  },
  "meta": {
    "timestamp": "2025-10-09T09:25:45.211Z",
    "version": "v1"
  }
}
```

---

# 2. Danh sách Khách hàng

## 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/stores/:storeId/customers`    |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `CUSTOMER_READ`                 |

## 2.2 Query Parameters

| Tên         | Kiểu              | Bắt buộc | Mặc định    | Mô tả                                                          |
| ----------- | ----------------- | -------- | ----------- | -------------------------------------------------------------- |
| `page`      | int (string)      | Không    | `1`         | Trang hiện tại                                                 |
| `limit`     | int (string)      | Không    | `10`        | Số bản ghi mỗi trang                                           |
| `sortBy`    | string            | Không    | `createdAt` | Trường sắp xếp. **Chỉ chấp nhận**: `createdAt`, `total_amount` |
| `sort`      | `'asc' \| 'desc'` | Không    | `desc`      | Thứ tự sắp xếp                                                 |
| `startDate` | string (ISO)      | Không    | —           | Lọc từ ngày bắt đầu (map `createdAt.gte`)                      |
| `endDate`   | string (ISO)      | Không    | —           | Lọc đến ngày kết thúc (map `createdAt.lte`)                    |
| `q`         | string            | Không    | —           | Tìm kiếm theo tên                                              |

---

### 2.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-09T12:16:42.553Z",
    "version": "v1"
  },
  "data": {
    "data": [
      {
        "id": "12c677bb-5eee-4e6a-b050-3a7626392005",
        "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
        "name": "Nguyễn Văn A",
        "phone": "+84901234567",
        "email": "nguyenvana@example.com",
        "address": "123 Đường Trần Phú",
        "city": "Hà Nội",
        "state": "Ba Đình",
        "zip": "10000",
        "country": "Việt Nam",
        "createdAt": "2025-10-09T12:12:20.327Z",
        "updatedAt": "2025-10-09T12:12:20.327Z"
      },
      {
        "id": "7bcc2619-adcb-4f12-9232-492a6f410a2b",
        "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
        "name": "Nguyễn Văn A",
        "phone": "+84901234567",
        "email": "nguyenvana@example.com",
        "address": "123 Đường Trần Phú",
        "city": "Hà Nội",
        "state": "Ba Đình",
        "zip": "10000",
        "country": "Việt Nam",
        "createdAt": "2025-10-09T12:12:09.236Z",
        "updatedAt": "2025-10-09T12:12:09.236Z"
      }
    ],
    "total": 2
  },
  "message": "Find all products successfully"
}
```

---

# 3. Chi tiết Khách hàng

## 3.1 Mô tả

| **Thuộc tính** | **Giá trị**                              |
| -------------- | ---------------------------------------- |
| Request URL    | `/stores/:storeId/customers/:customerId` |
| Request Method | **GET**                                  |
| Request Header | `Authorization: Bearer <token>`          |
| Quyền yêu cầu  | `CUSTOMER_READ`                          |

### 3.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-09T12:22:49.113Z",
    "version": "v1"
  },
  "data": {
    "id": "7bcc2619-adcb-4f12-9232-492a6f410a2b",
    "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
    "name": "Nguyễn Văn A",
    "phone": "+84901234567",
    "email": "nguyenvana@example.com",
    "address": "123 Đường Trần Phú",
    "city": "Hà Nội",
    "state": "Ba Đình",
    "zip": "10000",
    "country": "Việt Nam",
    "createdAt": "2025-10-09T12:12:09.236Z",
    "updatedAt": "2025-10-09T12:12:09.236Z"
  },
  "message": "Find customer by Id successfully"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Customer not found" },
  "meta": { "timestamp": "2025-10-09T09:41:00.000Z", "version": "v1" }
}
```

---

# 4. Cập nhật Khách hàng

## 4.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/stores/:storeId/customers/:customerId`                            |
| Request Method | **PATCH**                                                           |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | JSON schema (partial) bên dưới                                      |
| Quyền yêu cầu  | `CUSTOMER_UPDATE`                                                   |

**JSON Schema (Body – mọi trường đều optional):**

```json
{
  "name": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "zip": "string (5 chữ số)",
  "country": "string"
}
```

### 4.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-09T12:15:23.553Z",
    "version": "v1"
  },
  "data": {
    "id": "c4648a19-e5fd-406d-8caa-337bda3d24a0",
    "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e",
    "name": "Nguyễn Thị B",
    "phone": "+84987654321",
    "email": "nguyenthb@example.com",
    "address": "456 Lê Lợi",
    "city": "Đà Nẵng",
    "state": "Hải Châu",
    "zip": "55000",
    "country": "Việt Nam",
    "createdAt": "2025-10-09T12:12:25.710Z",
    "updatedAt": "2025-10-09T12:15:23.547Z"
  },
  "message": "Update customer successfully"
}
```

**Error Response (400 – Validation failed):**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": {
      "validationErrors": ["Số điện thoại không hợp lệ"]
    }
  },
  "meta": { "timestamp": "2025-10-09T09:45:00.000Z", "version": "v1" }
}
```

---

# 5. Xoá Khách hàng

## 5.1 Mô tả

| **Thuộc tính** | **Giá trị**                              |
| -------------- | ---------------------------------------- |
| Request URL    | `/stores/:storeId/customers/:customerId` |
| Request Method | **DELETE**                               |
| Request Header | `Authorization: Bearer <token>`          |
| Quyền yêu cầu  | `CUSTOMER_DELETE`                        |

### 5.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-09T12:23:33.915Z",
    "version": "v1"
  },
  "message": "Delete customer successfully"
}
```

**Error Response (404 – Not Found):**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Customer not found" },
  "meta": { "timestamp": "2025-10-09T09:50:00.000Z", "version": "v1" }
}
```

---

# 6. Mẫu Lỗi chung

```json
{
  "success": false,
  "error": {
    "code": "<ERROR_CODE>",
    "message": "<mô tả lỗi>",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-10-09T09:55:00.000Z",
    "version": "v1"
  }
}
```

---

# 7. Ghi chú triển khai

- `:storeId` và `:customerId` là **UUID**.
- `zip` chỉ nhận **5 chữ số hợp lệ**.
- Tìm kiếm (`q`) nên được áp dụng trên **name**.

---
