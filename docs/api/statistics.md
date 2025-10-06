# Statistics API Routes

> Phiên bản: **v1**  
> Base URL: `http://localhost:3002/api/v1`  
> Tất cả các endpoint trong tài liệu này **yêu cầu xác thực** bằng **Access Token** (JWT) theo chuẩn `Authorization: Bearer <access_token>`.

---

# Phân quyền (Permissions)

## Yêu cầu vai trò theo API (trong store)

> **Ghi chú:** Cột "Vai trò tối thiểu" nghĩa là vai trò thấp nhất có thể gọi được API đó. **OWNER** luôn có thể gọi tất cả các API.

| **Endpoint**                                          | **Method** | **Vai trò tối thiểu** |
| ----------------------------------------------------- | ---------- | --------------------- |
| `/api/stores/:storeId/statistics/revenue`             | GET        | MEMBER                |
| `/api/stores/:storeId/statistics/notifications`       | GET        | MEMBER                |
| `/api/stores/:storeId/statistics/revenue-by-category` | GET        | MEMBER                |
| `/api/stores/:storeId/statistics/summary-revenue`     | GET        | MEMBER                |
| `/api/stores/:storeId/statistics/top-products`        | GET        | MEMBER                |
| `/api/stores/:storeId/statistics/low-stock-product`   | GET        | MEMBER                |

**Phân quyền:**

| **Vai trò** | **Quyền**                        |
| ----------- | -------------------------------- |
| **OWNER**   | Tất cả các endpoint thống kê     |
| **MEMBER**  | Đọc tất cả các endpoint thống kê |

---

# 1. Lấy Doanh thu theo Thời gian

## 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                           |
| -------------- | ------------------------------------- |
| Request URL    | `/stores/:storeId/statistics/revenue` |
| Request Method | **GET**                               |
| Request Header | `Authorization: Bearer <token>`       |
| Quyền yêu cầu  | `STATISTICS_READ`                     |

---

## 1.2 Query Parameters

| Tên    | Kiểu   | Bắt buộc | Mặc định | Mô tả                                                              |
| ------ | ------ | -------- | -------- | ------------------------------------------------------------------ |
| `type` | string | ✓        | —        | Loại thống kê: `day` (7 ngày), `week` (7 tuần), `month` (12 tháng) |

---

## 1.3 Dữ liệu đầu ra

### Success Response (200)

**Ví dụ với `type=day`:**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-06T10:30:00.000Z",
    "version": "v1"
  },
  "data": {
    "type": "day",
    "data": [
      { "key": "2025-09-30", "value": 1500000 },
      { "key": "2025-10-01", "value": 2300000 },
      { "key": "2025-10-02", "value": 1800000 },
      { "key": "2025-10-03", "value": 2100000 },
      { "key": "2025-10-04", "value": 1900000 },
      { "key": "2025-10-05", "value": 2500000 },
      { "key": "2025-10-06", "value": 1200000 }
    ]
  },
  "message": "Revenue retrieved successfully"
}
```

**Ví dụ với `type=week`:**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-06T10:30:00.000Z",
    "version": "v1"
  },
  "data": {
    "type": "week",
    "data": [
      { "key": "2025-08-19", "value": 8500000 },
      { "key": "2025-08-26", "value": 9200000 },
      { "key": "2025-09-02", "value": 7800000 },
      { "key": "2025-09-09", "value": 10100000 },
      { "key": "2025-09-16", "value": 9500000 },
      { "key": "2025-09-23", "value": 11200000 },
      { "key": "2025-09-30", "value": 8900000 }
    ]
  },
  "message": "Revenue retrieved successfully"
}
```

**Ví dụ với `type=month`:**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-06T10:30:00.000Z",
    "version": "v1"
  },
  "data": {
    "type": "month",
    "data": [
      { "key": "2024-11", "value": 35000000 },
      { "key": "2024-12", "value": 42000000 },
      { "key": "2025-01", "value": 38000000 },
      { "key": "2025-02", "value": 33000000 },
      { "key": "2025-03", "value": 45000000 },
      { "key": "2025-04", "value": 40000000 },
      { "key": "2025-05", "value": 47000000 },
      { "key": "2025-06", "value": 39000000 },
      { "key": "2025-07", "value": 44000000 },
      { "key": "2025-08", "value": 41000000 },
      { "key": "2025-09", "value": 48000000 },
      { "key": "2025-10", "value": 12000000 }
    ]
  },
  "message": "Revenue retrieved successfully"
}
```

### Error Responses

**400 – Bad Request (type không hợp lệ)**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid type parameter. Must be 'day', 'week', or 'month'",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-10-06T10:30:00.000Z",
    "version": "v1"
  }
}
```

**403 – Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired access token"
  },
  "meta": { "timestamp": "2025-10-06T10:30:00.000Z", "version": "v1" }
}
```

**404 – Store Not Found**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Store not found" },
  "meta": { "timestamp": "2025-10-06T10:30:00.000Z", "version": "v1" }
}
```

---

# 2. Lấy Thông báo

## 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                                     |
| -------------- | ----------------------------------------------- |
| Request URL    | `/api/stores/:storeId/statistics/notifications` |
| Request Method | **GET**                                         |
| Request Header | `Authorization: Bearer <token>`                 |
| Quyền yêu cầu  | `STATISTICS_READ`                               |

---

## 2.2 Dữ liệu đầu ra

### Success Response (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-06T10:35:00.000Z",
    "version": "v1"
  },
  "data": {
    "notifications": [
      {
        "title": "Đơn hàng ORD-2025-001 vừa tạo (1500000đ)",
        "time": "5 phút trước"
      },
      {
        "title": "Số lượng 50 sản phẩm Áo Thun Nam Basic đã được import",
        "time": "15 phút trước"
      },
      {
        "title": "Đơn hàng ORD-2025-002 vừa tạo (2300000đ)",
        "time": "1 giờ trước"
      },
      {
        "title": "Số lượng 30 sản phẩm Quần Jean Slim Fit đã được export",
        "time": "2 giờ trước"
      },
      {
        "title": "Đơn hàng ORD-2025-003 vừa tạo (980000đ)",
        "time": "3 giờ trước"
      }
    ]
  },
  "message": "Notifications retrieved successfully"
}
```

### Error Responses

**403 – Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired access token"
  },
  "meta": { "timestamp": "2025-10-06T10:35:00.000Z", "version": "v1" }
}
```

**404 – Store Not Found**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Store not found" },
  "meta": { "timestamp": "2025-10-06T10:35:00.000Z", "version": "v1" }
}
```

---

# 3. Doanh thu theo Danh mục

## 3.1 Mô tả

| **Thuộc tính** | **Giá trị**                                           |
| -------------- | ----------------------------------------------------- |
| Request URL    | `/api/stores/:storeId/statistics/revenue-by-category` |
| Request Method | **GET**                                               |
| Request Header | `Authorization: Bearer <token>`                       |
| Quyền yêu cầu  | `STATISTICS_READ`                                     |

---

## 3.2 Query Parameters

| Tên    | Kiểu   | Bắt buộc | Mặc định | Mô tả                                                                     |
| ------ | ------ | -------- | -------- | ------------------------------------------------------------------------- |
| `type` | string | ✓        | —        | Khoảng thời gian: `day` (hôm nay), `week` (tuần này), `month` (tháng này) |

---

## 3.3 Dữ liệu đầu ra

### Success Response (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-06T10:40:00.000Z",
    "version": "v1"
  },
  "data": {
    "total": 15800000,
    "categories": [
      { "name": "Áo Thun", "value": 5200000 },
      { "name": "Quần Jean", "value": 4300000 },
      { "name": "Áo Khoác", "value": 3100000 },
      { "name": "Phụ Kiện", "value": 2200000 },
      { "name": "Khác", "value": 1000000 }
    ]
  },
  "message": "Notifications retrieved successfully"
}
```

### Error Responses

**400 – Bad Request**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid type parameter",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-10-06T10:40:00.000Z",
    "version": "v1"
  }
}
```

**403 – Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired access token"
  },
  "meta": { "timestamp": "2025-10-06T10:40:00.000Z", "version": "v1" }
}
```

---

# 4. Tổng quan Doanh thu

## 4.1 Mô tả

| **Thuộc tính** | **Giá trị**                                       |
| -------------- | ------------------------------------------------- |
| Request URL    | `/api/stores/:storeId/statistics/summary-revenue` |
| Request Method | **GET**                                           |
| Request Header | `Authorization: Bearer <token>`                   |
| Quyền yêu cầu  | `STATISTICS_READ`                                 |

---

## 4.2 Query Parameters

| Tên    | Kiểu   | Bắt buộc | Mặc định | Mô tả                                                                     |
| ------ | ------ | -------- | -------- | ------------------------------------------------------------------------- |
| `type` | string | ✓        | —        | Khoảng thời gian: `day` (hôm nay), `week` (tuần này), `month` (tháng này) |

---

## 4.3 Dữ liệu đầu ra

### Success Response (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-06T10:45:00.000Z",
    "version": "v1"
  },
  "data": {
    "COMPLETED": {
      "count": 45,
      "revenue": 15800000
    }
  },
  "message": "Notifications retrieved successfully"
}
```

**Giải thích:**

- `COMPLETED`: Đơn hàng đã hoàn thành
- `count`: Số lượng đơn hàng
- `revenue`: Tổng doanh thu (đơn vị: VNĐ)

### Error Responses

**400 – Bad Request**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid type parameter",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-10-06T10:45:00.000Z",
    "version": "v1"
  }
}
```

**403 – Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired access token"
  },
  "meta": { "timestamp": "2025-10-06T10:45:00.000Z", "version": "v1" }
}
```

---

# 5. Sản phẩm Bán chạy

## 5.1 Mô tả

| **Thuộc tính** | **Giá trị**                                    |
| -------------- | ---------------------------------------------- |
| Request URL    | `/api/stores/:storeId/statistics/top-products` |
| Request Method | **GET**                                        |
| Request Header | `Authorization: Bearer <token>`                |
| Quyền yêu cầu  | `STATISTICS_READ`                              |

---

## 5.2 Dữ liệu đầu ra

### Success Response (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-06T10:50:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "product": {
        "id": "b2e3e0d3-f9a6-4d94-8a7f-2a3c8b3d7f51",
        "name": "Áo Thun Nam Basic",
        "image_url": "https://example.com/images/tshirt-basic.jpg",
        "inventory": {
          "quantity": 150
        },
        "price": 199000
      },
      "quantitySold": 85,
      "total": 16915000
    },
    {
      "product": {
        "id": "c3f4f1e4-g0b7-5e05-9b8g-3b4d9c4e8g62",
        "name": "Quần Jean Slim Fit",
        "image_url": "https://example.com/images/jean-slim.jpg",
        "inventory": {
          "quantity": 120
        },
        "price": 450000
      },
      "quantitySold": 62,
      "total": 27900000
    },
    {
      "product": {
        "id": "d4g5g2f5-h1c8-6f16-0c9h-4c5e0d5f9h73",
        "name": "Áo Khoác Bomber",
        "image_url": "https://example.com/images/bomber-jacket.jpg",
        "inventory": {
          "quantity": 80
        },
        "price": 750000
      },
      "quantitySold": 45,
      "total": 33750000
    }
  ],
  "message": "Notifications retrieved successfully"
}
```

**Giải thích:**

- Trả về tối đa **15 sản phẩm** bán chạy nhất
- Chỉ tính các đơn hàng có trạng thái `COMPLETED`
- Sắp xếp theo `quantitySold` giảm dần
- `total` = `quantitySold` × `price`

### Error Responses

**403 – Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired access token"
  },
  "meta": { "timestamp": "2025-10-06T10:50:00.000Z", "version": "v1" }
}
```

**404 – Store Not Found**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Store not found" },
  "meta": { "timestamp": "2025-10-06T10:50:00.000Z", "version": "v1" }
}
```

---

# 6. Sản phẩm Tồn kho Thấp

## 6.1 Mô tả

| **Thuộc tính** | **Giá trị**                                         |
| -------------- | --------------------------------------------------- |
| Request URL    | `/api/stores/:storeId/statistics/low-stock-product` |
| Request Method | **GET**                                             |
| Request Header | `Authorization: Bearer <token>`                     |
| Quyền yêu cầu  | `STATISTICS_READ`                                   |

---

## 6.2 Dữ liệu đầu ra

### Success Response (200)

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-10-06T10:55:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "product": {
        "id": "e5h6h3g6-i2d9-7g27-1d0i-5d6f1e6g0i84",
        "name": "Áo Polo Nam",
        "image_url": "https://example.com/images/polo.jpg",
        "inventory": {
          "quantity": 8
        },
        "price": 250000
      },
      "totalSold30Days": 45,
      "daysRemaining": 0,
      "avgDailySales": 1.5,
      "status": "critical"
    },
    {
      "product": {
        "id": "f6i7i4h7-j3e0-8h38-2e1j-6e7g2f7h1j95",
        "name": "Quần Short Kaki",
        "image_url": "https://example.com/images/short-kaki.jpg",
        "inventory": {
          "quantity": 25
        },
        "price": 320000
      },
      "totalSold30Days": 30,
      "daysRemaining": 25,
      "avgDailySales": 1,
      "status": "warning"
    }
  ],
  "message": "Notifications retrieved successfully"
}
```

**Giải thích:**

- Dựa trên dữ liệu bán hàng **30 ngày gần nhất**
- `daysRemaining` = `inventory.quantity` ÷ (trung bình số lượng bán/ngày)
- `status`:
  - `critical`: Còn dưới **7 ngày** tồn kho
  - `warning`: Còn dưới **30 ngày** tồn kho
  - `normal`: Còn trên **30 ngày** (không trả về)
- Chỉ trả về sản phẩm có `status` là `critical` hoặc `warning`
- Sắp xếp theo `daysRemaining` tăng dần (sản phẩm cần nhập gấp nhất ở đầu)

### Error Responses

**403 – Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired access token"
  },
  "meta": { "timestamp": "2025-10-06T10:55:00.000Z", "version": "v1" }
}
```

**404 – Store Not Found**

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Store not found" },
  "meta": { "timestamp": "2025-10-06T10:55:00.000Z", "version": "v1" }
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
    "timestamp": "2025-10-06T11:00:00.000Z",
    "version": "v1"
  }
}
```

**Các mã lỗi thường gặp:**

| Mã lỗi         | HTTP Status | Mô tả                                  |
| -------------- | ----------- | -------------------------------------- |
| `BAD_REQUEST`  | 400         | Tham số không hợp lệ                   |
| `UNAUTHORIZED` | 401         | Chưa đăng nhập hoặc token không hợp lệ |
| `FORBIDDEN`    | 403         | Không có quyền truy cập                |
| `NOT_FOUND`    | 404         | Không tìm thấy tài nguyên              |

---

# 8. Ghi chú triển khai

- `:storeId` là **UUID** của store
- Tất cả endpoint đều yêu cầu user phải là thành viên của store (OWNER hoặc MEMBER)
- Dữ liệu thống kê được tính dựa trên:
  - **Đơn hàng**: Chỉ tính đơn có trạng thái khác `CANCELLED`
  - **Doanh thu**: Dựa trên `total_amount` của đơn hàng
  - **Tồn kho**: Dựa trên bảng `inventory` và `stock_movement`
- Múi giờ: Tất cả ngày giờ đều theo **UTC**
- Định dạng số tiền: Đơn vị **VNĐ** (Việt Nam Đồng), không có dấu phân cách
