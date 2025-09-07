// src/common/helpers/bcrypt.service.ts

import { Injectable } from '@nestjs/common';
import * as bcryptjs from 'bcryptjs';

const SALT_PASSWORD = 10;

@Injectable()
export class BcryptService {
  async hashPassword(password: string): Promise<string> {
    return await bcryptjs.hash(password, SALT_PASSWORD);
  }

  async comparePassword(
    password: string,
    hashPassword: string,
  ): Promise<boolean> {
    return await bcryptjs.compare(password, hashPassword);
  }
}
