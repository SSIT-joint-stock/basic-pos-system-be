import { Module } from '@nestjs/common';
import { BcryptService } from 'app/common/helpers/bcrypt.util';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { StoreMemberExcelService } from './store-member-excel.service';
import { StoreMemberController } from './store-member.controller';
import { StoreMemberService } from './store-member.service';

@Module({
  controllers: [StoreMemberController],
  providers: [
    StoreMemberService,
    StoreMemberExcelService,
    PrismaService,
    BcryptService,
    ExcelTemplateService,
    Format,
    FormatStatus,
  ],
  exports: [StoreMemberService],
})
export class StoreMemberModule {}
