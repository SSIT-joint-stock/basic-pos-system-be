import { Injectable } from '@nestjs/common';
import { Format } from 'app/common/helpers/format';
import { FormatStatus } from 'app/common/helpers/status';
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
    await this.checkIsOwner(storeId, user.id);
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

    const data = members.map((member) => ({
      email: member.user?.email ?? '',
      username: member.user?.username ?? '',
      role: this.status.storeMemberRole(member.role),
      createdAt: this.format.formatDate(member.createdAt),
    }));

    return this.excelService.exportData(STORE_MEMBER_EXCEL_TEMPLATE, data);
  }
  private async checkIsOwner(
    storeId: string,
    ownerId: string,
  ): Promise<boolean> {
    const hasAccess = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        owner_id: ownerId,
      },
    });

    return !!hasAccess;
  }
}
