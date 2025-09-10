import { Match } from 'app/common/decorators/match.decorator';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  resetToken: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @Match('password', { message: 'Confirm password does not match' })
  confirmPassword: string;
}
