import { ExcelTemplateConfig } from '../excel-template.types';
import { CategoryExcelSchema } from '../zod/import-categories.schema';
export interface CategoryDataExcel {
  name: string;
  description?: string | null;
  createdAt?: Date | null;
}
export const CATEGORY_EXAMPLE_DATA = [
  {
    name: 'Món ăn',
    description: 'Các món ăn chính và món mặn',
  },
  {
    name: 'Đồ uống',
    description: 'Nước giải khát, trà, cà phê',
  },
  {
    name: 'Đồ uống có cồn',
    description: 'Bia, rượu và thức uống có cồn',
  },
  {
    name: 'Tráng miệng',
    description: 'Bánh ngọt, chè, món tráng miệng',
  },
  {
    name: 'Thức ăn nhanh',
    description: 'Món ăn chế biến nhanh, tiện lợi',
  },
  {
    name: 'Combo',
    description: 'Các combo món ăn và đồ uống',
  },
  {
    name: 'Ăn vặt',
    description: 'Các món ăn nhẹ, ăn vặt',
  },
  {
    name: 'Cà phê',
    description: 'Các loại đồ uống từ cà phê',
  },
  {
    name: 'Trà',
    description: 'Trà nóng, trà sữa, trà trái cây',
  },
  {
    name: 'Khác',
    description: 'Các sản phẩm chưa phân loại',
  },
];

export const CATEGORY_EXCEL_TEMPLATE: ExcelTemplateConfig = {
  sheetName: 'Categories',
  fileName: `danh_muc.xlsx`,
  schema: CategoryExcelSchema,
  columns: [
    { header: 'Tên danh mục*', key: 'name', width: 40 },
    { header: 'Mô tả', key: 'description', width: 40 },
    { header: 'Ngày tạo', key: 'createdAt', width: 40 },
  ],
  exampleData: CATEGORY_EXAMPLE_DATA,
};
