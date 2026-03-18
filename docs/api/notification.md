# Notification API Routes

# Ghi chú chung

## Xác thực (Authentication)

Tất cả các API trong module Notification (trừ các API Admin) đều yêu cầu người dùng đã đăng nhập.

- **Access Token** phải được gửi kèm trong header: `Authorization: Bearer <access_token>`
- Nếu thiếu hoặc token không hợp lệ, server sẽ trả về **403 Forbidden**

## Phân quyền (Authorization)

- **User APIs** (`/notifications/*`): Yêu cầu đăng nhập, áp dụng cho tài khoản thường.
- **Admin APIs** (`/admin/notifications/*`): Yêu cầu tài khoản có role `ADMIN`.

---

# User APIs

## 1. Lấy danh sách thông báo của người dùng

### 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                            |
| -------------- | -------------------------------------- |
| Request URL    | `/notifications`                       |
| Request Method | GET                                    |
| Request Header | `Authorization: Bearer <access_token>` |
| Query Params   | Xem bảng bên dưới                      |

### 1.2 Query Parameters

| **Tên tham số** | **Kiểu** | **Bắt buộc** | **Ghi chú**                                          |
| --------------- | -------- | ------------ | ---------------------------------------------------- |
| page            | number   | ✗            | Trang hiện tại (mặc định: 1)                         |
| limit           | number   | ✗            | Số bản ghi mỗi trang (mặc định: 10)                  |
| sortBy          | string   | ✗            | Trường sắp xếp, chỉ cho phép: `createdAt`            |
| sort            | string   | ✗            | Chiều sắp xếp: `asc` hoặc `desc` (mặc định: `desc`)  |
| is_read         | boolean  | ✗            | Lọc theo trạng thái đọc: `true` hoặc `false`         |
| type            | string   | ✗            | Lọc theo loại thông báo: `SYSTEM`, `PROMOTION`, v.v. |

### 1.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T04:32:19.574Z",
    "version": "v1"
  },
  "data": {
    "items": [
      {
        "id": "un-uuid-1",
        "user_id": "user-uuid",
        "notification_id": "notif-uuid-1",
        "is_read": false,
        "read_at": null,
        "createdAt": "2025-09-09T04:00:00.000Z",
        "notification": {
          "id": "notif-uuid-1",
          "title": "Chào mừng bạn!",
          "content": "Tài khoản của bạn đã được kích hoạt thành công.",
          "type": "SYSTEM",
          "metadata": null,
          "createdAt": "2025-09-09T03:00:00.000Z"
        }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "message": "Danh sách thông báo"
}
```

**Error Response:**

**403 Forbidden – Chưa đăng nhập hoặc chưa có access_token ở Authorization header**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired access token",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T07:23:45.295Z",
    "version": "v1"
  }
}
```

---

## 2. Lấy số lượng thông báo chưa đọc

### 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                            |
| -------------- | -------------------------------------- |
| Request URL    | `/notifications/unread-count`          |
| Request Method | GET                                    |
| Request Header | `Authorization: Bearer <access_token>` |
| Body data      | Không có                               |

### 2.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T04:32:19.574Z",
    "version": "v1"
  },
  "data": {
    "count": 5
  },
  "message": "Số thông báo chưa đọc"
}
```

**Error Response:**

**403 Forbidden – Chưa đăng nhập hoặc chưa có access_token ở Authorization header**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired access token",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T07:23:45.295Z",
    "version": "v1"
  }
}
```

---

## 3. Lấy chi tiết một thông báo

### 3.1 Mô tả

| **Thuộc tính** | **Giá trị**                                   |
| -------------- | --------------------------------------------- |
| Request URL    | `/notifications/:id`                          |
| Request Method | GET                                           |
| Request Header | `Authorization: Bearer <access_token>`        |
| Path Params    | `id` – ID của thông báo (UserNotification ID) |

### 3.2 Dữ liệu đầu vào

| **Tên tham số** | **Kiểu** | **Bắt buộc** | **Ghi chú**                     |
| --------------- | -------- | ------------ | ------------------------------- |
| id              | string   | ✓            | ID của bản ghi UserNotification |

### 3.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T04:32:19.574Z",
    "version": "v1"
  },
  "data": {
    "id": "un-uuid-1",
    "user_id": "user-uuid",
    "notification_id": "notif-uuid-1",
    "is_read": false,
    "read_at": null,
    "createdAt": "2025-09-09T04:00:00.000Z",
    "notification": {
      "id": "notif-uuid-1",
      "title": "Chào mừng bạn!",
      "content": "Tài khoản của bạn đã được kích hoạt thành công.",
      "type": "SYSTEM",
      "target_type": "ALL",
      "target_role": null,
      "metadata": null,
      "scheduled_at": null,
      "createdAt": "2025-09-09T03:00:00.000Z"
    }
  },
  "message": "Chi tiết thông báo"
}
```

**Error Response:**

**404 Not Found – Không tìm thấy thông báo**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy thông báo",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T04:32:19.574Z",
    "version": "v1"
  }
}
```

**403 Forbidden – Chưa đăng nhập hoặc chưa có access_token ở Authorization header**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired access token",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T07:23:45.295Z",
    "version": "v1"
  }
}
```

---

## 4. Đánh dấu một thông báo là đã đọc

### 4.1 Mô tả

| **Thuộc tính** | **Giá trị**                                   |
| -------------- | --------------------------------------------- |
| Request URL    | `/notifications/:id/read`                     |
| Request Method | PATCH                                         |
| Request Header | `Authorization: Bearer <access_token>`        |
| Path Params    | `id` – ID của thông báo (UserNotification ID) |

### 4.2 Dữ liệu đầu vào

| **Tên tham số** | **Kiểu** | **Bắt buộc** | **Ghi chú**                     |
| --------------- | -------- | ------------ | ------------------------------- |
| id              | string   | ✓            | ID của bản ghi UserNotification |

### 4.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T04:32:19.574Z",
    "version": "v1"
  },
  "data": {
    "id": "un-uuid-1",
    "user_id": "user-uuid",
    "notification_id": "notif-uuid-1",
    "is_read": true,
    "read_at": "2025-09-09T04:32:19.574Z",
    "createdAt": "2025-09-09T04:00:00.000Z"
  },
  "message": "Đánh dấu đã đọc thành công"
}
```

> **Lưu ý:** Nếu thông báo đã được đọc trước đó, server vẫn trả về 200 với dữ liệu hiện tại (không cập nhật lại `read_at`).

**Error Response:**

**404 Not Found – Không tìm thấy thông báo**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy thông báo",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T04:32:19.574Z",
    "version": "v1"
  }
}
```

**403 Forbidden – Chưa đăng nhập hoặc chưa có access_token ở Authorization header**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired access token",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T07:23:45.295Z",
    "version": "v1"
  }
}
```

---

## 5. Đánh dấu tất cả thông báo là đã đọc

### 5.1 Mô tả

| **Thuộc tính** | **Giá trị**                            |
| -------------- | -------------------------------------- |
| Request URL    | `/notifications/read-all`              |
| Request Method | PATCH                                  |
| Request Header | `Authorization: Bearer <access_token>` |
| Body data      | Không có                               |

### 5.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T04:32:19.574Z",
    "version": "v1"
  },
  "data": {
    "updated": 3
  },
  "message": "Đánh dấu tất cả đã đọc thành công"
}
```

> **Lưu ý:** Trường `updated` cho biết số lượng thông báo vừa được đánh dấu đã đọc. Nếu không có thông báo chưa đọc nào, `updated` sẽ là `0`.

**Error Response:**

**403 Forbidden – Chưa đăng nhập hoặc chưa có access_token ở Authorization header**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired access token",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T07:23:45.295Z",
    "version": "v1"
  }
}
```

---

# Admin APIs

> **Yêu cầu:** Tài khoản phải có role `ADMIN`. Nếu không, server trả về **403 Forbidden**.

## 6. Tạo thông báo mới (Admin)

### 6.1 Mô tả

| **Thuộc tính** | **Giá trị**                            |
| -------------- | -------------------------------------- |
| Request URL    | `/admin/notifications`                 |
| Request Method | POST                                   |
| Request Header | `Authorization: Bearer <access_token>` |
| Body data      | JSON schema bên dưới                   |

**JSON Schema:**

```json
{
  "title": "string",
  "content": "string",
  "type": "SYSTEM | PROMOTION | ...",
  "target_type": "ALL | ROLE | USER",
  "target_role": "USER | ADMIN | ...",
  "target_user_ids": ["string"],
  "scheduled_at": "ISO 8601 datetime string"
}
```

### 6.2 Dữ liệu đầu vào

| **Tên trường**  | **Kiểu** | **Bắt buộc** | **Ghi chú**                                                                       |
| --------------- | -------- | ------------ | --------------------------------------------------------------------------------- |
| title           | string   | ✓            | Tiêu đề thông báo                                                                 |
| content         | string   | ✓            | Nội dung thông báo                                                                |
| type            | enum     | ✗            | Loại thông báo. Mặc định: `SYSTEM`                                                |
| target_type     | enum     | ✗            | Đối tượng nhận: `ALL`, `ROLE`, `USER`. Mặc định: `ALL`                            |
| target_role     | enum     | ✗\*          | **Bắt buộc** khi `target_type = ROLE`. Ví dụ: `USER`, `ADMIN`                     |
| target_user_ids | string[] | ✗\*          | **Bắt buộc** khi `target_type = USER`. Danh sách User ID sẽ nhận thông báo        |
| scheduled_at    | string   | ✗            | Thời gian gửi theo lịch (ISO 8601). Nếu không có, thông báo được gửi ngay lập tức |

### 6.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T04:32:19.574Z",
    "version": "v1"
  },
  "data": {
    "id": "notif-uuid-1",
    "title": "Bảo trì hệ thống",
    "content": "Hệ thống sẽ bảo trì lúc 2:00 AM ngày 10/09/2025.",
    "type": "SYSTEM",
    "target_type": "ALL",
    "target_role": null,
    "created_by": "admin-uuid",
    "scheduled_at": null,
    "createdAt": "2025-09-09T04:32:19.574Z"
  },
  "message": "Tạo thông báo thành công"
}
```

**Error Response:**

**422 Unprocessable Entity – Thiếu target_role khi target_type = ROLE**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "target_role là bắt buộc khi target_type = ROLE",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T04:32:19.574Z",
    "version": "v1"
  }
}
```

**422 Unprocessable Entity – Thiếu target_user_ids khi target_type = USER**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "target_user_ids là bắt buộc khi target_type = USER",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T04:32:19.574Z",
    "version": "v1"
  }
}
```

**403 Forbidden – Không có quyền Admin**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired access token",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T07:23:45.295Z",
    "version": "v1"
  }
}
```

---

## 7. Lấy danh sách tất cả thông báo (Admin)

### 7.1 Mô tả

| **Thuộc tính** | **Giá trị**                            |
| -------------- | -------------------------------------- |
| Request URL    | `/admin/notifications`                 |
| Request Method | GET                                    |
| Request Header | `Authorization: Bearer <access_token>` |
| Query Params   | Xem bảng bên dưới                      |

### 7.2 Query Parameters

| **Tên tham số** | **Kiểu** | **Bắt buộc** | **Ghi chú**                                          |
| --------------- | -------- | ------------ | ---------------------------------------------------- |
| page            | number   | ✗            | Trang hiện tại (mặc định: 1)                         |
| limit           | number   | ✗            | Số bản ghi mỗi trang (mặc định: 10)                  |
| sortBy          | string   | ✗            | Trường sắp xếp, chỉ cho phép: `createdAt`            |
| sort            | string   | ✗            | Chiều sắp xếp: `asc` hoặc `desc` (mặc định: `desc`)  |
| type            | string   | ✗            | Lọc theo loại thông báo: `SYSTEM`, `PROMOTION`, v.v. |

### 7.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T04:32:19.574Z",
    "version": "v1"
  },
  "data": {
    "data": [
      {
        "id": "notif-uuid-1",
        "title": "Bảo trì hệ thống",
        "content": "Hệ thống sẽ bảo trì lúc 2:00 AM ngày 10/09/2025.",
        "type": "SYSTEM",
        "target_type": "ALL",
        "target_role": null,
        "created_by": "admin-uuid",
        "scheduled_at": null,
        "createdAt": "2025-09-09T04:32:19.574Z",
        "creator": {
          "id": "admin-uuid",
          "username": "admin",
          "email": "admin@example.com"
        },
        "_count": {
          "user_notifications": 150
        }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "message": "Danh sách thông báo (admin)"
}
```

**Error Response:**

**403 Forbidden – Không có quyền Admin**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired access token",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T07:23:45.295Z",
    "version": "v1"
  }
}
```

---

## 8. Lấy chi tiết một thông báo (Admin)

### 8.1 Mô tả

| **Thuộc tính** | **Giá trị**                            |
| -------------- | -------------------------------------- |
| Request URL    | `/admin/notifications/:id`             |
| Request Method | GET                                    |
| Request Header | `Authorization: Bearer <access_token>` |
| Path Params    | `id` – ID của Notification             |

### 8.2 Dữ liệu đầu vào

| **Tên tham số** | **Kiểu** | **Bắt buộc** | **Ghi chú**                 |
| --------------- | -------- | ------------ | --------------------------- |
| id              | string   | ✓            | ID của bản ghi Notification |

### 8.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T04:32:19.574Z",
    "version": "v1"
  },
  "data": {
    "id": "notif-uuid-1",
    "title": "Bảo trì hệ thống",
    "content": "Hệ thống sẽ bảo trì lúc 2:00 AM ngày 10/09/2025.",
    "type": "SYSTEM",
    "target_type": "ALL",
    "target_role": null,
    "created_by": "admin-uuid",
    "scheduled_at": null,
    "createdAt": "2025-09-09T04:32:19.574Z",
    "creator": {
      "id": "admin-uuid",
      "username": "admin",
      "email": "admin@example.com"
    },
    "_count": {
      "user_notifications": 150
    }
  },
  "message": "Chi tiết thông báo (admin)"
}
```

**Error Response:**

**404 Not Found – Không tìm thấy thông báo**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy thông báo",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T04:32:19.574Z",
    "version": "v1"
  }
}
```

**403 Forbidden – Không có quyền Admin**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired access token",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T07:23:45.295Z",
    "version": "v1"
  }
}
```

---

# Tổng hợp Endpoints

| **Method** | **URL**                       | **Quyền** | **Mô tả**                              |
| ---------- | ----------------------------- | --------- | -------------------------------------- |
| GET        | `/notifications`              | User      | Lấy danh sách thông báo của người dùng |
| GET        | `/notifications/unread-count` | User      | Lấy số lượng thông báo chưa đọc        |
| GET        | `/notifications/:id`          | User      | Lấy chi tiết một thông báo             |
| PATCH      | `/notifications/:id/read`     | User      | Đánh dấu một thông báo là đã đọc       |
| PATCH      | `/notifications/read-all`     | User      | Đánh dấu tất cả thông báo là đã đọc    |
| POST       | `/admin/notifications`        | Admin     | Tạo thông báo mới                      |
| GET        | `/admin/notifications`        | Admin     | Lấy danh sách tất cả thông báo         |
| GET        | `/admin/notifications/:id`    | Admin     | Lấy chi tiết một thông báo theo ID     |

---

# Enum Values

## notification_type

| **Giá trị** | **Mô tả**            |
| ----------- | -------------------- |
| `SYSTEM`    | Thông báo hệ thống   |
| `PROMOTION` | Thông báo khuyến mãi |

## notification_target_type

| **Giá trị** | **Mô tả**                                |
| ----------- | ---------------------------------------- |
| `ALL`       | Gửi tới tất cả người dùng đang hoạt động |
| `ROLE`      | Gửi tới người dùng theo role cụ thể      |
| `USER`      | Gửi tới danh sách người dùng cụ thể      |

## user_role (dùng trong target_role)

| **Giá trị** | **Mô tả**         |
| ----------- | ----------------- |
| `USER`      | Người dùng thường |
| `ADMIN`     | Quản trị viên     |
