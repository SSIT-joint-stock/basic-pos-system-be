import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { bank } from 'app/common/types/bank.type';

import { firstValueFrom } from 'rxjs';
import { provincesVN } from 'app/common/types/provinces-vn.type';
import { apiConfig } from 'app/config';
import type { ConfigType } from '@nestjs/config';
import { communesVN } from 'app/common/types/communes-vn.type';
import { BusinessInfo } from 'app/common/types/business-info.type';

@Injectable()
export class CommonService {
  private banksCache: bank[] | null = null;
  private lastFetchTime = 0;
  private CACHE_TTL = 1000 * 60 * 60; // 1 hour
  constructor(
    private readonly httpService: HttpService,
    @Inject(apiConfig.KEY)
    private readonly api_config: ConfigType<typeof apiConfig>,
  ) {}
  async getBanks(): Promise<bank[]> {
    const currentTime = Date.now();
    if (this.banksCache && currentTime - this.lastFetchTime < this.CACHE_TTL) {
      return this.banksCache;
    }
    const response = await firstValueFrom(
      this.httpService.get<bank[]>(this.api_config.bank_vn),
    );
    this.banksCache = response.data;
    this.lastFetchTime = currentTime;
    return this.banksCache;
  }
  async geProvincesInVietNam() {
    const response = await firstValueFrom(
      this.httpService.get<provincesVN[]>(this.api_config.provinces_vn),
    );
    return response.data;
  }
  async getCommunesByProvinceIdInVietNam(provinceId: string) {
    const url = `${this.api_config.provinces_vn}/${provinceId}/communes`;

    const response = await firstValueFrom(
      this.httpService.get<communesVN[]>(url),
    );

    return response.data;
  }
  async getInfoBusinessByTaxCode(taxCode: string) {
    const url = `${this.api_config.tax_code_vn}/${taxCode}`;
    const response = await firstValueFrom(
      this.httpService.get<BusinessInfo[]>(url),
    );
    return response.data;
  }
}
