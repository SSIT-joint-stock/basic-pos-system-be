# Store Reward Point API Documentation

> Phiên bản: **v1**  
> Base URL: `http://localhost:3000/api/v1`  
> Tất cả các endpoint trong tài liệu này **yêu cầu xác thực** bằng **Access Token** (JWT) theo chuẩn `Authorization: Bearer <access_token>`.

---

# Phân quyền (Permissions)

## Yêu cầu vai trò theo API (trong store)

> **Ghi chú:** Cột "Vai trò tối thiểu" nghĩa là vai trò thấp nhất có thể gọi được API đó. **OWNER** luôn có thể gọi tất cả các API.

| **Endpoint**                   | **Method** | **Vai trò tối thiểu** |
| ------------------------------ | ---------- | --------------------- |
| `/store-reward-point/:storeId` | POST       | OWNER                 |

---

## Mapping Permissions

| **Vai trò** | **Permissions**                                                   |
| ----------- | ----------------------------------------------------------------- |
| **OWNER**   | `REWARD_POINT_ALL` (`REWARD_POINT_CREATE`, `REWARD_POINT_UPDATE`) |
| **MEMBER**  | Không có quyền cấu hình điểm quy đổi                              |

**Hệ quả theo endpoint:**

- **Cấu hình điểm quy đổi** (`POST /store-reward-point/:storeId`): OWNER ✅, MEMBER ❌

---

# 1. Cấu hình Điểm Quy đổi (Create / Update)

## 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                         |
| -------------- | ------------------------------------------------------------------- |
| Request URL    | `/store-reward-point/apply/:storeId`                                |
| Request Method | **POST**                                                            |
| Request Header | `Authorization: Bearer <token>`<br>`Content-Type: application/json` |
| Body data      | JSON schema bên dưới                                                |
| Quyền yêu cầu  | `REWARD_POINT_CREATE` hoặc `REWARD_POINT_UPDATE`                    |
| Hành vi        | **Upsert**: Tạo mới nếu chưa có; nếu đã có thì cập nhật             |

**JSON Schema (Body):**

```json
{
  "is_apply": true,
  "convert_rate": 1000,
  "point_value": 1,
  "description": "1 điểm quy đổi = 1000 VND"
}
```

### 1.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu** | **Bắt buộc** | **Ghi chú**                                                          |
| -------------- | -------- | ------------ | -------------------------------------------------------------------- |
| is_apply       | boolean  | Không        | Kích hoạt chương trình điểm quy đổi (mặc định: `false`)              |
| convert_rate   | number   | Không        | Tỷ lệ quy đổi điểm (ví dụ: 1000 = 1 điểm = 1000 VND) (mặc định: `0`) |
| point_value    | number   | Không        | Giá trị 1 điểm (mặc định: `0`)                                       |
| description    | string   | Không        | Mô tả chương trình điểm quy đổi (mặc định: `''`)                     |

> **Ghi chú:**
>
> - `convert_rate`: Số tiền tương ứng với 1 điểm. Ví dụ: `convert_rate = 1000` nghĩa là 1 điểm = 1000 VND
> - `point_value`: Giá trị tích lũy điểm. Ví dụ: `point_value = 1` nghĩa là mỗi 1 VND tiêu dùng = 1 điểm

### 1.3 Dữ liệu đầu ra

**Success Response (201 - Tạo mới) hoặc (200 - Cập nhật):**

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
    "is_apply": true,
    "convert_rate": 1000,
    "point_value": 1,
    "description": "1 điểm quy đổi = 1000 VND",
    "createdAt": "2025-09-10T08:12:34.000Z",
    "updatedAt": "2025-09-10T08:12:34.000Z"
  },
  "message": "Cấu hình điểm quy đổi thành công"
}
```

**Error Response:**

- **400 Bad Request – Dữ liệu không hợp lệ**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Dữ liệu không hợp lệ",
    "details": {
      "validationErrors": [
        "convert_rate phải lớn hơn 0",
        "point_value phải lớn hơn 0"
      ]
    }
  },
  "meta": {
    "timestamp": "2025-09-10T09:22:54.387Z",
    "version": "v1"
  }
}
```

- **400 Bad Request – Store ID không hợp lệ**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Store ID không hợp lệ",
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

# 2. Ví dụ Sử dụng

## 2.1 Tạo cấu hình điểm quy đổi lần đầu

**Request:**

```bash
curl -X POST http://localhost:3000/store-reward-point/14a04419-ca46-4244-b42a-ca3d94ef9c48 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_apply": true,
    "convert_rate": 1000,
    "point_value": 1,
    "description": "1 điểm = 1000 VND"
  }'
```

**Response (201):**

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
    "is_apply": true,
    "convert_rate": 1000,
    "point_value": 1,
    "description": "1 điểm = 1000 VND",
    "createdAt": "2025-09-10T08:12:34.000Z",
    "updatedAt": "2025-09-10T08:12:34.000Z"
  },
  "message": "Cấu hình điểm quy đổi thành công"
}
```

## 2.2 Cập nhật cấu hình điểm quy đổi

**Request:**

```bash
curl -X POST http://localhost:3000/store-reward-point/14a04419-ca46-4244-b42a-ca3d94ef9c48 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_apply": true,
    "convert_rate": 2000,
    "point_value": 2,
    "description": "Cập nhật: 1 điểm = 2000 VND"
  }'
```

**Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-10T08:25:02.000Z",
    "version": "v1"
  },
  "data": {
    "id": "b2e3e0d3-f9a6-4d94-8a7f-2a3c8b3d7f51",
    "store_id": "14a04419-ca46-4244-b42a-ca3d94ef9c48",
    "is_apply": true,
    "convert_rate": 2000,
    "point_value": 2,
    "description": "Cập nhật: 1 điểm = 2000 VND",
    "createdAt": "2025-09-10T08:12:34.000Z",
    "updatedAt": "2025-09-10T08:25:02.000Z"
  },
  "message": "Cấu hình điểm quy đổi thành công"
}
```

## 2.3 Vô hiệu hóa chương trình điểm quy đổi

**Request:**

```bash
curl -X POST http://localhost:3000/store-reward-point/14a04419-ca46-4244-b42a-ca3d94ef9c48 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_apply": false
  }'
```

**Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-10T08:30:15.000Z",
    "version": "v1"
  },
  "data": {
    "id": "b2e3e0d3-f9a6-4d94-8a7f-2a3c8b3d7f51",
    "store_id": "14a04419-ca46-4244-b42a-ca3d94ef9c48",
    "is_apply": false,
    "convert_rate": 2000,
    "point_value": 2,
    "description": "Cập nhật: 1 điểm = 2000 VND",
    "createdAt": "2025-09-10T08:12:34.000Z",
    "updatedAt": "2025-09-10T08:30:15.000Z"
  },
  "message": "Cấu hình điểm quy đổi thành công"
}
```

---

# 3. Mẫu Lỗi chung

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

| **Error Code** | **HTTP Status** | **Mô tả**                 |
| -------------- | --------------- | ------------------------- |
| `BAD_REQUEST`  | 400             | Dữ liệu không hợp lệ      |
| `FORBIDDEN`    | 403             | Không có quyền truy cập   |
| `NOT_FOUND`    | 404             | Tài nguyên không tìm thấy |

---

# 4. Validate Business Rules

- Mỗi store chỉ có **một** bản ghi cấu hình điểm quy đổi
- Các giá trị `convert_rate` và `point_value` nên **≥ 0**
- Nếu `is_apply = false`, chương trình điểm quy đổi **không hoạt động**
- Khi cập nhật, chỉ cần gửi các trường cần thay đổi (partial update)

---

# 5. Ghi chú triển khai

- `:storeId` là **UUID**
- Endpoint sử dụng **Upsert logic**: tạo mới nếu chưa có, cập nhật nếu đã tồn tại
- Response **luôn trả về toàn bộ** object sau khi tạo/cập nhật
- Timestamps `createdAt` chỉ cập nhật khi tạo lần đầu, `updatedAt` luôn thay đổi khi có cập nhật
- Mô tả chương trình (`description`) giúp lưu trữ quy tắc tính điểm hoặc thông tin hữu ích cho khách hàng
- Khuyến nghị: Kiểm tra `is_apply` trước khi áp dụng quy tắc quy đổi điểm trong các nghiệp vụ khác
