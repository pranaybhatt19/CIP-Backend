import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
    @IsString()
    identity!: string;
  
    @IsString()
    @MinLength(8)
    password!: string;
}