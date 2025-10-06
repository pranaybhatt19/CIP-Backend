import { Request, Response } from "express";

import dotenv from "dotenv";

dotenv.config();

const Welcome = async (req: Request, res: Response): Promise<any> => {
  try {
    res.status(200).json({ Message: "Welcome to CIP" });
  } catch (error: any) {
    console.log("error: ", error);
  }
};

export { Welcome };
