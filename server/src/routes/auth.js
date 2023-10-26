import express from "express";
import { signup, login, verification } from "../controllers/authController.js";

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.get("/:userId/verify/:token", verification);

export default userRouter;
