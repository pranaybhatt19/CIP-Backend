import { IsNumber, IsString, MinLength, IsOptional, IsBoolean } from "class-validator";


export class UpdateUserDto {
    
    @IsNumber()
    id!: number;
  
    @IsString()
    @MinLength(8)
    @IsOptional()
    password?: string;

    @IsOptional()
    @IsBoolean()
    status?: boolean;
  
}