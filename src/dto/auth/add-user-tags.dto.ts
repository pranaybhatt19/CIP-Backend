import { IsArray, IsNumber } from "class-validator";


export class AddUserTags {

    @IsNumber()
    id!: number;

    @IsArray()
    tags!: string[];

}