import { Router } from "express";
import {
  addPractice,
  deletePractice,
  getUsersPracticeDetails,
  updateUser,
  searchUsers,
} from "../controllers/user.controller";
import dtoValidation from "../middlewares/dto-validation.middleware";
import { AddPracticeDto, UpdateUserDto } from "../dto";
import { celebrate } from "celebrate";
import { searchUsersSchema } from "../utils/validation-schema/search-users.validation";

const userRouter = Router();

// userRouter.post("/register", registerNewUser); // No use-case

// POST Requests
userRouter.post("/add-practice", dtoValidation(AddPracticeDto), addPractice);
userRouter.post(
  "/update-user-details",
  dtoValidation(UpdateUserDto),
  updateUser
);
userRouter.post("/user-practices", getUsersPracticeDetails);

// PATCH Requests
userRouter.patch("/delete-practice/:id", deletePractice);

userRouter.post("/searchUsers", celebrate(searchUsersSchema), searchUsers);

export default userRouter;
