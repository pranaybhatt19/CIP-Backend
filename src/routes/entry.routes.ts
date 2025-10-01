import express from "express";
import dtoValidation from "../middlewares/dto-validation.middleware";
import { LoginDto } from "../dto/entry/login.dto";
import { login, resetPassword, verifyEmailAndGenerateOtp, verifyOtpAndGenerateResetToken, verifyOtpToken } from "../controllers/entry.controller";
import { ForgotPasswordEmailDto, OtpTokenDto, ResetPasswordDto, VerifyOtpDto } from "../dto";

const router = express.Router();

router.post("/login", dtoValidation(LoginDto), login);
router.post(
    "/forgot-password-otp-generator",
    dtoValidation(ForgotPasswordEmailDto),
    verifyEmailAndGenerateOtp
  );
  router.post("/verify-otp-token", dtoValidation(OtpTokenDto), verifyOtpToken);
  
  router.post(
    "/verify-otp",
    dtoValidation(VerifyOtpDto),
    verifyOtpAndGenerateResetToken
  );
  router.post("/reset-password", dtoValidation(ResetPasswordDto), resetPassword);
  

export default router;
