# Feedback API Routes

This API allows POS users to submit feedback and administrators to manage and respond to them.

## 1. Gửi phản hồi (POS User)

### 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                    |
| -------------- | ------------------------------ |
| Request URL    | `/feedback`                    |
| Request Method | POST                           |
| Request Header | Content-Type: application/json |
| Body data      | JSON schema bên dưới           |

**JSON Schema:**

```json
{
  "title": "string",
  "content": "string",
  "senderName": "string (optional)",
  "senderPhone": "string (optional)",
  "senderAddress": "string (optional)",
  "satisfactionRating": "POOR | FAIR | GOOD | EXCELLENT (optional)"
}
```

### 1.2 Dữ liệu đầu vào

| **Tên trường**     | **Kiểu** | **Bắt buộc** | **Ghi chú**                                   |
| ------------------ | -------- | ------------ | --------------------------------------------- |
| title              | string   | ✓            | Tiêu đề phản hồi                              |
| content            | string   | ✓            | Nội dung chi tiết                             |
| senderName         | string   |              | Tên người gửi (mặc định là username)          |
| senderPhone        | string   |              | Số điện thoại liên hệ                         |
| senderAddress      | string   |              | Địa chỉ người gửi                             |
| satisfactionRating | enum     |              | Mức độ hài lòng (POOR, FAIR, GOOD, EXCELLENT) |

### 1.3 Dữ liệu đầu ra

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "store_id": "uuid",
    "title": "Lỗi in bill",
    "content": "Nội dung phản hồi...",
    "status": "PROCESSING",
    "satisfactionRating": "GOOD",
    "ratedAt": "2026-03-11T08:00:00.000Z",
    "createdAt": "2026-03-11T08:00:00.000Z"
  }
}
```

---

## 2. Xem lịch sử phản hồi của tôi (POS User)

### 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                 |
| -------------- | --------------------------- |
| Request URL    | `/feedback/my`              |
| Request Method | GET                         |
| Request Header | Authorization: Bearer token |

### 2.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "...",
      "status": "COMPLETED",
      "comments": [
        {
          "content": "Phản hồi từ Admin",
          "createdAt": "..."
        }
      ]
    }
  ]
}
```

---

## 3. Lấy toàn bộ danh sách phản hồi (Admin)

### 3.1 Mô tả

| **Thuộc tính** | **Giá trị** |
| -------------- | ----------- |
| Request URL    | `/feedback` |
| Request Method | GET         |
| Role           | ADMIN       |

### 3.2 Dữ liệu đầu ra

Trả về danh sách tất cả các phản hồi kèm thông tin người dùng và cửa hàng.

---

## 4. Cập nhật trạng thái phản hồi (Admin)

### 4.1 Mô tả

| **Thuộc tính** | **Giá trị**            |
| -------------- | ---------------------- |
| Request URL    | `/feedback/:id/status` |
| Request Method | PATCH                  |
| Body data      | JSON schema bên dưới   |

**JSON Schema:**

```json
{
  "status": "PROCESSING | REJECTED | COMPLETED",
  "rejectReason": "string (optional)"
}
```

---

## 5. Phản hồi/Bình luận (Admin)

### 5.1 Mô tả

Gửi tin nhắn phản hồi cho người dùng về ý kiến của họ.

| **Thuộc tính** | **Giá trị**             |
| -------------- | ----------------------- |
| Request URL    | `/feedback/:id/comment` |
| Request Method | POST                    |
| Body data      | `{"content": "string"}` |
| Role           | ADMIN                   |
