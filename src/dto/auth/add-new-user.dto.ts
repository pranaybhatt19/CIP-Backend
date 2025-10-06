import { IsString, MinLength, IsEmail, IsNumber, IsDate } from "class-validator";

export class AddNewUserDto {
    @IsString()
    @MinLength(2)
    firstName!: string;

    @IsString()
    @MinLength(2)
    middleName!: string;

    @IsString()
    @MinLength(2)
    lastName!: string;

    @IsEmail()
    email!: string;

    @IsDate()
    experience!: Date;

    @IsNumber()
    designation!: number;

    @IsNumber()
    reportingPerson!: number;
}