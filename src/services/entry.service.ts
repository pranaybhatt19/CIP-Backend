import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { AppDataSource } from "../database/config/data-source";
import { createToken, verifyToken } from "../utils/jwt-manager";
import { LoginDto } from "../dto/entry/login.dto";
import { User } from "../entities";
import { generateOtpPlain, hashValue } from "../utils/validators";
import { ForgotPasswordEmailDto, VerifyOtpDto } from "../dto";
import { otpEmailTemplate, sendEmail } from "../utils/email-manager";
import { OtpTokenDto } from "../dto/entry/otp-token.dto";
import { ResetPasswordDto } from "../dto/entry/reset-password.dto";
dotenv.config();

const userRepository = AppDataSource.getRepository(User);

const OTP_EXPIRES_MIN = process.env.OTP_EXPIRES_MINUTES || "5m";
const RESET_TOKEN_EXPIRES_MIN =
  process.env.RESET_TOKEN_EXPIRES_MINUTES || "15m";

const loginUser = async (req: Request, res: Response): Promise<any> => {
  const { identity, password }: LoginDto = req.body;

  try {
    if (!identity)
      return res
        .status(400)
        .json({ message: "Email is required, Please try again." });

    const userDetails = await userRepository.createQueryBuilder('user')
      .leftJoinAndSelect("user.designation", "designation")
      .leftJoinAndSelect('user.reporting_person', 'reportingPerson')
      .leftJoinAndSelect('reportingPerson.designation', 'roDesignation')
      .where("user.email = :email", { email: identity })
      .getOne();

    if (!userDetails) {
      return res.status(401).json({ message: "user not found" });
    }

    const verify = await bcrypt.compare(password, userDetails.password);

    if (!verify) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!userDetails.is_active) {
      return res.status(403).json({ message: "User account is inactive" });
    }

    const tokenPayload: any = {
      sub: userDetails.id,
      email: userDetails.email,
      name: userDetails.full_name,
      designation: {
        id: userDetails.designation.id,
        name: userDetails.designation.name
      },
      reportingPerson: userDetails?.reporting_person ? {
        sub: userDetails?.reporting_person?.id,
        name: userDetails?.reporting_person?.full_name,
        designation: {
          id: userDetails?.designation.id,
          name: userDetails?.designation.name
        }
      } : null,
      activeStatus: userDetails.is_active
    };
    const token: string = createToken(tokenPayload);

    return res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    let message: string = error.message || "Internal server error";
    return res.status(500).json({ message: message });
  }
};

const resetPasswordProcess = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { token, password }: ResetPasswordDto = req.body;

    if (!token || !password)
      return res.status(400).json({
        message:
          "Token and new password is required for password-reset, Please try again.",
      });
    const tokenPayload = verifyToken(token);
    const userId = Number(tokenPayload?.sub);

    const userDetails: User | null = await userRepository.findOne({
      where: { id: userId },
    });
    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userDetails.is_reset_token_used) {
      return res.status(400).json({ message: "Token already used" });
    }

    if (
      !userDetails.password_set_token ||
      !userDetails.password_set_expires_at
    ) {
      return res.status(400).json({ message: "No reset token found for user" });
    }

    if (userDetails.password_set_expires_at < new Date()) {
      return res.status(400).json({ message: "Reset token expired" });
    }

    const tokenHash = hashValue(token);
    if (tokenHash !== userDetails.password_set_token) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);
    userDetails.password = hashedPassword;
    userDetails.is_reset_token_used = true;
    userDetails.password_set_token = null;
    userDetails.password_set_expires_at = null;

    await userRepository.save(userDetails);

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error: any) {
    console.error("Reset password error:", error);
    let message: string =
      error.message || "Internal server error, Reset Password failed";
    return res.status(500).json({ message: message });
  }
};

const verifyEmailAndGenerateOtpProcess = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { email }: ForgotPasswordEmailDto = req.body;

    if (!email)
      return res
        .status(400)
        .json({ message: "Email is required, Please try again." });

    const userDetails = await userRepository.findOne({
      where: [{ email: email }],
    });

    if (!userDetails) {
      return res.status(401).json({
        message:
          "User with this email does not exists, Please use valid registered email",
      });
    }

    const otpPlain = generateOtpPlain(6).trim();
    const otp_expiry_minutes = parseInt(OTP_EXPIRES_MIN.replace("m", ""), 10);
    const otpExpiry = addMinutes(new Date(), otp_expiry_minutes);

    if (!otpExpiry)
      return res.status(401).json({
        message:
          "Something went wrong while creating OTP or Hashing OTP, Please try again after sometime",
      });

    userDetails.otp = otpPlain;
    userDetails.otp_expiration_time = otpExpiry;
    await userRepository.save(userDetails);

    const subject = "IPP: OTP for Password Reset";
    const htmlTemplate = otpEmailTemplate(+otpPlain, otp_expiry_minutes);

    const emailResponse = await sendEmail(userDetails.email, subject, htmlTemplate);
    if (!emailResponse.status) {
      return res.status(401).json({ message: emailResponse.message });
    }

    const expiresInMin = RESET_TOKEN_EXPIRES_MIN?.toString();
    const jwtPayload = { sub: userDetails.id, email: userDetails.email };
    const otpPageJwt = createToken(jwtPayload, expiresInMin);
    return res.status(200).json({ token: otpPageJwt });
  } catch (err: any) {
    let message: string = err.message || "Internal server error";
    return res.status(500).json({ message: message });
  }
};

const verifyOtpAndGenerateResetTokenProcess = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, otp }: VerifyOtpDto = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const userDetails = await userRepository.findOne({ where: { email } });
    if (!userDetails)
      return res.status(400).json({ message: "Invalid otp or email" });

    if (!userDetails.otp || !userDetails.otp_expiration_time) {
      return res
        .status(400)
        .json({ message: "OTP not generated or has already been used" });
    }

    const now = new Date();
    if (userDetails.otp_expiration_time < now) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (otp !== userDetails.otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const expiresInMin = RESET_TOKEN_EXPIRES_MIN?.toString();
    const jwtPayload = { sub: userDetails.id, email: userDetails.email };
    const resetJwt = createToken(jwtPayload, expiresInMin);

    const resetTokenHash = hashValue(resetJwt);
    userDetails.password_set_token = resetTokenHash;
    const otp_expiry_minutes = parseInt(expiresInMin.replace("m", ""), 10);
    userDetails.password_set_expires_at = addMinutes(
      new Date(),
      Number(otp_expiry_minutes)
    );
    userDetails.is_reset_token_used = false;
    userDetails.otp = null;
    userDetails.otp_expiration_time = null;

    await userRepository.save(userDetails);

    return res.status(200).json({
      message: "OTP verified successfully.",
      resetToken: resetJwt,
      expiresInMinutes: RESET_TOKEN_EXPIRES_MIN,
    });
  } catch (err: any) {
    let message: string = err.message || "Internal server error";
    return res.status(500).json({ message: message });
  }
};

const verifyOtpTokenProcess = async (req: Request, res: Response) => {
  try {
    const { otp }: OtpTokenDto = req.body;
    const isValidToken = verifyToken(otp);
    return res.status(200).json({ valid: isValidToken != null });
  } catch (err: any) {
    let message: string = err.message || "Internal server error";
    return res.status(500).json({ message: message });
  }
};

const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

export {
  loginUser,
  resetPasswordProcess,
  verifyEmailAndGenerateOtpProcess,
  verifyOtpAndGenerateResetTokenProcess,
  verifyOtpTokenProcess,
};