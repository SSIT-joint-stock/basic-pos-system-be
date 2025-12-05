import { Module } from '@nestjs/common';
import { UnitConversionService } from './unit-conversion.service';
import { UnitConversionController } from './unit-conversion.controller';

@Module({
  controllers: [UnitConversionController],
  providers: [UnitConversionService],
})
export class UnitConversionModule {}
