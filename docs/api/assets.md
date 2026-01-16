# Asset API

> Phiên bản: **v1**
> Base URL: `http://localhost:3000`
>
> **Xác thực:**
> - Public: không cần token
> - Private/TEMP: dùng `Authorization: Bearer <access_token>`
>
> **Multi-tenant (Store):**
> - Mọi endpoint đều cần `storeId` trong URL.
>
> **Visibility:**
> - `PUBLIC`: ai cũng truy cập được
> - `PRIVATE`: chỉ uploader hoặc user được cấp quyền
> - `TEMP`: như PRIVATE + hết hạn trả 410 Gone

---

## 1. Upload Asset

### 1.1 Mô tả

| Thuộc tính | Giá trị |
| --- | --- |
| Request URL | `/stores/:storeId/assets` |
| Method | **POST** |
| Header | `Authorization: Bearer <token>` |
| Body | multipart/form-data |
| Quyền | bắt buộc đăng nhập |

**Form Data:**
- `file` (file) **bắt buộc**
- `visibility` (PUBLIC | PRIVATE | TEMP) optional, mặc định PUBLIC
- `expiresInSeconds` (number) optional, dùng cho TEMP
- `expiresAt` (ISO string) optional, dùng cho TEMP

### 1.2 Response thành công

```json
{
  "success": true,
  "meta": {
    "timestamp": "2026-01-13T10:00:00.000Z",
    "version": "v1"
  },
  "data": {
    "id": "ckxyz...",
    "visibility": "PUBLIC",
    "storageKey": "stores/<storeId>/public/2026/01/uuid.png",
    "url": "https://cdn.example.com/stores/<storeId>/public/2026/01/uuid.png",
    "originalName": "logo.png",
    "mimeType": "image/png",
    "size": 12345,
    "checksum": "sha256...",
    "expiresAt": null
  },
  "message": "Upload asset thành công"
}
```

---

## 2. Get Asset Info

### 2.1 Mô tả

| Thuộc tính | Giá trị |
| --- | --- |
| Request URL | `/stores/:storeId/assets/:id` |
| Method | **GET** |
| Header | `Authorization: Bearer <token>` (optional) |
| Quyền | PUBLIC: không cần token, PRIVATE/TEMP: cần token |

### 2.2 Response thành công

```json
{
  "success": true,
  "meta": {
    "timestamp": "2026-01-13T10:00:00.000Z",
    "version": "v1"
  },
  "data": {
    "id": "ckxyz...",
    "visibility": "PRIVATE",
    "storageKey": "stores/<storeId>/private/2026/01/uuid.png",
    "url": "https://cdn.example.com/stores/<storeId>/private/2026/01/uuid.png",
    "originalName": "logo.png",
    "mimeType": "image/png",
    "size": 12345,
    "checksum": "sha256...",
    "expiresAt": null
  },
  "message": "Lấy thông tin asset"
}
```

---

## 3. Public Download

### 3.1 Mô tả

| Thuộc tính | Giá trị |
| --- | --- |
| Request URL | `/stores/:storeId/assets/public/:id` |
| Method | **GET** |
| Header | none |
| Quyền | chỉ PUBLIC |

**Response:** stream file (inline)

---

## 4. Private/TEMP Download

### 4.1 Mô tả

| Thuộc tính | Giá trị |
| --- | --- |
| Request URL | `/stores/:storeId/assets/:id/download` |
| Method | **GET** |
| Header | `Authorization: Bearer <token>` |
| Quyền | uploader hoặc permission READ |

**Response:** stream file (inline)

---

## 5. Update Visibility

### 5.1 Mô tả

| Thuộc tính | Giá trị |
| --- | --- |
| Request URL | `/stores/:storeId/assets/:id/visibility` |
| Method | **PATCH** |
| Header | `Authorization: Bearer <token>` |
| Body | JSON |
| Quyền | uploader hoặc permission WRITE |

**Ghi chú:**
- Asset đang `TEMP` hoặc đổi sang `TEMP` sẽ bị từ chối.
- File local được **move** sang thư mục visibility mới và cập nhật `storageKey`.

**JSON Schema:**
```json
{
  "visibility": "PUBLIC"
}
```

---

## 6. Delete Asset

### 6.1 Mô tả

| Thuộc tính | Giá trị |
| --- | --- |
| Request URL | `/stores/:storeId/assets/:id` |
| Method | **DELETE** |
| Header | `Authorization: Bearer <token>` |
| Quyền | uploader hoặc permission DELETE |

**Ghi chú:** asset được soft delete (`deletedAt`) và file local bị xóa.

---

## 7. Grant Permissions (Uploader Only)

### 7.1 Mô tả

| Thuộc tính | Giá trị |
| --- | --- |
| Request URL | `/stores/:storeId/assets/:id/permissions` |
| Method | **POST** |
| Header | `Authorization: Bearer <token>` |
| Body | JSON |
| Quyền | chỉ uploader |

**JSON Schema:**
```json
{
  "userId": "string",
  "actions": ["READ", "WRITE", "DELETE"]
}
```

### 7.2 Response thành công

```json
{
  "success": true,
  "meta": {
    "timestamp": "2026-01-13T10:00:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "id": "ckperm...",
      "assetId": "ckxyz...",
      "userId": "user-id",
      "action": "READ",
      "createdAt": "2026-01-13T10:00:00.000Z"
    }
  ],
  "message": "Cấp quyền asset thành công"
}
```

---

## 8. Revoke Permissions (Uploader Only)

### 8.1 Mô tả

| Thuộc tính | Giá trị |
| --- | --- |
| Request URL | `/stores/:storeId/assets/:id/permissions` |
| Method | **DELETE** |
| Header | `Authorization: Bearer <token>` |
| Body | JSON |
| Quyền | chỉ uploader |

**JSON Schema:**
```json
{
  "userId": "string",
  "actions": ["READ", "WRITE", "DELETE"]
}
```

---

## 9. Attach Link (Uploader hoặc WRITE)

### 9.1 Mô tả

| Thuộc tính | Giá trị |
| --- | --- |
| Request URL | `/stores/:storeId/assets/:id/links` |
| Method | **POST** |
| Header | `Authorization: Bearer <token>` |
| Body | JSON |
| Quyền | uploader hoặc permission WRITE |

**JSON Schema:**
```json
{
  "entityType": "PRODUCT",
  "entityId": "string",
  "field": "image"
}
```

---

## 10. Get Assets By Entity

### 10.1 Mô tả

| Thuộc tính | Giá trị |
| --- | --- |
| Request URL | `/stores/:storeId/assets/by-entity?entityType=...&entityId=...` |
| Method | **GET** |
| Header | `Authorization: Bearer <token>` (optional) |
| Quyền | PUBLIC: không cần token, PRIVATE/TEMP: cần token |

**Query params (pagination):**
- `page`, `limit`, `sortBy`, `sort`

### 10.2 Response thành công

```json
{
  "success": true,
  "meta": {
    "timestamp": "2026-01-13T10:00:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "id": "ckxyz...",
      "visibility": "PUBLIC",
      "storageKey": "stores/<storeId>/public/2026/01/uuid.png",
      "url": "https://cdn.example.com/stores/<storeId>/public/2026/01/uuid.png",
      "originalName": "logo.png",
      "mimeType": "image/png",
      "size": 12345,
      "checksum": "sha256...",
      "expiresAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "message": "Lấy danh sách asset theo entity"
}
```

---

## 11. Get My Assets

### 11.1 Mô tả

| Thuộc tính | Giá trị |
| --- | --- |
| Request URL | `/stores/:storeId/assets/my` |
| Method | **GET** |
| Header | `Authorization: Bearer <token>` |
| Quyền | bắt buộc đăng nhập |

**Query params:**
- `page`, `limit`, `sortBy`, `sort`
- `visibility` (PUBLIC | PRIVATE | TEMP)
- `startDate`, `endDate` (lọc theo createdAt)

### 11.2 Response thành công

```json
{
  "success": true,
  "meta": {
    "timestamp": "2026-01-13T10:00:00.000Z",
    "version": "v1"
  },
  "data": [
    {
      "id": "ckxyz...",
      "visibility": "PRIVATE",
      "storageKey": "stores/<storeId>/private/2026/01/uuid.png",
      "url": "https://cdn.example.com/stores/<storeId>/private/2026/01/uuid.png",
      "originalName": "logo.png",
      "mimeType": "image/png",
      "size": 12345,
      "checksum": "sha256...",
      "expiresAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "message": "Lấy danh sách asset đã tạo"
}
```

---

## 12. Error Responses (tham khảo)

**401 Unauthorized**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-01-13T10:00:00.000Z",
    "version": "v1"
  }
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-01-13T10:00:00.000Z",
    "version": "v1"
  }
}
```

**410 Gone (TEMP hết hạn)**
```json
{
  "success": false,
  "error": {
    "code": "ASSET_EXPIRED",
    "message": "Asset has expired",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-01-13T10:00:00.000Z",
    "version": "v1"
  }
}
```
