import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { errorHandler } from "./src/middlewares/error.middleware";
import { requestLogger } from "./src/middlewares/logger.middleware";
import authRoutes from "./src/routes/auth.routes";
import usersRoutes from "./src/routes/users.routes";
import logger from "./src/utils/logger";
import { authMiddleware } from "./src/middlewares/auth.middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(requestLogger);

app.use("/api/auth", authRoutes);
app.use("/api/users", authMiddleware, usersRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
