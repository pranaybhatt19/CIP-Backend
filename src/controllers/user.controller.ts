import { Request, Response } from "express";
import { registerUser } from "../services/user.service";


const registerNewUser = async(req: Request, res: Response) => {
    return await registerUser(req, res);
}

export {
    registerNewUser
}