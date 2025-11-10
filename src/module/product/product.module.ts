import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PermissionService } from 'app/permissions/permission.service';
import { GenerateProductSkuUseCase } from './use-case/generate-sku.usecase';

@Module({
  controllers: [ProductController],
  providers: [ProductService, PermissionService, GenerateProductSkuUseCase],
})
export class ProductModule {}
