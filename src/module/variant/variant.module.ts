import { Module } from '@nestjs/common';
import { VariantService } from './variant.service';
import { VariantController } from './variant.controller';
import { GenerateVariantSkuUseCase } from './use-case/genereate-sku-variant.usecase';
import { StockMovementModule } from '../stock-movement/stock-movement.module';
import { UnitConversionService } from './unit-conversion/unit-conversion.service';

@Module({
  controllers: [VariantController],
  imports: [StockMovementModule],
  providers: [VariantService, GenerateVariantSkuUseCase, UnitConversionService],
})
export class VariantModule {}
