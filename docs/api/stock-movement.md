# Stock Movement API Routes

> Phiên bản: **v1**
> Base URL: `http://localhost:3000`
> Tất cả các endpoint trong tài liệu này **yêu cầu xác thực** bằng **Access Token** (JWT) theo chuẩn `Authorization: Bearer <access_token>`.

---

# Phân quyền (Permissions)

## Yêu cầu vai trò theo API (trong store)

| **Endpoint**                               | **Method** | **Vai trò tối thiểu** |
| ------------------------------------------ | ---------- | --------------------- |
| `/api/stores/:storeId/stock-movements`     | GET        | MEMBER                |
| `/api/stores/:storeId/stock-movements/:id` | GET        | MEMBER                |

---

# 1. Danh sách Stock Movements

## 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                            |
| -------------- | -------------------------------------- |
| Request URL    | `/api/stores/:storeId/stock-movements` |
| Request Method | **GET**                                |
| Request Header | `Authorization: Bearer <token>`        |
| Quyền yêu cầu  | `STOCK_MOVEMENT_READ`                  |

### 1.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-11T15:12:51.487Z",
    "version": "v1"
  },
  "data": [
    {
      "id": "3044a113-c960-4df8-9669-3aac446d7a19",
      "product_id": "a9ede775-748c-4be1-8180-a994829bb6eb",
      "quantity": 20,
      "type": "ADJUSTMENT",
      "createdAt": "2025-09-11T14:46:07.192Z",
      "updatedAt": "2025-09-11T14:46:07.192Z"
    },
    {
      "id": "196117a5-257f-4b6f-be80-0720a097d21a",
      "product_id": "a9ede775-748c-4be1-8180-a994829bb6eb",
      "quantity": 20,
      "type": "ADJUSTMENT",
      "createdAt": "2025-09-10T03:45:36.996Z",
      "updatedAt": "2025-09-10T03:45:36.996Z"
    },
    {
      "id": "a9ede775-748c-4be1-8180-a994829bb6ec",
      "product_id": "a9ede775-748c-4be1-8180-a994829bb6eb",
      "quantity": 10,
      "type": "ADJUSTMENT",
      "createdAt": "2025-09-10T02:06:24.818Z",
      "updatedAt": "2025-09-10T02:06:02.630Z"
    }
  ],
  "message": "Find all stock movement successfully"
}
```

**Error Response:**

- **404 Not Found – Store không tồn tại**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Store not found" },
  "meta": { "timestamp": "2025-09-11T08:20:11.000Z", "version": "v1" }
}
```

---

# 2. Chi tiết Stock Movement

## 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                                |
| -------------- | ------------------------------------------ |
| Request URL    | `/api/stores/:storeId/stock-movements/:id` |
| Request Method | **GET**                                    |
| Request Header | `Authorization: Bearer <token>`            |
| Quyền yêu cầu  | `STOCK_MOVEMENT_READ`                      |

### 2.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-11T15:12:55.964Z",
    "version": "v1"
  },
  "data": {
    "id": "a9ede775-748c-4be1-8180-a994829bb6ec",
    "product_id": "a9ede775-748c-4be1-8180-a994829bb6eb",
    "quantity": 10,
    "type": "ADJUSTMENT",
    "createdAt": "2025-09-10T02:06:24.818Z",
    "updatedAt": "2025-09-10T02:06:02.630Z"
  },
  "message": "Find stock movement by Id successfully"
}
```

**Error Response:**

- **404 Not Found – Stock movement không tồn tại**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Stock movement not found" },
  "meta": { "timestamp": "2025-09-11T08:25:55.000Z", "version": "v1" }
}
```

---

# 4. Mẫu Lỗi chung

Cấu trúc giống như trong **product.md** :

```json
{
  "success": false,
  "error": {
    "code": "<ERROR_CODE>",
    "message": "<mô tả lỗi>",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-11T08:35:00.000Z",
    "version": "v1"
  }
}
```

---
