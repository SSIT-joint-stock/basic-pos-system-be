import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PermissionService } from 'app/permissions/permission.service';
import { ImportProductService } from './import-product.service';
import { ProductTemplateProvider } from './product.template';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { GenerateProductSkuUseCase } from './use-case/generate-sku.usecase';
import { GenerateVariantSkuUseCase } from '../variant/use-case/genereate-sku-variant.usecase';

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
    ImportProductService,
    PermissionService,
    GenerateProductSkuUseCase,
    ProductTemplateProvider,
    GenerateVariantSkuUseCase,
    {
      provide: ExcelTemplateService,
      useFactory: (product: ProductTemplateProvider) => {
        // Không token: tự xây mảng providers và truyền vào service
        return new ExcelTemplateService([product]);
      },
      inject: [ProductTemplateProvider],
    },
  ],
})
export class ProductModule {}
