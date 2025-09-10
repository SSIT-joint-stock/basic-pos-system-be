import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  code: string;
}
