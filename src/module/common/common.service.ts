import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { bank } from 'app/common/types/bank.type';

import { firstValueFrom } from 'rxjs';

@Injectable()
export class CommonService {
  private banksCache: bank[] | null = null;
  private lastFetchTime = 0;
  private CACHE_TTL = 1000 * 60 * 60; // 1 hour
  constructor(private readonly httpService: HttpService) {}
  async getBanks(): Promise<bank[]> {
    const currentTime = Date.now();
    if (this.banksCache && currentTime - this.lastFetchTime < this.CACHE_TTL) {
      return this.banksCache;
    }
    const response = await firstValueFrom(
      this.httpService.get<bank[]>('https://api.vietqr.io/v2/banks'),
    );
    this.banksCache = response.data;
    this.lastFetchTime = currentTime;
    return this.banksCache;
  }
}
