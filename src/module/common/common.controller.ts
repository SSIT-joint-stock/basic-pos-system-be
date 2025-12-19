import { Controller, Get, Param } from '@nestjs/common';
import { CommonService } from './common.service';
import { bank } from 'app/common/types/bank.type';
import { provincesVN } from 'app/common/types/provinces-vn.type';

@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Get('banks')
  async getBanks(): Promise<bank[]> {
    return this.commonService.getBanks();
  }
  @Get('provinces-vn')
  async getProvinces(): Promise<provincesVN[]> {
    return this.commonService.geProvincesInVietNam();
  }
  @Get('communes/:provinceId')
  getCommunes(@Param('provinceId') id: string) {
    return this.commonService.getCommunesByProvinceIdInVietNam(id);
  }
  @Get('tax/:taxCode')
  async getInfoBusinessByTaxCode(@Param('taxCode') taxCode: string) {
    return this.commonService.getInfoBusinessByTaxCode(taxCode);
  }
}
