import { Injectable } from '@nestjs/common';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
import { ForbiddenError, NotFoundError } from 'app/common/response';
import { IUser } from 'app/common/types/user.type';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { STORE_MEMBER_EXCEL_TEMPLATE } from 'app/shared/excel-template/template/store-member';

@Injectable()
export class StoreMemberExcelService {
  constructor(
    private readonly excelService: ExcelTemplateService,
    private readonly prisma: PrismaService,
    private readonly format: Format,
    private readonly status: FormatStatus,
  ) {}

  async downloadExampleStoreMember() {
    return this.excelService.generateTemplateExample(
      STORE_MEMBER_EXCEL_TEMPLATE,
    );
  }

  async exportStoreMembers(storeId: string, user: IUser) {
    // Check user có thuộc store không

    const storeMember = await this.prisma.storeMember.findFirst({
      where: {
        storeId,
        userId: user.id,
      },
    });

    if (!storeMember) {
      throw new ForbiddenError(
        'Bạn không có quyền export thành viên của cửa hàng này',
      );
    }

    // Lấy danh sách member của store

    const members = await this.prisma.storeMember.findMany({
      where: {
        storeId,
      },
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!members.length) {
      throw new NotFoundError('Cửa hàng chưa có thành viên');
    }

    const data = members.map((member) => ({
      email: member.user?.email ?? '',
      username: member.user?.username ?? '',
      role: this.status.storeMemberRole(member.role),
      createdAt: this.format.formatDate(member.createdAt),
    }));

    return this.excelService.exportData(STORE_MEMBER_EXCEL_TEMPLATE, data);
  }
}
