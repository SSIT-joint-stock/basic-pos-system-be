import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailRequestDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
