import { IsString, MinLength, IsEmail, IsNumber, IsDate, IsTimeZone, IsDateString } from "class-validator";
import { Timestamp } from "typeorm";

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

    @IsDateString()
    experience!: Date;

    @IsNumber()
    designation!: number;

    @IsNumber()
    reportingPerson!: number;
}