import { Module } from '@nestjs/common';
import { StorePaymentService } from './store-payment.service';
import { StorePaymentController } from './store-payment.controller';
import { GenerateVietQRUseCase } from './use-case/generate-vietqr.usecase';

@Module({
  controllers: [StorePaymentController],
  providers: [StorePaymentService, GenerateVietQRUseCase],
})
export class StorePaymentModule {}
