// src/common/helpers/code.service.ts

import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';

const LENGTH_CODE = 6;
const TTL_CODE = 5;

@Injectable()
export class CodeService {
  private generateNumericCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  generateCodeWithExpiry(
    length = LENGTH_CODE,
    ttl = TTL_CODE,
  ): { code: string; expiredAt: Date } {
    const code = this.generateNumericCode(length);
    const expiredAt = dayjs().add(ttl, 'minute').toDate();
    return { code, expiredAt };
  }

  isCodeExpired(expiredAt: Date): boolean {
    return dayjs().isAfter(dayjs(expiredAt));
  }
}
