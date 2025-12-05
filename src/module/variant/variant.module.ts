import { Module } from '@nestjs/common';
import { VariantService } from './variant.service';
import { VariantController } from './variant.controller';
import { GenerateVariantSkuUseCase } from './use-case/genereate-sku-variant.usecase';

@Module({
  controllers: [VariantController],
  providers: [VariantService, GenerateVariantSkuUseCase],
})
export class VariantModule {}
