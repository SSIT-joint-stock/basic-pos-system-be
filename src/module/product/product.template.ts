import { Injectable } from '@nestjs/common';
import { ExcelTemplateProvider } from 'app/shared/excel-template/excel-template.types';

@Injectable()
export class ProductTemplateProvider implements ExcelTemplateProvider {
  key = 'product' as const;

  sheetName() {
    return 'Products';
  }

  fileName(date = new Date()) {
    const d = date.toISOString().slice(0, 10); // yyyy-mm-dd
    return `example_products_${d}.xlsx`;
  }

  headers() {
    return [
      'name*',
      'sku*',
      'barcode',
      'price*',
      'cost',
      'description',
      'image_url',
      'product_status',
      'category*',
    ];
  }

  sample() {
    return [
      {
        'name*': 'Sample Product',
        'sku*': 'SKU001',
        barcode: '123456789',
        'price*': 10000,
        cost: 8000,
        description: 'This is a sample product',
        image_url: 'http://example.com/image.jpg',
        product_status: 'ACTIVE',
        'category*': 'Sample Category',
      },
    ];
  }
}
