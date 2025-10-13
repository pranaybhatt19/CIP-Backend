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
  getUsersDetails,
  getUsersMedium,
} from "../controllers/user.controller";
import dtoValidation from "../middlewares/dto-validation.middleware";
import { AddPracticeDto, UpdateUserDto } from "../dto";
import { celebrate } from "celebrate";
import { searchUsersSchema } from "../utils/validation-schema/search-users.validation";

const userRouter = Router();

// GET Requests
userRouter.get("/get-designations", getDesignations);
userRouter.get("/get-reporting-persons", getReportingPersons);
userRouter.get("/get-user-details/:id", getUsersDetails);
userRouter.get("/get-user-medium", getUsersMedium);


// POST Requests
userRouter.post("/register", registerNewUser);
userRouter.post("/add-practice", dtoValidation(AddPracticeDto), addPractice);
userRouter.post(
  "/update-user-details",
  dtoValidation(UpdateUserDto),
  updateUser
);
userRouter.post("/searchUsers", celebrate(searchUsersSchema), searchUsers);
userRouter.post("/user-practices", getUsersPracticeDetails);


// PATCH Requests
userRouter.patch("/delete-practice/:id", deletePractice);

export default userRouter;
