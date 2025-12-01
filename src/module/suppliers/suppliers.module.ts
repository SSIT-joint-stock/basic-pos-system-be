import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { GenerateCodeSupplier } from './use-case/generate-supplier-code.usecase';
import { ImportSupplierService } from './import-supplier.service';

@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService, ImportSupplierService, GenerateCodeSupplier],
})
export class SuppliersModule {}
