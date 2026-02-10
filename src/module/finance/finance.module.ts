import { Module } from '@nestjs/common';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';

// Controller
import { FinanceController } from './finance.controller';

// Service
import { FinanceService } from './finance.service';

// UseCases
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { CalculateCashBookUseCase } from './use-case/calculate-cash-book.usecase';
import { CancelTransactionUseCase } from './use-case/cancel-transaction.usecase';
import { CreatePaymentUseCase } from './use-case/create-payment.usecase';
import { CreateReceiptUseCase } from './use-case/create-receipt.usecase';
import { GenerateTransactionCodeUseCase } from './use-case/generate-transaction-code.usecase';
import { SyncCashBookUseCase } from './use-case/sync-cash-book.usecase';
import { UpdateTransactionUseCase } from './use-case/update-transaction.usecase';

@Module({
  imports: [],
  controllers: [FinanceController],
  providers: [
    // Core Services
    FinanceService,
    PrismaService,
    ExcelTemplateService,

    // UseCases - Business Logic
    GenerateTransactionCodeUseCase,
    CreateReceiptUseCase,
    CreatePaymentUseCase,
    UpdateTransactionUseCase,
    CancelTransactionUseCase,
    CalculateCashBookUseCase,
    SyncCashBookUseCase,
    FormatStatus,
    Format,
  ],
  exports: [
    FinanceService, // Export để các module khác có thể sử dụng (Orders, Purchase, Returns)
  ],
})
export class FinanceModule {}
