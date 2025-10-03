import { Request, Response, NextFunction } from "express";
import { isCelebrateError, CelebrateError, errors } from "celebrate";
import errorMiddleware from "./middlewares/error.middleware";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import entryRoutes from "./routes/entry.routes";
import dotenv from "dotenv";
import { authenticate } from "./middlewares/auth.middleware";
import userRoutes from "./routes/user.routes";
dotenv.config();

const app = express();

const allowedOrigins = [
  `${process.env.FRONTEND_DEV_DOMAIN}`
];

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.use("/api", entryRoutes);
app.use("/api/auth/users", authenticate, userRoutes);

app.use(errors());

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (isCelebrateError(err)) {
    const errorBody = err as CelebrateError;
    for (const [, joiError] of errorBody.details.entries()) {
      if (joiError && joiError.details.length > 0) {
        const firstError = joiError.details[0];
        return res.status(400).json({
          message: firstError.message.replace(/['"]/g, ""),
          field: firstError.path.join("."),
        });
      }
    }
  }

  return next(err);
});

app.use(errorMiddleware);

export default app;
