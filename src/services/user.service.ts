import { Request, Response } from "express";
import { AppDataSource } from "../database/config/data-source";
import bcrypt from "bcryptjs";
import { Communications, User } from "../entities";
import { passwordValidation } from "../utils/validators";
import { registeredEmailTemplate, sendEmail } from "../utils/email-manager";
import { AddPracticeDto } from "../dto";
import { ISavePractice } from "../interfaces";
import { AuthRequest } from "../middlewares/auth.middleware";

const userRepository = AppDataSource.getRepository(User);
const communicationRepository = AppDataSource.getRepository(Communications);


// const registerUser = async (req: Request, res: Response): Promise<any> => {
//   const { fName, email, password, role, designation, experience } = req.body;

//   if (!passwordValidation(password)) {
//     return res.status(400).json({
//       message:
//         "Password does not meet complexity requirements, Please create a strong password",
//     });
//   }

//   try {
//     const existingUser: User | null = await userRepository.findOne({
//       where: [{ email }],
//     });
//     if (existingUser) {
//       return res
//         .status(409)
//         .json({ message: "User with this email already exists" });
//     }

//     const hashedPassword: string = await bcrypt.hash(password, 10);
//     const username = String(email).split("@")[0];
//   //   const newUser: User = userRepository.create({
//   //     first_name: fName,
//   //     user_name: username,
//   //     email,
//   //     password: hashedPassword,
//   //     role,
//   //     is_active: true,
//   //     designation: designation || null,
//   //     experience: experience || null,
//   //   });

//   //   const newUserPayload: User = await userRepository.save(newUser);

//     const subject = "Get started with CIP";
//   //   const htmlTemplate = registeredEmailTemplate(
//   //     newUserPayload.fullname,
//   //     newUserPayload.email,
//   //     password
//   //   );

//   //   const emailResponse = await sendEmail(newUser.email, subject, htmlTemplate);
//   //   if (!emailResponse.status) {
//   //     return res.status(401).json({ message: emailResponse.message });
//   //   }

//     return res.status(201).json({ message: "User created successfully" });
//   } catch (error) {
//     console.error("Error creating user:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

const updateUserDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, password, status } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Either id or email must be provided" });
    }

    let user: User | null = await userRepository.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (status !== undefined) {
      user.is_active = status;
    }

    if (password) {
      const isSamePassword = await bcrypt.compare(password, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          message: "New password must be different from the old password",
        });
      }
      if (!passwordValidation(password)) {
        return res.status(400).json({
          message:
            "Password does not meet complexity requirements, Please create a strong password",
        });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    return res.status(200).json({ message: "User updated successfully" });
  } catch(err: any){
    console.error("Error updating user:", err);
    const message = err.message || "Error updating user";
    return res.status(500).json({ message: message });
  }
}

const addNewPractice = async(req: Request, res: Response): Promise<any> => {
  try {
    const { id, date, link, feedback }: AddPracticeDto = req.body;

    if (!id) {
      return res.status(400).json({ message: "user-id is required" });
    }

    if(!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    if(!link) {
      return res.status(400).json({ message: "link is required" });
    }

    const user: User | null = await userRepository.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({
        message: "User not found, Please try again",
      });
    }

    const communicationPracticeDetails: ISavePractice = {
      user: user,
      date: date,
      link: link,
      feedback: feedback ? feedback : null
    }

    const newPractice: Communications = await communicationRepository.create(communicationPracticeDetails);
    const savePractice: Communications = await communicationRepository.save(newPractice);

    return res.status(201).json({ message: "Communication practice details added successfully", payload: savePractice });

  } catch(err: any){
    console.error("Error adding communication practice details:", err);
    const message = err.message || "Error adding communication practice details";
    return res.status(500).json({ message: message });
  }
}

const getPracticeDetailsByUserId = async(req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id, offset, limit, dateExact, dateFrom, dateTo } = req.body;

    const numericId = Number(id);

    if (!id || isNaN(numericId)) {
      return res.status(400).json({
        message: "Invalid practice id",
      });
    }

    const user: User | null = await userRepository.createQueryBuilder('user')
    .leftJoinAndSelect('user.reporting_person', 'reportingPerson')
    .where("user.id = :id", { id: numericId })
    .getOne();
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (Number(req.user?.sub) !== id) {
      if(req.user?.reportingPerson && Number(req.user?.reportingPerson?.sub) !== Number(user.reporting_person.id)){
        return res.status(403).json({
          message: "Not authorize to see other users information",
        });
      }
    }

    const queryBuilder = await communicationRepository
      .createQueryBuilder('practice')
      .where("practice.id = :userId", { userId: numericId })
      .andWhere("practice.is_deleted = :status", { status: false })
      .orderBy("practice.id", "DESC");
      
    if(dateExact || dateFrom || dateTo) {
      if (dateExact) {
        const date = parseToDate(dateExact);
        if (!date) {
          return res.status(400).json({
            message:
              "Invalid dateExact format. Use YYYY-MM-DD or a valid date.",
          });
        }
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const next = new Date(start);
        next.setDate(next.getDate() + 1);

        queryBuilder.andWhere("t.date >= :startOfDay AND t.date < :nextDay", {
          startOfDay: start.toISOString(),
          nextDay: next.toISOString(),
        });
      } else if (dateFrom && dateTo) {
        const from = parseToDate(dateFrom);
        const to = parseToDate(dateTo);
        if (!from || !to) {
          return res.status(400).json({
            message:
              "Invalid dateFrom/dateTo format. Use YYYY-MM-DD or a valid date.",
          });
        }
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        const next = new Date(to);
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        queryBuilder.andWhere("t.date >= :fromDay AND t.date < :toNextDay", {
          fromDay: start.toISOString(),
          toNextDay: next.toISOString(),
        });
      } else if (dateFrom) {
        const from = parseToDate(dateFrom);
        if (!from)
          return res.status(400).json({ message: "Invalid dateFrom format." });
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        queryBuilder.andWhere("t.date >= :startOfDay", {
          startOfDay: start.toISOString(),
        });
      } else if (dateTo) {
        const to = parseToDate(dateTo);
        if (!to)
          return res.status(400).json({ message: "Invalid dateTo format." });
        const next = new Date(to);
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        queryBuilder.andWhere("t.date < :toNextDay", {
          toNextDay: next.toISOString(),
        });
      }
    }
    
    if (limit) queryBuilder.take(limit);
    if (offset) queryBuilder.skip(offset);
      
    queryBuilder.distinct(true);
    const [practices, total] = await queryBuilder.getManyAndCount();

    const userPractices = {
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email
      },
      practices: practices,
      total: total
    }

    return res.status(200).json({
      message: "Users communication practices fetched successfully",
      payload: userPractices
    });

  } catch(err: any) {
    console.error("Error fetching user communication practice detail:", err);
    const message = err.message || 'Error fetching user communication practice detail, Internal server error';
    return res.status(500).json({ message: message });
  }
}

const deletePracticeResult = async(req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.sub;

    if (!id) {
      return res.status(400).json({ message: "Communication-Practice Id is required" });
    }

    if (!userId) {
      return res.status(400).json({ message: "User Id is required" });
    }

    const user: User | null = await userRepository.findOne({
      where: { id: +userId },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const communicationResult: Communications | null = await communicationRepository.findOne({
      where: { id: +id },
    });
    if(!communicationResult){
      return res.status(404).json({
        message: "Communication-Practice associated with this id not found, Please try again",
      });
    }

    await communicationRepository.update(id, { is_deleted: true });
    return res.status(200).json({ message: "Practice record deleted successfully" });
  } catch(err: any){
    const message = err.message || "Error adding communication practice details";
    return res.status(500).json({ message: message });
  }
}

const parseToDate = (val?: string | number) => {
  if (!val) return null;
  const date = new Date(String(val));
  if (isNaN(date.getTime())) return null;
  return date;
};

export {
    // registerUser,
    addNewPractice,
    updateUserDetails,
    deletePracticeResult,
    getPracticeDetailsByUserId,
}