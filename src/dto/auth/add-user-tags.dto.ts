import { IsArray, IsNumber, Matches } from "class-validator";


export class AddUserTags {

    @IsNumber()
    id!: number;

    @IsArray()
    @Matches(/^[a-z]+$/, {
        each: true,
        message: 'Each tag must contain only lowercase letters.'
    })
    tags!: string[];

}