import { Request, Response } from "express";
import { addNewPractice, deletePracticeResult, getPracticeDetailsByUserId, updateUserDetails } from "../services/user.service";


// const registerNewUser = async(req: Request, res: Response) => {
//     return await registerUser(req, res);
// }

const updateUser = async(req: Request, res: Response) => {
    return await updateUserDetails(req, res);
}

const addPractice = async(req: Request, res: Response) => {
    return await addNewPractice(req, res);
}

const getUsersPracticeDetails = async(req: Request, res:Response) => {
    return await getPracticeDetailsByUserId(req , res);
}

const deletePractice = async(req: Request, res: Response) => {
    return await deletePracticeResult(req, res);
}


export {
    // registerNewUser,
    addPractice,
    updateUser,
    getUsersPracticeDetails,
    deletePractice
}