import { IsNumber, IsString, MinLength, IsOptional, IsBoolean } from "class-validator";


export class UpdateUserDto {
    
    @IsNumber()
    id!: number;
  
    @IsString()
    @MinLength(8)
    @IsOptional()
    password?: string;

    @IsString()
    @IsOptional()
    educationLanguage?: string;

    @IsOptional()
    @IsBoolean()
    status?: boolean;

    @IsOptional()
    @IsNumber()
    designation!: number;

    @IsOptional()
    @IsNumber()
    reportingPerson!: number;
  
    @IsOptional()
    @IsString()
    @MinLength(2)
    firstName!: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    middleName!: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    lastName!: string;
}