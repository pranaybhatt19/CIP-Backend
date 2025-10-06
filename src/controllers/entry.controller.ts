import { Request, Response } from "express";
import { Welcome } from "../services/entry.service";

const welcomeUser = async (req: Request, res: Response) => {
  return await Welcome(req, res);
};

export { welcomeUser };
