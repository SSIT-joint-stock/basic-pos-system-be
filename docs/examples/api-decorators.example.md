# API Response Decorators - Usage Examples

This document provides comprehensive examples of using API response decorators in NestJS controllers.

## Setup

First, import the decorators:

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiSuccess,
  ApiResponse,
  ApiError,
  RawResponse,
} from 'common/decorators/api-response.decorator';
```

## Basic Usage Examples

### 1. @ApiSuccess - Basic Success Response

**Controller Code:**
```typescript
@Controller('users')
export class UsersController {
  @Post()
  @ApiSuccess('User created successfully')
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return user;
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "v1",
    "requestId": "req-123456"
  }
}
```

### 2. @ApiSuccess - With Advanced Options

**Controller Code:**
```typescript
@Controller('products')
export class ProductsController {
  @Get()
  @ApiSuccess('Products retrieved successfully', {
    metadata: { total: 100, page: 1, limit: 10 },
    statusCode: 200,
    includeRequestId: true,
  })
  async findAll() {
    const products = await this.productsService.findAll();
    return products;
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    { "id": 1, "name": "Product A" },
    { "id": 2, "name": "Product B" }
  ],
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "v1",
    "requestId": "req-123456"
  },
  "total": 100,
  "page": 1,
  "limit": 10
}
```

### 3. @ApiResponse - Custom Status Code

**Controller Code:**
```typescript
@Controller('resources')
export class ResourcesController {
  @Post()
  @ApiResponse(201, 'Resource created successfully')
  async create(@Body() createResourceDto: CreateResourceDto) {
    const resource = await this.resourcesService.create(createResourceDto);
    return resource;
  }
}
```

**Response (HTTP 201):**
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": {
    "id": 1,
    "name": "New Resource",
    "type": "example"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "v1"
  }
}
```

### 4. @ApiError - Error Response

**Controller Code:**
```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  @ApiError('Invalid credentials provided', 401)
  async login(@Body() loginDto: LoginDto) {
    // Simulate authentication failure
    if (!await this.authService.validateCredentials(loginDto)) {
      throw new Error('Invalid credentials');
    }
    return { token: 'jwt-token-here' };
  }
}
```

**Response (HTTP 401):**
```json
{
  "success": false,
  "message": "Invalid credentials provided",
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "v1"
  }
}
```

### 5. @RawResponse - Bypass Wrapping

**Controller Code:**
```typescript
@Controller('files')
export class FilesController {
  @Get('download/:filename')
  @RawResponse()
  async downloadFile(@Param('filename') filename: string) {
    return this.filesService.getFileStream(filename);
  }
}
```

**Response:**
```json
// Raw file stream - no ApiResponse wrapper
// Content-Type: application/octet-stream
// Content-Disposition: attachment; filename="example.pdf"
```

## Advanced Examples

### 6. Response Transformation

**Controller Code:**
```typescript
@Controller('analytics')
export class AnalyticsController {
  @Get('report')
  @ApiSuccess('Analytics report generated', {
    transform: (response) => ({
      ...response,
      reportId: `report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }),
  })
  async getReport() {
    const rawData = await this.analyticsService.generateReport();
    return rawData;
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Analytics report generated",
  "data": { /* analytics data */ },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "v1"
  },
  "reportId": "report_1705312200000",
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "expiresAt": "2024-01-16T10:30:00.000Z"
}
```

### 7. Custom Headers

**Controller Code:**
```typescript
@Controller('api')
export class ApiController {
  @Get('cached-data')
  @ApiSuccess('Data retrieved from cache', {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'X-Data-Source': 'cache',
      'ETag': '"cached-version-123"'
    },
  })
  async getCachedData() {
    return this.cacheService.getData();
  }
}
```

**Response Headers:**
```
HTTP/1.1 200 OK
Cache-Control: public, max-age=300
X-Data-Source: cache
ETag: "cached-version-123"
Content-Type: application/json

{
  "success": true,
  "message": "Data retrieved from cache",
  "data": { /* cached data */ }
}
```

### 8. File Upload with Progress

**Controller Code:**
```typescript
@Controller('uploads')
export class UploadsController {
  @Post('file')
  @ApiSuccess('File uploaded successfully', {
    headers: {
      'X-Upload-Id': 'upload_123',
      'X-File-Size': '1024000'
    },
    metadata: {
      uploadId: 'upload_123',
      fileName: 'uploaded_file.pdf',
      fileSize: 1024000
    }
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const result = await this.filesService.processUpload(file);
    return result;
  }
}
```

## Complete Controller Example

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiSuccess, ApiResponse, ApiError, RawResponse } from 'common/decorators';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // GET /products
  @Get()
  @ApiSuccess('Products retrieved successfully', {
    metadata: { total: 100, page: 1 }
  })
  async findAll() {
    return this.productsService.findAll();
  }

  // GET /products/:id
  @Get(':id')
  @ApiSuccess('Product found')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  // POST /products
  @Post()
  @ApiResponse(201, 'Product created successfully')
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // PUT /products/:id
  @Put(':id')
  @ApiSuccess('Product updated successfully')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  // DELETE /products/:id
  @Delete(':id')
  @ApiResponse(204, 'Product deleted successfully')
  async remove(@Param('id') id: string) {
    await this.productsService.remove(+id);
    return {}; // 204 No Content
  }

  // GET /products/export
  @Get('export')
  @RawResponse()
  async exportProducts() {
    return this.productsService.exportToCsv();
  }
}
```

## Priority Order

When multiple decorators are applied to the same method, they are processed in this order:

1. `@RawResponse()` - Highest priority, bypasses all wrapping
2. `@ApiError()` - Creates error response
3. `@ApiResponse()` - Creates custom response
4. `@ApiSuccess()` - Creates success response
5. Default behavior - Standard `ApiResponse.success()` wrapping

## Best Practices

### 1. Use Descriptive Messages
```typescript
// ✅ Good
@ApiSuccess('User profile updated successfully')

// ❌ Avoid
@ApiSuccess('Success')
```

### 2. Appropriate HTTP Status Codes
```typescript
// ✅ Good
@Post()
@ApiResponse(201, 'Resource created')

@Get()
@ApiSuccess('Data retrieved') // 200 is default

@Delete()
@ApiResponse(204, 'Resource deleted')
```

### 3. Use RawResponse for Files
```typescript
// ✅ Good for file downloads
@Get('download')
@RawResponse()
async downloadFile() {
  return this.filesService.getFileStream();
}
```

### 4. Include Metadata for Complex Responses
```typescript
@ApiSuccess('Paginated results', {
  metadata: {
    total: 1000,
    page: 1,
    limit: 20,
    hasNext: true,
    hasPrev: false
  }
})
```

### 5. Custom Headers for Caching
```typescript
@ApiSuccess('Cached data retrieved', {
  headers: {
    'Cache-Control': 'public, max-age=300',
    'ETag': '"version-123"'
  }
})
```

## Error Handling

Decorators work seamlessly with NestJS exception handling:

```typescript
@Controller('users')
export class UsersController {
  @Get(':id')
  @ApiError('User not found', 404)
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
```

## Migration from Manual ApiResponse

### Before (Manual)
```typescript
@Post('users')
async create(@Body() data: CreateUserDto) {
  const user = await this.usersService.create(data);
  return ApiResponse.success(user, 'User created successfully');
}
```

### After (Decorator)
```typescript
@Post('users')
@ApiSuccess('User created successfully')
async create(@Body() data: CreateUserDto) {
  return await this.usersService.create(data);
}
```

This approach:
- ✅ Reduces boilerplate code
- ✅ Makes controllers more readable
- ✅ Centralizes response formatting
- ✅ Maintains consistency across the API
- ✅ Supports advanced customization options

## Integration

These decorators automatically integrate with:
- `ResponseInterceptor` for automatic processing
- Request ID tracking
- Custom headers and status codes
- Response transformation
- Error handling middleware

No additional configuration required!
