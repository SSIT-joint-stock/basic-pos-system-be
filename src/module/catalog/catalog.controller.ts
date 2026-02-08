import { Controller, Get, Query } from '@nestjs/common';
import { User } from 'app/common/decorators/user.decorator';
import { type IUser } from 'app/common/types/user.type';
import { CatalogService } from 'app/module/catalog/catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('scan')
  async scanBarcode(@User() user: IUser, @Query('barcode') barcode: string) {
    return this.catalogService.scanBarcode(user.storeId || '', barcode);
  }
}
