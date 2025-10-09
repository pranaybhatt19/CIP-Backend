import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt-manager";
import { AppDataSource } from "../database/config/data-source";
import { User } from "../entities";
import { calculateExperience } from "../utils/validators";

export interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    name: string;
    designation: string;
    activeStatus: boolean;
    mediumOfEducation: string | null;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers["authorization"];
  if (!header)
    return res.status(401).json({ message: "Authorization header missing" });

  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ message: "Authorization failed, auth token not found" });

  try {
    const decoded = verifyToken(token) as any;

    const userId: number = parseInt(decoded.sub);

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const userRepository = AppDataSource.getRepository(User);

    const dbUser = await userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.designation", "designations")
      .leftJoinAndSelect("user.reporting_person", "reportingPerson")
      .leftJoinAndSelect("reportingPerson.designation", "roDesignation")
      .where("user.id = :id", { id: userId })
      .getOne();

    if (!dbUser) {
      return res
        .status(401)
        .json({ message: "Authorization failed, User not found" });
    }

    if (!dbUser.is_active) {
      return res
        .status(401)
        .json({ message: "Authorization failed, User inactive" });
    }
    const requestPath = req.path;
    const updateUserPath = process.env.UPDATE_USER_API_PATH?.toString();
    if (!dbUser.medium_of_education && updateUserPath !== requestPath) {
      return res.status(409).json({
        message:
          "Conflict with the resource's current state, Add medium of education",
      });
    }

    const experience = calculateExperience(dbUser.experience);

    req.user = {
      sub: dbUser.id as any,
      email: dbUser.email,
      name: dbUser.full_name,
      designation: dbUser.designation.name,
      activeStatus: dbUser.is_active,
      mediumOfEducation: dbUser.medium_of_education,
      // experience: experience,
      // reportingPerson: dbUser?.reporting_person ? {
      //   sub: dbUser?.reporting_person?.id,
      //   name: dbUser?.reporting_person?.full_name,
      //   designation: {
      //     id: dbUser?.designation.id,
      //     name: dbUser?.designation.name
      //   }
      // } as any : null,
    };

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Authorization failed, Invalid or expired token" });
  }
};
