# Hướng dẫn sử dụng hệ thống Permission

## Tổng quan

Hệ thống Permission được thiết kế để quản lý quyền truy cập dựa trên role của user trong từng store cụ thể. Hệ thống hỗ trợ kiểm tra quyền chi tiết theo resource và action, với cú pháp `resource:action`.

## Cấu trúc Permission

### 1. Permission Format

Mỗi permission có định dạng: `resource:action`

**Resources hỗ trợ:**

- `store` - Quản lý cửa hàng
- `member` - Quản lý thành viên
- `product` - Quản lý sản phẩm
- `category` - Quản lý danh mục
- `order` - Quản lý đơn hàng
- `customer` - Quản lý khách hàng
- `inventory` - Quản lý kho
- `tags` - Quản lý thẻ
- `stockMovement` - Quản lý xuất nhập kho
- `all` - Tất cả resources

**Actions hỗ trợ:**

- `create` - Tạo mới
- `read` - Đọc/Xem
- `update` - Cập nhật
- `delete` - Xóa
- `all` - Tất cả actions

### 2. Ví dụ Permissions

```typescript
'product:read'; // Chỉ đọc sản phẩm
'product:all'; // Toàn quyền với sản phẩm
'all:read'; // Đọc tất cả resources
'all:all'; // Toàn quyền hệ thống
```

## Role-based Permissions

### OWNER (Chủ cửa hàng)

- Permission: `all:all`
- Có toàn quyền trên cửa hàng

### MEMBER (Nhân viên)

Permissions mặc định:

```typescript
STORE_READ,           // Xem thông tin cửa hàng
MEMBER_READ,          // Xem danh sách thành viên
PRODUCT_READ,         // Xem sản phẩm
PRODUCT_UPDATE,       // Cập nhật sản phẩm
ORDER_CREATE,         // Tạo đơn hàng
ORDER_READ,           // Xem đơn hàng
ORDER_UPDATE,         // Cập nhật đơn hàng
CUSTOMER_READ,        // Xem khách hàng
CUSTOMER_CREATE,      // Tạo khách hàng
CUSTOMER_UPDATE,      // Cập nhật khách hàng
```

## Sử dụng trong Controller

### 1. Cách cơ bản

```typescript
import {
  Permission,
  PERMISSIONS,
} from 'app/common/decorators/permission.decorator';

@Controller('stores/:storeId/products')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductController {
  @Get()
  @Permission([PERMISSIONS.PRODUCT_READ]) // Cần quyền đọc sản phẩm
  findAll(@Param('storeId') storeId: string) {
    // Logic xử lý
  }

  @Post()
  @Permission([PERMISSIONS.PRODUCT_CREATE]) // Cần quyền tạo sản phẩm
  create(@Body() dto: CreateProductDto) {
    // Logic xử lý
  }

  @Delete(':id')
  @Permission([PERMISSIONS.PRODUCT_DELETE]) // Cần quyền xóa sản phẩm
  remove(@Param('id') id: string) {
    // Logic xử lý
  }
}
```

### 2. Multiple Permissions với AND Logic

```typescript
@Post()
@Permission([
  PERMISSIONS.PRODUCT_CREATE,
  PERMISSIONS.INVENTORY_UPDATE
]) // User PHẢI có CẢ 2 quyền này
create(@Body() dto: CreateProductDto) {
  // Chỉ thực thi khi user có cả quyền tạo sản phẩm VÀ cập nhật kho
}
```

### 3. Multiple Permissions với OR Logic

```typescript
@Get()
@Permission([
  PERMISSIONS.PRODUCT_READ,
  PERMISSIONS.PRODUCT_ALL
], 'OR') // User chỉ cần có 1 trong 2 quyền
findAll() {
  // Thực thi khi user có quyền đọc HOẶC toàn quyền sản phẩm
}
```

### 4. Sử dụng Alias Decorators

```typescript
// Alias cho dễ đọc
@RequirePermission([PERMISSIONS.PRODUCT_READ])
@RequirePermissions([PERMISSIONS.PRODUCT_READ, PERMISSIONS.STORE_READ])

// Cho OR logic
@AnyPermission([PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_ALL])
```

## Lấy thông tin User với Permissions

### 1. Trong Controller

```typescript
@Get()
@Permission([PERMISSIONS.PRODUCT_READ])
findAll(
  @Param('storeId') storeId: string,
  @UserWithPermissions() user: IUserWithPermissions
) {
  console.log(user.storeRole);      // 'OWNER' | 'MEMBER'
  console.log(user.permissions);    // Danh sách permissions
  console.log(user.storeId);        // ID của store hiện tại

  return this.productService.findAll(storeId, user);
}
```

### 2. Trong Service

```typescript
@Injectable()
export class ProductService {
  constructor(private permissionService: PermissionService) {}

  async findAll(storeId: string, user: IUserWithPermissions) {
    // Kiểm tra permission bổ sung nếu cần
    const hasDeletePermission = this.permissionService.hasPermission(
      user.permissions,
      PERMISSIONS.PRODUCT_DELETE,
    );

    if (hasDeletePermission) {
      // Hiển thị button delete
    }
  }
}
```

## Advanced Usage

### 1. Kiểm tra Permission trong Service

```typescript
@Injectable()
export class ProductService {
  constructor(private permissionService: PermissionService) {}

  async updateProduct(storeId: string, productId: string, user: IUSER) {
    // Lấy permissions của user
    const userPermissions = await this.permissionService.getUserPermissions(
      storeId,
      user.id,
    );

    // Kiểm tra quyền cụ thể
    const canUpdate = this.permissionService.hasPermission(
      userPermissions,
      PERMISSIONS.PRODUCT_UPDATE,
    );

    if (!canUpdate) {
      throw new ForbiddenException('Không có quyền cập nhật sản phẩm');
    }

    // Logic cập nhật...
  }
}
```

### 2. Kiểm tra Multiple Permissions

```typescript
// Kiểm tra có TẤT CẢ permissions (AND)
const hasAllPerms = this.permissionService.hasAllPermissions(userPermissions, [
  PERMISSIONS.PRODUCT_READ,
  PERMISSIONS.PRODUCT_UPDATE,
]);

// Kiểm tra có ÍT NHẤT 1 permission (OR)
const hasAnyPerm = this.permissionService.hasAnyPermissions(userPermissions, [
  PERMISSIONS.PRODUCT_READ,
  PERMISSIONS.PRODUCT_ALL,
]);
```

### 3. Lấy User với đầy đủ thông tin

```typescript
const userWithPerms = await this.permissionService.getUserWithPermissions(
  storeId,
  user,
);

// userWithPerms bao gồm:
// - Tất cả thông tin user gốc
// - storeId: ID store hiện tại
// - storeRole: Role trong store ('OWNER' | 'MEMBER')
// - permissions: Danh sách permissions
```

## Wildcard Permissions

Hệ thống hỗ trợ wildcard permissions để dễ dàng quản lý:

### 1. Resource-level Wildcard

```typescript
'product:all'; // Toàn quyền với sản phẩm (create, read, update, delete)
```

### 2. Action-level Wildcard

```typescript
'all:read'; // Quyền đọc trên tất cả resources
```

### 3. Super Admin

```typescript
'all:all'; // Toàn quyền hệ thống
```

## Error Handling

### 1. Lỗi xác thực

```typescript
// User chưa đăng nhập
ForbiddenError('User not authenticated!');

// Thiếu storeId
ValidationError('StoreId is required for permission check');

// Không có quyền
ForbiddenError(
  'Access Denied! You do not have permission to perform this action. Role: MEMBER',
);
```

### 2. Best Practices

```typescript
@Controller('stores/:storeId/products')
export class ProductController {
  @Get()
  @Permission([PERMISSIONS.PRODUCT_READ])
  async findAll(
    @Param('storeId') storeId: string,
    @UserWithPermissions() user: IUserWithPermissions,
  ) {
    try {
      return await this.productService.findAll(storeId, user);
    } catch (error) {
      // Handle specific permission errors
      if (error instanceof ForbiddenError) {
        // Log và trả về response phù hợp
      }
      throw error;
    }
  }
}
```

## Migration và Mở rộng

### 1. Thêm Permission mới

```typescript
// Trong permission.type.ts
export const PERMISSIONS = {
  // Existing permissions...

  // New category permissions
  CATEGORY_CREATE: 'category:create' as Permission,
  CATEGORY_READ: 'category:read' as Permission,
  CATEGORY_UPDATE: 'category:update' as Permission,
  CATEGORY_DELETE: 'category:delete' as Permission,
  CATEGORY_ALL: 'category:all' as Permission,
} as const;
```

### 2. Cập nhật Role Permissions

```typescript
// Trong permission.service.ts
private readonly rolePermissions: Record<StoreMemberRole | 'OWNER', Permission[]> = {
  OWNER: [PERMISSIONS.ALL],
  MEMBER: [
    // Existing permissions...
    PERMISSIONS.CATEGORY_READ,    // Thêm permission mới
    PERMISSIONS.CATEGORY_CREATE,
  ],
};
```

### 3. Áp dụng trong Controller

```typescript
@Controller('stores/:storeId/categories')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CategoryController {
  @Get()
  @Permission([PERMISSIONS.CATEGORY_READ])
  findAll() {
    // Implementation
  }

  @Post()
  @Permission([PERMISSIONS.CATEGORY_CREATE])
  create() {
    // Implementation
  }
}
```

## Lưu ý quan trọng

1. **StoreId bắt buộc**: Mọi request cần có storeId trong params, body hoặc query
2. **Guard Order**: Phải đặt `JwtAuthGuard` trước `PermissionGuard`
3. **Permission Logic**: Mặc định là 'AND', sử dụng 'OR' khi cần
4. **Wildcard**: Sử dụng cẩn thận, có thể tạo security hole
5. **Performance**: Cache permissions khi có thể để tối ưu performance

## Troubleshooting

### Lỗi thường gặp:

1. **"StoreId is required"**: Thiếu storeId trong request
2. **"User not authenticated"**: Chưa setup JwtAuthGuard
3. **"Access Denied"**: User không có permission cần thiết
4. **Decorator không hoạt động**: Kiểm tra import và setup PermissionGuard

### Debug:

```typescript
// Log permissions để debug
console.log('User permissions:', user.permissions);
console.log('Required permissions:', requiredPermissions);
console.log('User role:', user.storeRole);
```
