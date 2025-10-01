import { IsString } from "class-validator";

export class OtpTokenDto {
  @IsString()
  otp!: string;
}
