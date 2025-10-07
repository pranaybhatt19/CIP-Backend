import { Router } from "express";
import {
  addPractice,
  deletePractice,
  getUsersPracticeDetails,
  updateUser,
  searchUsers,
  getDesignations,
  getReportingPersons,
  registerNewUser,
} from "../controllers/user.controller";
import dtoValidation from "../middlewares/dto-validation.middleware";
import { AddPracticeDto, UpdateUserDto } from "../dto";
import { celebrate } from "celebrate";
import { searchUsersSchema } from "../utils/validation-schema/search-users.validation";

const userRouter = Router();

userRouter.post("/register", registerNewUser);

// POST Requests
userRouter.post("/add-practice", dtoValidation(AddPracticeDto), addPractice);
userRouter.post(
  "/update-user-details",
  dtoValidation(UpdateUserDto),
  updateUser
);
userRouter.post("/user-practices", getUsersPracticeDetails);
userRouter.get("/get-designations", getDesignations);
userRouter.get("/get-reporting-persons", getReportingPersons);

// PATCH Requests
userRouter.patch("/delete-practice/:id", deletePractice);

userRouter.post("/searchUsers", celebrate(searchUsersSchema), searchUsers);

export default userRouter;
