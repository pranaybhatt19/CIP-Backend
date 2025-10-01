import express from "express";
import { welcomeUser } from "../controllers/entry.controller";

const router = express.Router();

router.get("/welcome", welcomeUser);

export default router;
