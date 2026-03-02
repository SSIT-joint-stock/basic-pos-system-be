import { Module } from '@nestjs/common';
import { BundleService } from './bundle.service';
import { BundleController } from './bundle.controller';

@Module({
  controllers: [BundleController],
  providers: [BundleService],
})
export class BundleModule {}
