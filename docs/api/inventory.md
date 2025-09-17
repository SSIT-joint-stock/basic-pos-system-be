# Inventory API Routes

> Phiên bản: **v1**
> Base URL: `http://localhost:3000`
> Tất cả các endpoint trong tài liệu này **yêu cầu xác thực** bằng **Access Token** (JWT) theo chuẩn `Authorization: Bearer <access_token>`.

---

# Phân quyền (Permissions)

## Yêu cầu vai trò theo API (trong store)

> **Ghi chú:** Cột "Vai trò tối thiểu" nghĩa là vai trò thấp nhất có thể gọi được API đó. **OWNER** luôn có thể gọi tất cả các API.

| **Endpoint**                                   | **Method** | **Vai trò tối thiểu** |
| ---------------------------------------------- | ---------- | --------------------- |
| `/api/stores/:storeId/inventories`             | GET        | MEMBER                |
| `/api/stores/:storeId/inventories/:id`         | GET        | MEMBER                |
| `/api/stores/:storeId/inventories/:id`         | PUT        | OWNER                 |
| `/api/stores/:storeId/inventories/revalue/:id` | PATCH      | OWNER                 |
| `/api/stores/:storeId/inventories/status/:id`  | PUT        | OWNER                 |

**Mapping quyền gợi ý:**

- **OWNER**: `INVENTORY_ALL` (bao gồm `INVENTORY_READ`, `INVENTORY_UPDATE`, `INVENTORY_REVALUE`, `INVENTORY_ADJUST`, `INVENTORY_STATUS`)
- **MEMBER**: `INVENTORY_READ`

**Hệ quả theo endpoint:**

- **Danh sách/Chi tiết**: OWNER ✅, MEMBER ✅
- **Điều chỉnh số lượng (adjust-quantity)**: OWNER ✅, MEMBER ❌
- **Điều chỉnh giá trị (revalue)**: OWNER ✅, MEMBER ❌
- **Đổi trạng thái (set-status)**: OWNER ✅, MEMBER ❌

---

# 1. Danh sách Inventory theo Store

## 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                           |
| -------------- | ------------------------------------- |
| Request URL    | `/api/stores/:storeId/inventories`    |
| Request Method | **GET**                               |
| Request Header | `Authorization: Bearer <token>`       |
| Quyền yêu cầu  | `INVENTORY_READ` hoặc `INVENTORY_ALL` |

### 1.2 Response

**200 OK**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-11T14:31:06.377Z",
    "version": "v1"
  },
  "data": [
    {
      "id": "83d23ff8-39e0-42ee-a552-0a53832a3774",
      "product_id": "a9ede775-748c-4be1-8180-a994829bb6eb",
      "quantity": 20,
      "discount": 15,
      "total": 100,
      "status": "INACTIVE",
      "createdAt": "2025-09-09T17:20:35.255Z",
      "updatedAt": "2025-09-10T03:53:50.625Z"
    }
  ],
  "message": "Find all inventory successfully"
}
```

**404 Not Found – Store không tồn tại**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Store not found" },
  "meta": { "timestamp": "2025-09-11T14:20:11.000Z", "version": "v1" }
}
```

**403 Forbidden – Không có quyền**

```json
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "Insufficient permission" },
  "meta": { "timestamp": "2025-09-11T14:20:11.000Z", "version": "v1" }
}
```

---

# 2. Get Inventory theo Id

## 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                            |
| -------------- | -------------------------------------- |
| Request URL    | `/api/stores/:storeId/inventories/:id` |
| Request Method | **GET**                                |
| Request Header | `Authorization: Bearer <token>`        |
| Quyền yêu cầu  | `INVENTORY_READ` hoặc `INVENTORY_ALL`  |

### 2.2 Response

**200 OK**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-11T14:36:30.975Z",
    "version": "v1"
  },
  "data": {
    "id": "83d23ff8-39e0-42ee-a552-0a53832a3774",
    "product_id": "a9ede775-748c-4be1-8180-a994829bb6eb",
    "quantity": 20,
    "discount": 15,
    "total": 100,
    "status": "INACTIVE",
    "createdAt": "2025-09-09T17:20:35.255Z",
    "updatedAt": "2025-09-10T03:53:50.625Z"
  },
  "message": "Find invetory by Id successfully"
}
```

**404 Not Found – Inventory không tồn tại**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Inventory not found" },
  "meta": { "timestamp": "2025-09-11T14:21:55.000Z", "version": "v1" }
}
```

---

# 3. Điều chỉnh số lượng (Adjust Quantity)

## 3.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/api/stores/:storeId/inventories/:id`                              |
| Request Method | **PUT**                                                             |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | `AdjustQuantityDto`                                                 |
| Quyền yêu cầu  | `INVENTORY_ADJUST` (OWNER)                                          |

**JSON Schema (Body):**

```json
{
  "delta": "number"
}
```

> `delta` phải là số khác 0. Dương = nhập thêm; âm = xuất bớt.
> Service kiểm tra quyền **OWNER** của store trước khi điều chỉnh.

### 3.2 Response

**200 OK**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-11T14:46:07.198Z",
    "version": "v1"
  },
  "data": {
    "id": "83d23ff8-39e0-42ee-a552-0a53832a3774",
    "quantity": 40,
    "product_id": "a9ede775-748c-4be1-8180-a994829bb6eb",
    "status": "ACTIVE",
    "updatedAt": "2025-09-11T14:46:07.190Z"
  },
  "message": "Adjust quantity successfully"
}
```

**400 Bad Request – Inventory or product is not active**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Inventory or product is not active",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-11T14:47:43.170Z",
    "version": "v1"
  }
}
```

**404 Not Found – Inventory không tồn tại**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Inventory not found" },
  "meta": { "timestamp": "2025-09-11T14:25:02.000Z", "version": "v1" }
}
```

**403 Forbidden – Không có quyền**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only the store owner can adjust"
  },
  "meta": { "timestamp": "2025-09-11T14:25:02.000Z", "version": "v1" }
}
```

---

# 4. Điều chỉnh giá trị (Revalue)

## 4.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/api/stores/:storeId/inventories/revalue/:id`                      |
| Request Method | **PATCH**                                                           |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | `RevalueDto`                                                        |
| Quyền yêu cầu  | `INVENTORY_REVALUE` (OWNER)                                         |

**JSON Schema (Body – optional fields):**

```json
{
  "discount": "number",
  "total": "number"
}
```

> Có thể gửi 1 trong 2 hoặc cả hai trường tuỳ use case
> và đều không phải số âm,
> Service chỉ cho phép **OWNER**.

### 4.2 Response

**200 OK**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-11T14:50:47.143Z",
    "version": "v1"
  },
  "data": {
    "id": "83d23ff8-39e0-42ee-a552-0a53832a3774",
    "product_id": "a9ede775-748c-4be1-8180-a994829bb6eb",
    "discount": 15,
    "total": 100,
    "status": "INACTIVE"
  },
  "message": "Revalue successfully"
}
```

**404 Not Found – Inventory không tồn tại**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Inventory not found" },
  "meta": { "timestamp": "2025-09-11T14:26:30.000Z", "version": "v1" }
}
```

**403 Forbidden – Không có quyền**

```json
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "Insufficient permission" },
  "meta": { "timestamp": "2025-09-11T14:26:30.000Z", "version": "v1" }
}
```

---

# 5. Đổi trạng thái Inventory (Set Status)

## 5.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/api/stores/:storeId/products/:productId/inventory/set-status`     |
| Request Method | **POST**                                                            |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | `SetStatusDto`                                                      |
| Quyền yêu cầu  | `INVENTORY_STATUS` (OWNER)                                          |

**JSON Schema (Body):**

```json
{
  "status": "ACTIVE"
}
```

> Hỗ trợ: `ACTIVE` | `INACTIVE` | `SOLD`.

### 5.2 Response

**200 OK**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-11T14:55:15.573Z",
    "version": "v1"
  },
  "data": {
    "id": "83d23ff8-39e0-42ee-a552-0a53832a3774",
    "product_id": "a9ede775-748c-4be1-8180-a994829bb6eb",
    "quantity": 40,
    "discount": 15,
    "total": 100,
    "status": "INACTIVE",
    "createdAt": "2025-09-09T17:20:35.255Z",
    "updatedAt": "2025-09-11T14:47:41.826Z",
    "product": {
      "store_id": "606a59f9-bd00-4304-a12e-efdb9e53d52e"
    }
  },
  "message": "Set status successfully"
}
```

**400 Bad Request – Trạng thái không hợp lệ**

```json
{
  "success": false,
  "error": { "code": "BAD_REQUEST", "message": "Invalid status" },
  "meta": { "timestamp": "2025-09-11T14:27:40.000Z", "version": "v1" }
}
```

---

# 6. Mẫu Lỗi chung

Cấu trúc lỗi thống nhất (theo mẫu product):

```json
{
  "success": false,
  "error": {
    "code": "<ERROR_CODE>",
    "message": "<mô tả lỗi>",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-11T14:30:00.000Z",
    "version": "v1"
  }
}
```

---

# 7. Ghi chú triển khai

- `:storeId`, `:id` là **UUID**.
- Các endpoint **đọc** hỗ trợ MEMBER; các endpoint **ghi** (adjust/revalue/set-status) giới hạn OWNER.
- `adjust-quantity` cập nhật `quantity` (và có thể cập nhật `total` theo logic vốn/giá nếu bạn đã triển khai).
- `revalue` cập nhật `discount`, `total` theo DTO; không thay đổi `quantity`.

---
