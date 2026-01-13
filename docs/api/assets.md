# Asset API Routes

> Phiên bản: **v1**
> Base URL: `http://localhost:3000`
>
> **Xac thuc:**
> - API public: khong can token
> - API private: dung `Authorization: Bearer <access_token>`
>
> **Visibility:**
> - `PUBLIC`: ai cung truy cap
> - `PRIVATE`: chi uploader hoac user duoc cap quyen
> - `TEMP`: nhu PRIVATE + het han thi 410 Gone

---

# 1. Upload Asset

## 1.1 Mo ta

| Thuoc tinh | Gia tri |
| --- | --- |
| Request URL | `/assets` |
| Request Method | **POST** |
| Request Header | `Authorization: Bearer <token>` |
| Body data | multipart/form-data |
| Quyen yeu cau | Bat buoc dang nhap |

**Form Data:**
- `file` (file) **bat buoc**
- `visibility` (PUBLIC | PRIVATE | TEMP) optional, mac dinh PUBLIC
- `expiresInSeconds` (number) optional, dung cho TEMP
- `expiresAt` (ISO string) optional, dung cho TEMP

## 1.2 Response thanh cong

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
    "storageKey": "public/2026/01/uuid.png",
    "url": "https://cdn.example.com/public/2026/01/uuid.png",
    "originalName": "logo.png",
    "mimeType": "image/png",
    "size": 12345,
    "checksum": "sha256...",
    "expiresAt": null
  },
  "message": "Upload asset thanh cong"
}
```

---

# 2. Get Asset Info

## 2.1 Mo ta

| Thuoc tinh | Gia tri |
| --- | --- |
| Request URL | `/assets/:id` |
| Request Method | **GET** |
| Request Header | `Authorization: Bearer <token>` (optional) |
| Quyen yeu cau | PUBLIC: khong can token, PRIVATE/TEMP: can token |

## 2.2 Response thanh cong

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
    "storageKey": "private/2026/01/uuid.png",
    "url": "https://cdn.example.com/private/2026/01/uuid.png",
    "originalName": "logo.png",
    "mimeType": "image/png",
    "size": 12345,
    "checksum": "sha256...",
    "expiresAt": null
  },
  "message": "Lay thong tin asset"
}
```

---

# 3. Public Download

## 3.1 Mo ta

| Thuoc tinh | Gia tri |
| --- | --- |
| Request URL | `/assets/public/:id` |
| Request Method | **GET** |
| Request Header | none |
| Quyen yeu cau | Chi PUBLIC |

**Response:** stream file (inline)

---

# 4. Private/TEMP Download

## 4.1 Mo ta

| Thuoc tinh | Gia tri |
| --- | --- |
| Request URL | `/assets/:id/download` |
| Request Method | **GET** |
| Request Header | `Authorization: Bearer <token>` |
| Quyen yeu cau | uploader hoac permission READ |

**Response:** stream file (inline)

---

# 5. Grant Permissions (Uploader Only)

## 5.1 Mo ta

| Thuoc tinh | Gia tri |
| --- | --- |
| Request URL | `/assets/:id/permissions` |
| Request Method | **POST** |
| Request Header | `Authorization: Bearer <token>` |
| Body data | JSON |
| Quyen yeu cau | chi uploader |

**JSON Schema:**
```json
{
  "userId": "string",
  "actions": ["READ", "WRITE", "DELETE"]
}
```

## 5.2 Response thanh cong

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
  "message": "Cap quyen asset thanh cong"
}
```

---

# 6. Revoke Permissions (Uploader Only)

## 6.1 Mo ta

| Thuoc tinh | Gia tri |
| --- | --- |
| Request URL | `/assets/:id/permissions` |
| Request Method | **DELETE** |
| Request Header | `Authorization: Bearer <token>` |
| Body data | JSON |
| Quyen yeu cau | chi uploader |

**JSON Schema:**
```json
{
  "userId": "string",
  "actions": ["READ", "WRITE", "DELETE"]
}
```

---

# 7. Attach Link (Uploader or WRITE)

## 7.1 Mo ta

| Thuoc tinh | Gia tri |
| --- | --- |
| Request URL | `/assets/:id/links` |
| Request Method | **POST** |
| Request Header | `Authorization: Bearer <token>` |
| Body data | JSON |
| Quyen yeu cau | uploader hoac WRITE |

**JSON Schema:**
```json
{
  "entityType": "PRODUCT",
  "entityId": "string",
  "field": "image"
}
```

---

# 8. Get Assets By Entity

## 8.1 Mo ta

| Thuoc tinh | Gia tri |
| --- | --- |
| Request URL | `/assets/by-entity?entityType=...&entityId=...` |
| Request Method | **GET** |
| Request Header | `Authorization: Bearer <token>` (optional) |
| Quyen yeu cau | PUBLIC: khong can token, PRIVATE/TEMP: can token |

**Query params (pagination):**
- `page`, `limit`, `sortBy`, `sort`

## 8.2 Response thanh cong

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
      "storageKey": "public/2026/01/uuid.png",
      "url": "https://cdn.example.com/public/2026/01/uuid.png",
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
  "message": "Lay danh sach asset theo entity"
}
```

---

# 9. Get My Assets

## 9.1 Mo ta

| Thuoc tinh | Gia tri |
| --- | --- |
| Request URL | `/assets/my` |
| Request Method | **GET** |
| Request Header | `Authorization: Bearer <token>` |
| Quyen yeu cau | bat buoc dang nhap |

**Query params:**
- `page`, `limit`, `sortBy`, `sort`
- `visibility` (PUBLIC | PRIVATE | TEMP)
- `startDate`, `endDate` (loc theo createdAt)

## 9.2 Response thanh cong

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
      "storageKey": "private/2026/01/uuid.png",
      "url": "https://cdn.example.com/private/2026/01/uuid.png",
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
  "message": "Lay danh sach asset da tao"
}
```

---

# 10. Error Responses (tham khao)

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

**410 Gone (TEMP het han)**
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
