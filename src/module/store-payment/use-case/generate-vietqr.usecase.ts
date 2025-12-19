import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { NotFoundError } from 'app/common/response';
import { GenerateVietQRDto } from 'app/common/types/vietqr.type';
import { apiConfig } from 'app/config';

export class GenerateVietQRUseCase {
  constructor(
    @Inject(apiConfig.KEY)
    private readonly api_config: ConfigType<typeof apiConfig>,
  ) {}
  async execute(input: GenerateVietQRDto): Promise<string> {
    const {
      bank_code,
      bank_account_number,
      bank_name,
      amount,
      add_info = 'Thanh toan don hang',
      template = 'compact2',
    } = input;

    if (!bank_code) throw new NotFoundError('bankCode is required');
    if (!bank_account_number) throw new Error('bankAccountNumber is required');

    const params = new URLSearchParams();

    if (amount) params.append('amount', amount.toString());
    if (add_info) params.append('addInfo', add_info);
    if (bank_name) params.append('accountName', bank_name);

    return Promise.resolve(
      `${this.api_config.viet_qr}/${bank_code}-${bank_account_number}-${template}.png?${params.toString()}`,
    );
  }
}
