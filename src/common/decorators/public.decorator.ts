// danh dau endpoint la public kh can authentication
// guard se doc metadata nay de skip authentication
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
