export interface IUser {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  storeId?: string;
  storeRole?: string;
}
