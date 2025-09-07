# Auth API Routes

## 1. Đăng nhập người dùng

### 1.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/auth/login` |
| Request Method | POST |
| Request Header | Content-Type: application/json |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "email": "string",
  "password": "string"
}
```

### 1.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| email | Chuỗi ký tự | 255 | ✓ | Email đăng nhập (phải là email hợp lệ) |
| password | Chuỗi ký tự | 72 | ✓ | Mật khẩu (tối thiểu 6 ký tự) |

### 1.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "firstName": "string", 
      "lastName": "string",
      "phone": "string",
      "role": "ADMIN|CASHIER",
      "isActive": true,
      "createdAt": "2025-01-20T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "jwt_token",
      "expiresIn": 900
    }
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

**Error Response (400/401):**
```json
{
  "success": false,
  "message": "Email hoặc mật khẩu không chính xác",
  "error": "INVALID_CREDENTIALS",
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 2. Làm mới access token

### 2.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/auth/refresh` |
| Request Method | POST |
| Request Header | Content-Type: application/json |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "refreshToken": "string"
}
```

### 2.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| refreshToken | Chuỗi ký tự | - | ✓ | Refresh token được cấp khi đăng nhập |

### 2.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Làm mới token thành công",
  "data": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 900
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 3. Lấy thông tin người dùng hiện tại

### 3.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/auth/me` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token} |
| Body data | Không có |

### 3.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin người dùng thành công",
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "role": "ADMIN|CASHIER",
    "isActive": true,
    "lastLoginAt": "2025-01-20T10:30:00.000Z",
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 4. Cập nhật thông tin người dùng

### 4.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/auth/profile` |
| Request Method | PUT |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token} |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "firstName": "string",
  "lastName": "string", 
  "phone": "string",
  "email": "string"
}
```

### 4.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| firstName | Chuỗi ký tự | 50 | | Họ |
| lastName | Chuỗi ký tự | 50 | | Tên |
| phone | Chuỗi ký tự | 15 | | Số điện thoại (định dạng VN: 0xxxxxxxxx) |
| email | Chuỗi ký tự | 255 | | Email (phải là email hợp lệ) |

## 5. Đổi mật khẩu

### 5.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/auth/password` |
| Request Method | PUT |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token} |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

### 5.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| currentPassword | Chuỗi ký tự | 72 | ✓ | Mật khẩu hiện tại |
| newPassword | Chuỗi ký tự | 72 | ✓ | Mật khẩu mới (tối thiểu 6 ký tự) |
| confirmPassword | Chuỗi ký tự | 72 | ✓ | Xác nhận mật khẩu mới (phải trùng với newPassword) |

## 6. Đăng xuất

### 6.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/auth/logout` |
| Request Method | POST |
| Request Header | Authorization: Bearer {access_token} |
| Body data | Không có |

### 6.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Đăng xuất thành công",
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```