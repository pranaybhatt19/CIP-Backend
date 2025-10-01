import { Request, Response } from "express";
import { loginUser, resetPasswordProcess, verifyEmailAndGenerateOtpProcess, verifyOtpAndGenerateResetTokenProcess, verifyOtpTokenProcess } from "../services/entry.service";

const login = async (req: Request, res: Response) => {
  return await loginUser(req, res);
};

const resetPassword = async (req: Request, res: Response) => {
  return await resetPasswordProcess(req, res);
};

const verifyEmailAndGenerateOtp = async (req: Request, res: Response) => {
  return await verifyEmailAndGenerateOtpProcess(req, res);
};
const verifyOtpToken = async (req: Request, res: Response) => {
  return await verifyOtpTokenProcess(req, res);
};

const verifyOtpAndGenerateResetToken = async (req: Request, res: Response) => {
  return await verifyOtpAndGenerateResetTokenProcess(req, res);
};

export { 
  login,
  resetPassword,
  verifyEmailAndGenerateOtp,
  verifyOtpAndGenerateResetToken,
  verifyOtpToken,
 };
