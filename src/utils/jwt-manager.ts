const jwt = require("jsonwebtoken");
import dotenv from "dotenv";
dotenv.config();

const secret = process.env.JWT_SECRET;
let expiresIn = process.env.JWT_EXPIRES_IN || "1h";

export const createToken = (payload: object, expireTime?: string): string => {
  try {
    return jwt.sign(payload, secret, { expiresIn: expireTime ?? expiresIn });
  } catch (error) {
    console.log(error);
    throw new Error("Error creating token");
  }
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, secret);
  } catch (error: any) {
    console.error("Something went wrong while validating token:", error);
    let message: string =
      error.message || "Something went wrong while validating token";
    throw new Error(message);
  }
};
