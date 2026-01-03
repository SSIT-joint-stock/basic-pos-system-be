````md
# Supplier API Routes

> Phiên bản: **v1**
> Base URL: `http://localhost:3000`
> Tất cả các endpoint trong tài liệu này **yêu cầu xác thực** bằng **Access Token** (JWT) theo chuẩn `Authorization: Bearer <access_token>`.

---

# Phân quyền (Permissions)

## Yêu cầu vai trò theo API (trong store)

> **Ghi chú:** Cột "Vai trò tối thiểu" nghĩa là vai trò thấp nhất có thể gọi được API đó. **OWNER** luôn có thể gọi tất cả các API.

| **Endpoint**                         | **Method** | **Vai trò tối thiểu** |
| ------------------------------------ | ---------- | --------------------- |
| `/supplier/:storeId`                 | POST       | MEMBER                |
| `/supplier/:storeId`                 | GET        | MEMBER                |
| `/supplier/:storeId/detail/:id`      | GET        | MEMBER                |
| `/supplier/:storeId/update/:id`      | PATCH      | MEMBER                |
| `/supplier/:storeId/delete/:id`      | DELETE     | OWNER                 |
| `/supplier/:storeId/soft-delete/:id` | PATCH      | OWNER                 |
| `/supplier/excel/example`            | GET        | MEMBER                |
| `/supplier/excel/import/:storeId`    | POST       | MEMBER                |
| `/supplier/excel/export/:storeId`    | GET        | MEMBER                |

--- | --- |
| **OWNER** | **ALL** (`SUPPLIER_ALL`, `SUPPLIER_READ`, `SUPPLIER_CREATE`, `SUPPLIER_UPDATE`, `SUPPLIER_DELETE`) |
| **MEMBER** | `SUPPLIER_READ`, `SUPPLIER_CREATE`, `SUPPLIER_UPDATE` |

**Hệ quả theo endpoint:**

- **Tạo nhà cung cấp** (`POST /supplier/:storeId`): OWNER ✅, MEMBER ✅
- **Danh sách/Chi tiết** (`GET /supplier/:storeId`, `GET /supplier/:storeId/detail/:id`): OWNER ✅, MEMBER ✅
- **Cập nhật** (`PATCH /supplier/:storeId/update/:id`): OWNER ✅, MEMBER ✅
- **Xoá** (`DELETE /supplier/:storeId/delete/:id`): OWNER ✅, MEMBER ❌
- **Xoá mềm** (`PATCH /supplier/:storeId/soft-delete/:id`): OWNER ✅, MEMBER ❌
- **Excel** (`/supplier/excel/*`): OWNER ✅, MEMBER ✅ _(Import cần CREATE, Export cần READ)_

---

# 1. Tạo Nhà cung cấp

## 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/supplier/:storeId`                                                |
| Request Method | **POST**                                                            |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | JSON schema bên dưới                                                |
| Quyền yêu cầu  | `SUPPLIER_CREATE`                                                   |

**JSON Schema (Body):**

```json
{
  "code": "string (optional)",
  "name": "string",
  "contact_person": "string (optional)",
  "address": "string (optional)",
  "tax_code": "string (optional)",
  "email": "string (optional, email hợp lệ)",
  "phone": "string (optional)",
  "bank_account": "object|string (optional)",
  "notes": "string (optional)",
  "status": "ACTIVE|INACTIVE (optional)"
}
```
````

### 1.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu**      | **Bắt buộc** | **Ghi chú**                                                 |
| -------------- | ------------- | ------------ | ----------------------------------------------------------- |
| code           | string        |              | Mã NCC (optional). Nếu không nhập, hệ thống có thể generate |
| name           | string        | ✓            | Tên nhà cung cấp                                            |
| contact_person | string        |              | Người liên hệ                                               |
| address        | string        |              | Địa chỉ                                                     |
| tax_code       | string        |              | Mã số thuế                                                  |
| email          | string        |              | Email hợp lệ (nếu có)                                       |
| phone          | string        |              | Số điện thoại                                               |
| bank_account   | object/string |              | Thông tin ngân hàng                                         |
| notes          | string        |              | Ghi chú                                                     |
| status         | enum          |              | `ACTIVE` / `INACTIVE`                                       |

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
    "code": "NCC00001",
    "name": "Công ty ABC",
    "contact_person": "Nguyễn Văn A",
    "address": "123 Đường Trần Phú",
    "tax_code": "0123456789",
    "email": "abc@example.com",
    "phone": "0901234567",
    "bank_account": {},
    "notes": "Ghi chú",
    "status": "ACTIVE",
    "createdAt": "2025-10-09T12:21:32.514Z",
    "updatedAt": "2025-10-09T12:21:32.514Z"
  },
  "message": "Tạo nhà cung cấp thành công!"
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
      "validationErrors": ["Email không hợp lệ"]
    }
  },
  "meta": {
    "timestamp": "2025-10-09T09:25:45.211Z",
    "version": "v1"
  }
}
```

- **409 Conflict – Trùng email/code**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Email nhà cung cấp đã tồn tại!",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-10-09T09:30:00.000Z",
    "version": "v1"
  }
}
```

---

# 2. Danh sách Nhà cung cấp

## 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/supplier/:storeId`            |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `SUPPLIER_READ`                 |

## 2.2 Query Parameters

| Tên         | Kiểu              | Bắt buộc | Mặc định    | Mô tả                                                           |
| ----------- | ----------------- | -------- | ----------- | --------------------------------------------------------------- |
| `page`      | int (string)      | Không    | `1`         | Trang hiện tại                                                  |
| `limit`     | int (string)      | Không    | `10`        | Số bản ghi mỗi trang                                            |
| `sortBy`    | string            | Không    | `createdAt` | Trường sắp xếp. **Chỉ chấp nhận**: `createdAt`, `name`, `email` |
| `sort`      | `'asc' \| 'desc'` | Không    | `desc`      | Thứ tự sắp xếp                                                  |
| `startDate` | string (ISO)      | Không    | —           | Lọc từ ngày bắt đầu (map `createdAt.gte`)                       |
| `endDate`   | string (ISO)      | Không    | —           | Lọc đến ngày kết thúc (map `createdAt.lte`)                     |
| `q`         | string            | Không    | —           | Tìm kiếm theo `code`, `name`, `tax_code`, `email`               |
| `code`      | string            | Không    | —           | Lọc theo code                                                   |
| `tax_code`  | string            | Không    | —           | Lọc theo MST                                                    |
| `status`    | enum              | Không    | —           | Lọc theo trạng thái (`supplier_status`)                         |

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
        "code": "NCC00001",
        "name": "Công ty ABC",
        "tax_code": "0123456789",
        "email": "abc@example.com",
        "phone": "0901234567",
        "status": "ACTIVE",
        "createdAt": "2025-10-09T12:12:20.327Z",
        "updatedAt": "2025-10-09T12:12:20.327Z"
      }
    ],
    "total": 1
  },
  "message": "Find all suppliers successfully"
}
```

---

# 3. Chi tiết Nhà cung cấp

## 3.1 Mô tả

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/supplier/:storeId/detail/:id` |
| Request Method | **GET**                         |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `SUPPLIER_READ`                 |

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
    "code": "NCC00001",
    "name": "Công ty ABC",
    "email": "abc@example.com",
    "phone": "0901234567",
    "status": "ACTIVE",
    "createdAt": "2025-10-09T12:12:09.236Z",
    "updatedAt": "2025-10-09T12:12:09.236Z"
  },
  "message": "Find supplier by Id successfully"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Supplier not found" },
  "meta": { "timestamp": "2025-10-09T09:41:00.000Z", "version": "v1" }
}
```

---

# 4. Cập nhật Nhà cung cấp

## 4.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/supplier/:storeId/update/:id`                                     |
| Request Method | **PATCH**                                                           |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | JSON schema (partial) bên dưới                                      |
| Quyền yêu cầu  | `SUPPLIER_UPDATE`                                                   |

**JSON Schema (Body – mọi trường đều optional):**

```json
{
  "code": "string",
  "name": "string",
  "contact_person": "string",
  "address": "string",
  "tax_code": "string",
  "email": "string",
  "phone": "string",
  "bank_account": "object|string",
  "notes": "string",
  "status": "ACTIVE|INACTIVE"
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
    "code": "NCC00001",
    "name": "Công ty ABC (Updated)",
    "email": "abc@example.com",
    "phone": "0901234567",
    "status": "ACTIVE",
    "createdAt": "2025-10-09T12:12:25.710Z",
    "updatedAt": "2025-10-09T12:15:23.547Z"
  },
  "message": "Cập nhật thông tin thành công!"
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
      "validationErrors": ["Email không hợp lệ"]
    }
  },
  "meta": { "timestamp": "2025-10-09T09:45:00.000Z", "version": "v1" }
}
```

---

# 5. Xoá Nhà cung cấp

## 5.1 Xoá cứng

| **Thuộc tính** | **Giá trị**                     |
| -------------- | ------------------------------- |
| Request URL    | `/supplier/:storeId/delete/:id` |
| Request Method | **DELETE**                      |
| Request Header | `Authorization: Bearer <token>` |
| Quyền yêu cầu  | `SUPPLIER_DELETE`               |

### Success Response (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-09T12:23:33.915Z",
    "version": "v1"
  },
  "message": "Xóa nhà cung cấp thành công!"
}
```

## 5.2 Xoá mềm

| **Thuộc tính** | **Giá trị**                          |
| -------------- | ------------------------------------ |
| Request URL    | `/supplier/:storeId/soft-delete/:id` |
| Request Method | **PATCH**                            |
| Request Header | `Authorization: Bearer <token>`      |
| Quyền yêu cầu  | `SUPPLIER_DELETE`                    |

### Success Response (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-09T12:23:33.915Z",
    "version": "v1"
  },
  "message": "Xóa nhà cung cấp thành công!"
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

- `:storeId` và `:id` là **UUID**.
- Tìm kiếm (`q`) áp dụng trên: **code, name, tax_code, email**.
- `status` filter theo enum `supplier_status`.
- **Xoá mềm** sẽ cập nhật `status = DELETE` và set `deletedAt`.

---

# 8. Excel – Mẫu / Import / Export Nhà cung cấp

> Các endpoint bên dưới yêu cầu `Authorization: Bearer <access_token>`.

---

## 8.1 Tải file Excel mẫu (Template)

### Mô tả

| Thuộc tính    | Giá trị                         |
| ------------- | ------------------------------- |
| Request URL   | `/supplier/excel/example`       |
| Method        | **GET**                         |
| Header        | `Authorization: Bearer <token>` |
| Quyền yêu cầu | `SUPPLIER_CREATE`               |
| Response      | File `.xlsx`                    |

### Response (200)

- Trả về file Excel mẫu: `supplier_template.xlsx`

---

## 8.2 Import nhà cung cấp từ Excel

### Mô tả

| Thuộc tính    | Giá trị                           |
| ------------- | --------------------------------- |
| Request URL   | `/supplier/excel/import/:storeId` |
| Method        | **POST**                          |
| Header        | `Authorization: Bearer <token>`   |
| Content-Type  | `multipart/form-data`             |
| Quyền yêu cầu | `SUPPLIER_CREATE`                 |
| Upload field  | `excel_supplier`                  |
| Response      | JSON                              |

### Form-data

| Key            | Type | Required | Ghi chú                    |
| -------------- | ---- | -------- | -------------------------- |
| excel_supplier | File | ✓        | File `.xlsx` đúng template |

### Quy tắc validate dữ liệu

- `name`: bắt buộc, không rỗng
- `code`: optional. Nếu trống, hệ thống **generate code** theo prefix (ví dụ: `NCC00001`)
- `email`: optional, nếu có phải đúng định dạng email
- Hệ thống check trùng `code` + `email` trong file và với DB (theo store)

### Success Response (200/201)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-12-23T05:28:00.954Z",
    "version": "v1"
  },
  "data": {
    "count": 10
  },
  "message": "Import suppliers successfully"
}
```

### Error Response

#### 400 – Dữ liệu Excel không hợp lệ (schema validate)

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "File Excel có dữ liệu không hợp lệ. Vui lòng nhập đúng dữ liệu với mẫu Excel!",
    "details": {
      "errors": [
        {
          "row": 3,
          "errors": {
            "name": ["Tên nhà cung cấp không được để trống"]
          }
        }
      ],
      "validCount": 5,
      "totalErrors": 1
    }
  },
  "meta": {
    "timestamp": "2025-12-23T05:30:00.000Z",
    "version": "v1"
  }
}
```

#### 409 – Trùng dữ liệu (code/email) trong file hoặc đã tồn tại

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Code trùng trong file: NCC00001 | Email đã tồn tại: abc@example.com",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-12-23T05:31:00.000Z",
    "version": "v1"
  }
}
```

---

## 8.3 Export danh sách nhà cung cấp ra Excel

### Mô tả

| Thuộc tính    | Giá trị                           |
| ------------- | --------------------------------- |
| Request URL   | `/supplier/excel/export/:storeId` |
| Method        | **GET**                           |
| Header        | `Authorization: Bearer <token>`   |
| Quyền yêu cầu | `SUPPLIER_READ`                   |
| Response      | File `.xlsx`                      |

### Response (200)

- Trả về file Excel: `supplier.xlsx`

---

```

```
