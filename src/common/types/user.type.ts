import { user_role } from '@prisma/client';

export interface IUser {
  id: string;
  email: string;
  username: string;
  role: user_role;
  status: string;
  storeId?: string;
  storeRole?: string;
}
