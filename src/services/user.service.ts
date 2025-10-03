import { Request, Response } from "express";
import { AppDataSource } from "../database/config/data-source";
import bcrypt from "bcryptjs";
import { User } from "../entities";
import { passwordValidation } from "../utils/validators";
import { registeredEmailTemplate, sendEmail } from "../utils/email-manager";

const userRepository = AppDataSource.getRepository(User);


const registerUser = async (req: Request, res: Response): Promise<any> => {
    const { fName, email, password, role, designation, experience } = req.body;
  
    if (!passwordValidation(password)) {
      return res.status(400).json({
        message:
          "Password does not meet complexity requirements, Please create a strong password",
      });
    }
  
    try {
      const existingUser: User | null = await userRepository.findOne({
        where: [{ email }],
      });
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "User with this email already exists" });
      }
  
      const hashedPassword: string = await bcrypt.hash(password, 10);
      const username = String(email).split("@")[0];
    //   const newUser: User = userRepository.create({
    //     first_name: fName,
    //     user_name: username,
    //     email,
    //     password: hashedPassword,
    //     role,
    //     is_active: true,
    //     designation: designation || null,
    //     experience: experience || null,
    //   });
  
    //   const newUserPayload: User = await userRepository.save(newUser);
  
      const subject = "Get started with CIP";
    //   const htmlTemplate = registeredEmailTemplate(
    //     newUserPayload.fullname,
    //     newUserPayload.email,
    //     password
    //   );
  
    //   const emailResponse = await sendEmail(newUser.email, subject, htmlTemplate);
    //   if (!emailResponse.status) {
    //     return res.status(401).json({ message: emailResponse.message });
    //   }
  
      return res.status(201).json({ message: "User created successfully" });
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
};


export {
    registerUser
}