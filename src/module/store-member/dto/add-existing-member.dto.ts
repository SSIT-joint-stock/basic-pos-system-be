import { IsEmail, IsNotEmpty } from 'class-validator';

export class AddExistingMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
