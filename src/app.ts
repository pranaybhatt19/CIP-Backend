import express from "express";
import cors from "cors";
import helmet from "helmet";
import entryRoutes from "./routes/entry.routes";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const allowedOrigins = [
  `${process.env.FRONTEND_PROD_DOMAIN}`,
  `${process.env.FRONTEND_PROD_TEST_DOMAIN}`,
  `${process.env.FRONTEND_DEV_DOMAIN}`,
  `${process.env.FRONTEND_ANASOURCE_URL}`,
];

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
import { Request, Response, NextFunction } from "express";
import { isCelebrateError, CelebrateError, errors } from "celebrate";
import errorMiddleware from "./middlewares/error.middleware";

app.use("/api", entryRoutes);

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
