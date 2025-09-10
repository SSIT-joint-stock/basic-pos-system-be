import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PermissionService } from 'app/permissions/permission.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, PermissionService],
})
export class ProductModule {}
