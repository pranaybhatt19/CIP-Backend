import { Request, Response } from "express";
import {
  addNewPractice,
  deletePracticeResult,
  getPracticeDetailsByUserId,
  updateUserDetails,
  searchUsersFilter,
  getDesignationsList,
  getReportingPersonsList,
} from "../services/user.service";

// const registerNewUser = async(req: Request, res: Response) => {
//     return await registerUser(req, res);
// }
const searchUsers = async (req: Request, res: Response) => {
  return await searchUsersFilter(req, res);
};

const updateUser = async (req: Request, res: Response) => {
  return await updateUserDetails(req, res);
};

const addPractice = async (req: Request, res: Response) => {
  return await addNewPractice(req, res);
};

const getDesignations = async (req: Request, res: Response) => {
  return await getDesignationsList(req, res);
};

const getReportingPersons = async (req: Request, res: Response) => {
  return await getReportingPersonsList(req, res);
};

const getUsersPracticeDetails = async (req: Request, res: Response) => {
  return await getPracticeDetailsByUserId(req, res);
};

const deletePractice = async (req: Request, res: Response) => {
  return await deletePracticeResult(req, res);
};

export {
  // registerNewUser,
  getReportingPersons,
  getDesignations,
  searchUsers,
  addPractice,
  updateUser,
  getUsersPracticeDetails,
  deletePractice,
};
