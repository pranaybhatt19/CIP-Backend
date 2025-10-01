import { plainToInstance } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import { validate } from "class-validator";



export default function dtoValidation(dto: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const dtoObject = plainToInstance(dto, req.body);
        const errors = await validate(dtoObject, { whitelist: true, forbidNonWhitelisted: true });
    
        if (errors.length > 0) {
            const formattedError = errors.map(err => ({
                property: err.property,
                constraints: err.constraints
            }));
            return res.status(400).json({ errors: formattedError });
        }
        req.body = dtoObject as any;
        next();
    }
}