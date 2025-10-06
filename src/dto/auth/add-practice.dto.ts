import { IsNumber, IsNotEmpty, IsDefined, IsString, IsOptional } from "class-validator";


export class AddPracticeDto {
    @IsNumber()
    @IsNotEmpty()
    @IsDefined()
    id!: number;
  
    @IsString()
    @IsNotEmpty()
    @IsDefined()
    date!: Date;
  
    @IsString()
    @IsNotEmpty()
    @IsDefined()
    link!: string;

    @IsOptional()
    @IsString()
    feedback?: string;
}