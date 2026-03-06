import { Module } from '@nestjs/common';
import { GenerateBundleSkuUseCase } from 'app/module/bundle/use-case/generate-code.usecase';
import { BundleController } from './bundle.controller';
import { BundleService } from './bundle.service';

@Module({
  controllers: [BundleController],
  providers: [BundleService, GenerateBundleSkuUseCase],
})
export class BundleModule {}
