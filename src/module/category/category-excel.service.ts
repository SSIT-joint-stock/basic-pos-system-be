import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { ConflictError } from 'app/common/response';
import { PrismaService } from 'app/prisma/prisma.service';
import { ExcelTemplateService } from 'app/shared/excel-template/excel-template.service';
import { CATEGORY_EXCEL_TEMPLATE } from 'app/shared/excel-template/template/category';

@Injectable()
export class ImportCategoryService {
  private errMsg = {
    DUPLICATE_NAME: 'Tên danh mục đã tồn tại',
  };
  constructor(
    private readonly excelService: ExcelTemplateService,
    private readonly prisma: PrismaService,
  ) {}
  async downloadExampleCategory() {
    return this.excelService.generateTemplateExample(CATEGORY_EXCEL_TEMPLATE);
  }
  async getCategoryExcel(storeId: string) {
    await this.checkStore(storeId);
    const categories = await this.prisma.category.findMany({
      where: {
        store_id: storeId,
      },
    });
    const data = categories.map((c) => ({
      name: c.name,
      description: c.description ?? '',
      createdAt: c.createdAt,
    }));
    return this.excelService.exportData(CATEGORY_EXCEL_TEMPLATE, data);
  }
  async importCategoryExcel(storeId: string, file: Express.Multer.File) {
    await this.checkStore(storeId);
    const data = await this.excelService.importData(
      CATEGORY_EXCEL_TEMPLATE,
      file,
    );
    const existingCategories = await this.prisma.category.findMany({
      where: {
        store_id: storeId,
      },
    });
    const existingCategoryNames = existingCategories.map((c) => c.name);
    const duplicateNames = data.filter((d: Category) => {
      return existingCategoryNames.includes(d.name);
    });
    if (duplicateNames.length > 0) {
      throw new ConflictError(this.errMsg.DUPLICATE_NAME);
    }
    return this.prisma.category.createMany({
      data: data.map((d: Category) => ({
        store_id: storeId,
        name: d.name,
        description: d.description,
      })),
    });
  }
  private async checkStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: {
        id: storeId,
      },
    });
    if (!store) throw new Error('Store not found');
    return store;
  }
}
