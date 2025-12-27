import { Module } from '@nestjs/common';
import { StoreMemberController } from './store-member.controller';
import { StoreMemberService } from './store-member.service';
import { PrismaService } from 'app/prisma/prisma.service';
import { BcryptService } from 'app/common/helpers/bcrypt.util';
import { StoreMemberExcelService } from './store-member-excel.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';

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
