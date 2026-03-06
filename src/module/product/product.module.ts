import { Module } from '@nestjs/common';
import { Format } from 'app/common/helpers/format';
import { ProductExcelService } from 'app/module/product/product-excel.service';
import { PermissionService } from 'app/permissions/permission.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { AssetsModule } from '../assets/assets.module';
import { StockMovementModule } from '../stock-movement/stock-movement.module';
import { GenerateVariantSkuUseCase } from '../variant/use-case/genereate-sku-variant.usecase';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { GenerateProductSkuUseCase } from './use-case/generate-sku.usecase';

@Module({
  controllers: [ProductController],
  imports: [StockMovementModule, AssetsModule],
  providers: [
    ProductService,
    PermissionService,
    GenerateProductSkuUseCase,
    GenerateVariantSkuUseCase,
    ProductExcelService,
    ExcelTemplateService,
    Format,
  ],
})
export class ProductModule {}
