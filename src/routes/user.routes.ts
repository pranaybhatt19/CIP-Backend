import { Router  } from "express";
import { registerNewUser } from "../controllers/user.controller";

const userRouter = Router();

userRouter.post(
    "/register",
    registerNewUser
  );

export default userRouter;