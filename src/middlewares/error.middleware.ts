import { NextFunction, Request, Response } from "express";



export default function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
    const status = err.status || 500;
    const message = err.message || 'Something went wrong';
    res.status(status).json({ message });
}