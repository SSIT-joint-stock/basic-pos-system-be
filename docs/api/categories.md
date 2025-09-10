# Category API Routes

## 1. Tạo danh mục mới

### 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                             |
| -------------- | ----------------------------------------------------------------------- |
| Request URL    | `/api/stores/:storeId/categories`                                       |
| Request Method | POST                                                                    |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token} |
| Body data      | Xem chi tiết JSON schema bên dưới                                       |
| Permission     | CATEGORY_CREATE                                                         |

**JSON Schema:**

```json
{
  "name": "string",
  "description": "string"
}
```

### 1.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú**                                      |
| -------------- | ---------------- | --------------------- | ------------ | ------------------------------------------------ |
| name           | Chuỗi ký tự      | 255                   | ✓            | Tên danh mục (không được trùng trong cùng store) |
| description    | Chuỗi ký tự      | 1000                  |              | Mô tả danh mục                                   |

### 1.3 Dữ liệu đầu ra

**Success Response (201):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "Date",
    "version": "v1"
  },
  "data": {
    "id": "uuid",
    "store_id": "uuid",
    "name": "string",
    "description": "string",
    "createdAt": "Date",
    "updatedAt": "Date"
  },
  "message": "Category created successfully"
}
```

**Error Response (409):**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Category already exists"
  },
  "meta": {
    "timestamp": "2025-09-10T09:13:49.811Z",
    "version": "v1"
  }
}
```

## 2. Lấy danh sách danh mục

### 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                          |
| -------------- | ------------------------------------ |
| Request URL    | `/api/stores/:storeId/categories`    |
| Request Method | GET                                  |
| Request Header | Authorization: Bearer {access_token} |
| Body data      | Không có                             |
| Permission     | CATEGORY_READ                        |

### 2.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-10T09:14:51.660Z",
    "version": "v1"
  },
  "data": [
    {
      "id": "95aba268-8ebf-4cfc-a9b5-9ab33c16ed1c",
      "store_id": "ee46b704-9cb8-4997-bd0f-a19e1289a316",
      "name": "test cateogries",
      "description": "test description",
      "createdAt": "2025-09-10T07:25:51.878Z",
      "updatedAt": "2025-09-10T07:25:51.878Z"
    },
    {
      "id": "a34b0696-2ecc-47ff-92d9-278369d6ff26",
      "store_id": "ee46b704-9cb8-4997-bd0f-a19e1289a316",
      "name": "test cateogries s34",
      "description": "test description",
      "createdAt": "2025-09-10T09:12:35.042Z",
      "updatedAt": "2025-09-10T09:12:35.042Z"
    }
  ],
  "message": "Categories retrieved successfully"
}
```

**Error Response (403): Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access Denied! You are not a member of this store",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:18:47.809Z",
    "version": "v1"
  }
}
```

## 3. Lấy thông tin danh mục theo ID

### 3.1 Mô tả

| **Thuộc tính** | **Giá trị**                           |
| -------------- | ------------------------------------- |
| Request URL    | `/api/stores/:storeId/categories/:id` |
| Request Method | GET                                   |
| Request Header | Authorization: Bearer {access_token}  |
| Body data      | Không có                              |
| Permission     | CATEGORY_READ                         |

### 3.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-10T09:18:06.346Z",
    "version": "v1"
  },
  "data": {
    "id": "c6bee166-80df-4685-ba6f-79d4bd15bfb5",
    "store_id": "742994f9-69ef-4464-ad87-89a10734bb78",
    "name": "test cateogries s34",
    "description": "test description",
    "createdAt": "2025-09-10T07:44:54.867Z",
    "updatedAt": "2025-09-10T07:44:54.867Z"
  },
  "message": "Category found"
}
```

**Error Response (404): Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Category not found not found",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:19:59.019Z",
    "version": "v1"
  }
}
```

**Error Response (403): Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access Denied! You are not a member of this store",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:18:47.809Z",
    "version": "v1"
  }
}
```

## 4. Cập nhật danh mục

### 4.1 Mô tả

| **Thuộc tính** | **Giá trị**                                                             |
| -------------- | ----------------------------------------------------------------------- |
| Request URL    | `/api/stores/:storeId/categories/:id`                                   |
| Request Method | PATCH                                                                   |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token} |
| Body data      | Xem chi tiết JSON schema bên dưới                                       |
| Permission     | CATEGORY_UPDATE                                                         |

**JSON Schema:**

```json
{
  "name": "string",
  "description": "string"
}
```

### 4.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú**                                      |
| -------------- | ---------------- | --------------------- | ------------ | ------------------------------------------------ |
| name           | Chuỗi ký tự      | 255                   |              | Tên danh mục (không được trùng trong cùng store) |
| description    | Chuỗi ký tự      | 1000                  |              | Mô tả danh mục                                   |

### 4.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-10T09:23:38.284Z",
    "version": "v1"
  },
  "data": {
    "id": "95aba268-8ebf-4cfc-a9b5-9ab33c16ed1c",
    "store_id": "ee46b704-9cb8-4997-bd0f-a19e1289a316",
    "name": "test cateogries s34 update",
    "description": "test description",
    "createdAt": "2025-09-10T07:25:51.878Z",
    "updatedAt": "2025-09-10T09:23:38.282Z"
  },
  "message": "Category updated successfully"
}
```

**Error Response (404/409):**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Category not found not found",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:23:57.635Z",
    "version": "v1"
  }
}
```

**Error Response (403): Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access Denied! You are not a member of this store",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:18:47.809Z",
    "version": "v1"
  }
}
```

## 5. Xóa danh mục

### 5.1 Mô tả

| **Thuộc tính** | **Giá trị**                           |
| -------------- | ------------------------------------- |
| Request URL    | `/api/stores/:storeId/categories/:id` |
| Request Method | DELETE                                |
| Request Header | Authorization: Bearer {access_token}  |
| Body data      | Không có                              |
| Permission     | CATEGORY_DELETE                       |

### 5.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-10T09:25:03.936Z",
    "version": "v1"
  },
  "data": {
    "id": "95aba268-8ebf-4cfc-a9b5-9ab33c16ed1c",
    "store_id": "ee46b704-9cb8-4997-bd0f-a19e1289a316",
    "name": "test cateogries s34 update",
    "description": "test description",
    "createdAt": "2025-09-10T07:25:51.878Z",
    "updatedAt": "2025-09-10T09:23:38.282Z"
  },
  "message": "Category deleted successfully"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Category not found not found",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:25:18.859Z",
    "version": "v1"
  }
}
```

**Error Response (403): Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access Denied! You are not a member of this store",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-10T09:18:47.809Z",
    "version": "v1"
  }
}
```

## Ghi chú

- Tất cả các endpoint đều yêu cầu xác thực thông qua Bearer token
- `storeId` trong URL path phải là UUID hợp lệ
- Tên danh mục không được trùng lặp trong cùng một store
- Khi xóa danh mục, cần kiểm tra xem có sản phẩm nào đang sử dụng danh mục này không
