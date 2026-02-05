import { Module } from '@nestjs/common';
import { PermissionService } from 'app/permissions/permission.service';
import { StockMovementModule } from '../stock-movement/stock-movement.module';
import { GenerateVariantSkuUseCase } from '../variant/use-case/genereate-sku-variant.usecase';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { GenerateProductSkuUseCase } from './use-case/generate-sku.usecase';

@Module({
  controllers: [ProductController],
  imports: [StockMovementModule],
  providers: [
    ProductService,
    PermissionService,
    GenerateProductSkuUseCase,
    GenerateVariantSkuUseCase,
  ],
})
export class ProductModule {}
