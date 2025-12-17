import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PermissionService } from 'app/permissions/permission.service';
import { ImportProductService } from './import-product.service';
import { GenerateProductSkuUseCase } from './use-case/generate-sku.usecase';
import { GenerateVariantSkuUseCase } from '../variant/use-case/genereate-sku-variant.usecase';
import { StockMovementModule } from '../stock-movement/stock-movement.module';

@Module({
  controllers: [ProductController],
  imports: [StockMovementModule],
  providers: [
    ProductService,
    ImportProductService,
    PermissionService,
    GenerateProductSkuUseCase,
    GenerateVariantSkuUseCase,
  ],
})
export class ProductModule {}
