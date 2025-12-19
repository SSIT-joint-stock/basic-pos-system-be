import { Injectable } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { GenerateCodeSupplier } from './use-case/generate-supplier-code.usecase';

@Injectable()
export class ImportSupplierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codeUseCase: GenerateCodeSupplier,
  ) {}
}
