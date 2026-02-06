import { Module } from '@nestjs/common';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { VariantExcelService } from 'app/module/variant/inventory-excel.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { StockMovementModule } from '../stock-movement/stock-movement.module';
import { UnitConversionService } from './unit-conversion/unit-conversion.service';
import { ApplyStockUseCase } from './use-case/apply-stock.usecase';
import { GenerateVariantSkuUseCase } from './use-case/genereate-sku-variant.usecase';
import { VariantController } from './variant.controller';
import { VariantService } from './variant.service';

@Module({
  controllers: [VariantController],
  imports: [StockMovementModule],
  providers: [
    VariantService,
    GenerateVariantSkuUseCase,
    UnitConversionService,
    ApplyStockUseCase,
    VariantExcelService,
    ExcelTemplateService,
    FormatStatus,
    Format,
  ],
})
export class VariantModule {}
