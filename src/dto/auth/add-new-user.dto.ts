import { IsString, MinLength, IsEmail, IsOptional, IsIn, IsNumber, IsDate } from "class-validator";




export class AddNewUserDto {
    @IsString()
    @MinLength(2)
    fullName!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(8)
    password!: string;

    @IsNumber()
    designation!: number;

    @IsDate()
    experience!: Date;

    @IsNumber()
    reportingPerson!: number;
}