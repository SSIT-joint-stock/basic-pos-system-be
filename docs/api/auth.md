# Auth API Routes

# Ghi chú về Token

## ACCESS TOKEN

### - trả về trong response, client lưu ở Authorization Header dưới dạng: Authorization: Bearer "access_token"

### - Thời hạn: 15 phút

### - Dùng để gọi các API cần bảo mật hay cần đăng nhập để truy cập

## REFRESH TOKEN

### - được trả về và lưu trong HTTP-only Cookie (server set qua Set-Cookie).

### - Thời hạn: 7 ngày

### - Không nên lưu trong localStorage/sessionStorage

### - Dùng để lấy lại access token mới khi access token hết hạn

## 1. Đăng ký tạo tài khoản

### 1.1 Mô tả

| **Thuộc tính** | **Giá trị**                    |
| -------------- | ------------------------------ |
| Request URL    | `/api/auth/register`           |
| Request Method | POST                           |
| Request Header | Content-Type: application/json |
| Body data      | JSON schema bên dưới           |

**JSON Schema:**

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

### 1.2 Dữ liệu đầu vào

| **Tên trường**  | **Kiểu** | **Bắt buộc** | **Ghi chú**              |
| --------------- | -------- | ------------ | ------------------------ |
| email           | string   | ✓            | Email hợp lệ, duy nhất   |
| username        | string   | ✓            | Tên người dùng, duy nhất |
| password        | string   | ✓            | Mật khẩu (>= 6 ký tự)    |
| confirmPassword | string   | ✓            | Phải đúng với password   |

### 1.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T04:32:19.574Z",
    "version": "v1"
  },
  "message": "Account registered successfully. Please check your email for verification."
}
```

**Error Response:**
**409 Conflict – Email hoặc Username đã tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "An account with this email already exists"
  }
}
{
  "success": false,
  "error": {
    "code": "USERNAME_ALREADY_EXISTS",
    "message": "Username is already taken"
  }
}
```

# 2. Đăng nhập

### 2.1 Mô tả

| **Thuộc tính** | **Giá trị**                    |
| -------------- | ------------------------------ |
| Request URL    | `/api/auth/login`              |
| Request Method | POST                           |
| Request Header | Content-Type: application/json |
| Body data      | JSON schema bên dưới           |

**JSON Schema:**

```json
{
  "usernameOrEmail": "string",
  "password": "string"
}
```

### 2.2 Dữ liệu đầu vào

| **Tên trường**  | **Kiểu** | **Bắt buộc** | **Ghi chú**                     |
| --------------- | -------- | ------------ | ------------------------------- |
| usernameOrEmail | string   | ✓            | có thể nhập username hoặc email |
| password        | string   | ✓            | Mật khẩu (>= 6 ký tự)           |

### 2.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T05:54:42.650Z",
    "version": "v1"
  },
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc0ODJlNTkyLWRmNjctNGJmMC04YTkwLTQ0NDg2MTgyZDU0MCIsImVtYWlsIjoidGh0aGFuaC5kaGttMTdhMWhuQHN2LnVuZXRpLmVkdS52biIsInJvbGUiOiJVU0VSIiwic3RzIjoiQUNUSVZFIiwidXNlcm5hbWUiOiJ0aGFuaCBuaGFuIHZpZW4gMzYiLCJpYXQiOjE3NTczOTcyODIsImV4cCI6MTc1NzM5ODE4Mn0.vifFkCsp1Doa0Gi82_VUFCZUZtW6RZVFXkjqAJgqM",
    "user": {
      "id": "7482e592-df67-4bf0-8a90-44486182d540",
      "email": "email@gmail.com",
      "username": "username",
      "role": "USER"
    }
  },
  "message": "Login successful"
}
```

**Error Response:**
**401 Unauthorized – Sai thông tin đăng nhập**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Invalid email/username or password not found",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T06:12:35.246Z",
    "version": "v1"
  }
}
```

**403 Forbidden – Tài khoản chưa xác thực email**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please verify your email before logging in",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T06:13:07.640Z",
    "version": "v1"
  }
}
```

# 3. Xác thực Email (Verify Email)

### 3.1 Mô tả

| **Thuộc tính** | **Giá trị**                    |
| -------------- | ------------------------------ |
| Request URL    | `/api/auth/verify-email`       |
| Request Method | POST                           |
| Request Header | Content-Type: application/json |
| Body data      | JSON schema bên dưới           |

**JSON Schema:**

```json
{
  "email": "string",
  "code": "string"
}
```

### 3.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu** | **Bắt buộc** | **Ghi chú** |
| -------------- | -------- | ------------ | ----------- |
| email          | string   | ✓            | null        |
| code           | string   | ✓            | null        |

### 3.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T06:19:20.424Z",
    "version": "v1"
  },
  "message": "Email verified successfully"
}
```

**Error Response:**
**422 Unprocessable Entity – Sai mã xác thực**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid verification code",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T06:15:44.245Z",
    "version": "v1"
  }
}
```

**422 Unprocessable Entity – Mã code hết hạn**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Verification code has expired",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T06:18:20.846Z",
    "version": "v1"
  }
}
```

**404 Not Found – Tài khoản không tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found not found",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T06:17:13.980Z",
    "version": "v1"
  }
}
```

# 4. Gửi lại email xác thực (Re-verify Email)

### 4.1 Mô tả

| **Thuộc tính** | **Giá trị**                    |
| -------------- | ------------------------------ |
| Request URL    | `/api/auth/reverify-email`     |
| Request Method | POST                           |
| Request Header | Content-Type: application/json |
| Body data      | JSON schema bên dưới           |

**JSON Schema:**

```json
{
  "email": "string"
}
```

### 4.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu** | **Bắt buộc** | **Ghi chú** |
| -------------- | -------- | ------------ | ----------- |
| email          | string   | ✓            | null        |

### 4.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T06:38:45.555Z",
    "version": "v1"
  },
  "message": "Verification email sent successfully"
}
```

**Error Response:**
**422 Unprocessable Entity – User đã xác thực email**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is already verified",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T06:33:12.972Z",
    "version": "v1"
  }
}
```

**404 Not Found – Tài khoản không tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found not found",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T06:34:02.617Z",
    "version": "v1"
  }
}
```

# 5. QUên mật khẩu (Forgot Password)

### 5.1 Mô tả

| **Thuộc tính** | **Giá trị**                    |
| -------------- | ------------------------------ |
| Request URL    | `/api/auth/forgot-password`    |
| Request Method | POST                           |
| Request Header | Content-Type: application/json |
| Body data      | JSON schema bên dưới           |

**JSON Schema:**

```json
{
  "email": "string"
}
```

### 5.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu** | **Bắt buộc** | **Ghi chú** |
| -------------- | -------- | ------------ | ----------- |
| email          | string   | ✓            | null        |

### 5.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T07:13:03.731Z",
    "version": "v1"
  },
  "message": "Password reset email sent successfully"
}
```

**Error Response:**

**404 Not Found – Tài khoản không tồn tại**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found not found",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T07:13:46.278Z",
    "version": "v1"
  }
}
```

# 6 Thay đổi mật khẩu

### 6.1 Mô tả

| **Thuộc tính** | **Giá trị**                    |
| -------------- | ------------------------------ |
| Request URL    | `/api/auth/reset-password`     |
| Request Method | POST                           |
| Request Header | Content-Type: application/json |
| Body data      | JSON schema bên dưới           |

**JSON Schema:**

```json
{
  "resetToken": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

### 6.2 Dữ liệu đầu vào

| **Tên trường**  | **Kiểu** | **Bắt buộc** | **Ghi chú**  |
| --------------- | -------- | ------------ | ------------ |
| resetToken      | string   | ✓            | null         |
| password        | string   | ✓            | >= 6         |
| confirmPassword | string   | ✓            | === password |

### 6.3 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T07:13:03.731Z",
    "version": "v1"
  },
  "message": "Password reset successfully"
}
```

**Error Response:**

**400 Bad Request – Mật khẩu và xác nhận mật khẩu kh đúng**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": {
      "validationErrors": ["Confirm password does not match"]
    }
  },
  "meta": {
    "timestamp": "2025-09-09T07:17:45.733Z",
    "version": "v1"
  }
}
```

**422 Bad Request – Mã kh đúng**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid verification code",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T07:19:02.410Z",
    "version": "v1"
  }
}
```

**422 Bad Request – Mã code hết hạn**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Verification code has expired",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-09T07:19:02.410Z",
    "version": "v1"
  }
}
```

# 7 Đăng xuất

### 7.1 Mô tả

| **Thuộc tính** | **Giá trị**                    |
| -------------- | ------------------------------ |
| Request URL    | `/api/auth/logout`             |
| Request Method | POST                           |
| Request Header | Content-Type: application/json |
| Body data      | JSON schema bên dưới           |

### 7.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T07:13:03.731Z",
    "version": "v1"
  },
  "message": "Logged out successfully"
}
```

**Error Response:**

**403 Forbidden – Chưa đăng nhập hoặc chuă có access_token ở authoziation header**

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

# 8 Lấy thông tin đăng nhập

### 8.1 Mô tả

| **Thuộc tính** | **Giá trị**                    |
| -------------- | ------------------------------ |
| Request URL    | `/api/auth/profile`            |
| Request Method | POST                           |
| Request Header | Content-Type: application/json |
| Body data      | JSON schema bên dưới           |

### 8.2 Dữ liệu đầu ra

**Success Response (200):**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-09T07:26:18.023Z",
    "version": "v1"
  },
  "data": {
    "id": "14a04419-ca46-4244-b42a-ca3d94ef9c48",
    "email": "email@gmail.com",
    "role": "USER",
    "status": "ACTIVE",
    "username": "thanhdz",
    "iat": 1757402764,
    "exp": 1757403664
  },
  "message": "Profile fetched successfully"
}
```

**Error Response:**

**403 Forbidden – Chưa đăng nhập hoặc chuă có access_token ở authoziation header**

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

# 9 Oauth

## 9.1 OAuth Init

### 9.1.1 Mô tả

| **Thuộc tính** | **Giá trị**                    |
| -------------- | ------------------------------ |
| Request URL    | `/api/v1/auth/init`            |
| Request Method | GET                            |
| Request Header | Content-Type: application/json |
| Body data      | Không có                       |

### 9.1.2 Dữ liệu đầu ra

**Success Respone**

Server sẽ redirect client sang trang đăng nhập của OAuth Provider(Hiện tại chỉ hỗ trợ google )

**Error Response:**

**400 Bad Request – chỉ google oauth được hỗ trợ**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Only Google OAuth is supported",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-12T08:45:33.195Z",
    "version": "v1"
  }
}
```

## 9.2 OAuth Callback

### ℹ️ Note

> Hiện tại chưa có URL callback của frontend, nên URL trả về đang là callback của backend.

### 9.2.1 Mô tả

Sau khi người dùng đăng nhập thành công, OAuth Provider sẽ redirect về endpoint callback kèm theo code và state trong query params.
Server sẽ dùng code để lấy thông tin người dùng, sau đó trả về access_token + thông tin user.

| **Thuộc tính** | **Giá trị**                    |
| -------------- | ------------------------------ |
| Request URL    | `/api/v1/auth/callback`        |
| Request Method | GET                            |
| Request Header | Content-Type: application/json |
| Body data      | Không có                       |

### 9.2.2 Dữ liệu nhận vào

**code và state được trả trong callback url sau khi oauth trả về callback**

| **Tên trường** | **Kiểu** | **Bắt buộc** | **Ghi chú**                             |
| -------------- | -------- | ------------ | --------------------------------------- |
| code           | string   | ✓            | Authorization code trả về từ provider   |
| state          | string   | ✓            | Giá trị chống CSRF, phải trùng với init |

### 9.2.3 Dữ liệu đầu ra

**Success Respone**

```json
{
  "success": true,
  "meta": {
    "timestamp": "2025-09-12T08:59:27.490Z",
    "version": "v1"
  },
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.",
    "user": {
      "id": "5a99142a-14dc-4cc0-a275-fc96f8690000",
      "email": "providminh24092004@gmail.com",
      "username": "providminh24092004",
      "role": "USER"
    }
  }
}
```

**Error Response:**

**Missing state**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Missing state",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-12T09:06:25.412Z",
    "version": "v1"
  }
}
```

**Missing code**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Missing state",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-09-12T09:06:25.412Z",
    "version": "v1"
  }
}
```
