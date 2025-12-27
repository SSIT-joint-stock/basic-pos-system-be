import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateAndAddMemberDto {
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @MinLength(6)
  confirmPassword: string;
}
