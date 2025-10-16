import { ArrayUnique, IsArray, IsNumber, IsString, Matches, Validate } from "class-validator";

export class AddUserTags {

    @IsNumber()
    id!: number;

    @IsArray()
    @IsString({ each: true, message: "each tag must be a string" })
    @Matches(/^[a-z]+$/, {
        each: true,
        message: "Each tag must contain only lowercase letters.",
    })
    @ArrayUnique({ message: "Tags must be unique." })
    tags!: string[];

}