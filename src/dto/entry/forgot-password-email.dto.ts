import { IsEmail } from "class-validator";

export class ForgotPasswordEmailDto {
  @IsEmail()
  email!: string;
}
