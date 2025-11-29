# Store Payment API Documentation

> Phiên bản: **v1**  
> Base URL: `http://localhost:3000/api/v1`  
> Tất cả các endpoint trong tài liệu này **yêu cầu xác thực** bằng **Access Token** (JWT) theo chuẩn `Authorization: Bearer <access_token>`.

---

# Phân quyền (Permissions)

## Yêu cầu vai trò theo API (trong store)

> **Ghi chú:** Cột "Vai trò tối thiểu" nghĩa là vai trò thấp nhất có thể gọi được API đó. **OWNER** luôn có thể gọi tất cả các API.

| **Endpoint**              | **Method** | **Vai trò tối thiểu** |
| ------------------------- | ---------- | --------------------- |
| `/store-payment/:storeId` | POST       | OWNER                 |
| `/store-payment/:storeId` | GET        | OWNER                 |
| `/store-payment/:storeId` | PATCH      | OWNER                 |

---

## Mapping Permissions

| **Vai trò** | **Permissions**                                                                           |
| ----------- | ----------------------------------------------------------------------------------------- |
| **OWNER**   | `PAYMENT_STORE_ALL` (`PAYMENT_STORE_CREATE`, `PAYMENT_STORE_UPDATE`, `PAYMENT_STORE_ALL`) |
| **MEMBER**  | Không có quyền cấu hình thanh toán                                                        |

**Hệ quả theo endpoint:**

- **Tạo thông tin thanh toán** (`POST /store-payment/:storeId`): OWNER ✅, MEMBER ❌
- **Lấy thông tin thanh toán** (`GET /store-payment/:storeId`): OWNER ✅, MEMBER ❌
- **Cập nhật thông tin thanh toán** (`PATCH /store-payment/:storeId`): OWNER ✅, MEMBER ❌

---

# 1. Tạo Thông tin Thanh toán

## 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/store-payment/:storeId`                                           |
| Request Method | **POST**                                                            |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | JSON schema bên dưới                                                |
| Quyền yêu cầu  | `PAYMENT_STORE_CREATE`                                              |

**JSON Schema (Body):**

```json
{
  "bank_code": "string",
  "bank_account_number": "string",
  "bank_name": "string"
}
```

### 1.2 Dữ liệu đầu vào

| **Tên trường**      | **Kiểu** | **Bắt buộc** | **Ghi chú**                                        |
| ------------------- | -------- | ------------ | -------------------------------------------------- |
| bank_code           | string   | ✓            | Mã ngân hàng (ví dụ: `VIETCOMBANK`, `TECHCOMBANK`) |
| bank_account_number | string   | ✓            | Số tài khoản ngân hàng                             |
| bank_name           | string   | ✓            | Tên ngân hàng                                      |

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
    "bank_code": "VIETCOMBANK",
    "bank_account_number": "1234567890",
    "bank_name": "Ngân hàng TMCP Ngoại Thương Việt Nam",
    "bank_qr_image_url": "https://example.com/qr/vietqr-1234567890.png",
    "createdAt": "2025-09-10T08:12:34.000Z",
    "updatedAt": "2025-09-10T08:12:34.000Z"
  },
  "message": "Tạo thông tin thanh toán thành công!"
}
```

**Error Response:**

- **400 Bad Request – Store ID không hợp lệ**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Không tìm thấy cửa hàng cần cấu hình. Vui lòng thử lại sau",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:22:54.387Z",
    "version": "v1"
  }
}
```

- **409 Conflict – Store đã cấu hình thông tin thanh toán**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Cửa hàng đã cấu hình thông tin thanh toán",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:22:54.387Z",
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

# 2. Lấy Thông tin Thanh toán

## 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/store-payment/:storeId`       |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `PAYMENT_STORE_ALL`             |

### 2.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": { "timestamp": "2025-09-10T08:21:55.000Z", "version": "v1" },
  "data": {
    "id": "b2e3e0d3-f9a6-4d94-8a7f-2a3c8b3d7f51",
    "store_id": "14a04419-ca46-4244-b42a-ca3d94ef9c48",
    "bank_code": "VIETCOMBANK",
    "bank_account_number": "1234567890",
    "bank_name": "Ngân hàng TMCP Ngoại Thương Việt Nam",
    "bank_qr_image_url": "https://example.com/qr/vietqr-1234567890.png",
    "createdAt": "2025-09-10T08:12:34.000Z",
    "updatedAt": "2025-09-10T08:12:34.000Z"
  },
  "message": "Get payment info successfully"
}
```

**Error Response:**

- **400 Bad Request – Store ID không hợp lệ hoặc chưa cấu hình**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Không tìm thấy cửa hàng cần cấu hình. Vui lòng thử lại sau",
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
  "meta": { "timestamp": "2025-09-10T08:21:55.000Z", "version": "v1" }
}
```

---

# 3. Cập nhật Thông tin Thanh toán

## 3.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/store-payment/:storeId`                                           |
| Request Method | **PATCH**                                                           |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | JSON schema (partial) bên dưới                                      |
| Quyền yêu cầu  | `PAYMENT_STORE_UPDATE`                                              |

**JSON Schema (Body – mọi trường đều **optional**):**

```json
{
  "bank_code": "string",
  "bank_account_number": "string",
  "bank_name": "string"
}
```

### 3.2 Dữ liệu đầu vào

| **Tên trường**      | **Kiểu** | **Bắt buộc** | **Ghi chú**                         |
| ------------------- | -------- | ------------ | ----------------------------------- |
| bank_code           | string   | Không        | Mã ngân hàng (ví dụ: `VIETCOMBANK`) |
| bank_account_number | string   | Không        | Số tài khoản ngân hàng              |
| bank_name           | string   | Không        | Tên ngân hàng                       |

> **Ghi chú:** Khi cập nhật, nếu không cung cấp giá trị nào, hệ thống sẽ giữ nguyên giá trị cũ. QR code sẽ được **tạo mới** dựa trên thông tin ngân hàng đã cập nhật.

### 3.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": { "timestamp": "2025-09-10T08:25:02.000Z", "version": "v1" },
  "data": {
    "id": "b2e3e0d3-f9a6-4d94-8a7f-2a3c8b3d7f51",
    "store_id": "14a04419-ca46-4244-b42a-ca3d94ef9c48",
    "bank_code": "TECHCOMBANK",
    "bank_account_number": "9876543210",
    "bank_name": "Ngân hàng TMCP Kỹ Thương Việt Nam",
    "bank_qr_image_url": "https://example.com/qr/vietqr-9876543210.png",
    "createdAt": "2025-09-10T08:12:34.000Z",
    "updatedAt": "2025-09-10T08:25:02.000Z"
  },
  "message": "Cập nhật thông tin thanh toán thành công!"
}
```

**Error Response:**

- **400 Bad Request – Store ID không hợp lệ hoặc chưa cấu hình**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Không tìm thấy cửa hàng cần cấu hình. Vui lòng thử lại sau",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:22:54.387Z",
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

# 4. Mẫu Lỗi chung

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

### Danh sách các Error Code chung:

| **Error Code** | **HTTP Status** | **Mô tả**                                  |
| -------------- | --------------- | ------------------------------------------ |
| `BAD_REQUEST`  | 400             | Dữ liệu không hợp lệ hoặc không tìm thấy   |
| `CONFLICT`     | 409             | Dữ liệu đã tồn tại (ví dụ: store đã setup) |
| `FORBIDDEN`    | 403             | Không có quyền truy cập                    |
| `NOT_FOUND`    | 404             | Tài nguyên không tìm thấy                  |

---

# 5. Ghi chú triển khai

- `:storeId` là **UUID**
- VietQR code được tự động sinh dựa trên thông tin ngân hàng (`bank_code`, `bank_account_number`, `bank_name`)
- Mỗi store chỉ có **một** bản ghi cấu hình thanh toán
- Khi cập nhật, nếu thông tin ngân hàng thay đổi, QR code sẽ được **tạo mới**
