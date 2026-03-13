import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import { authMiddleware } from "./src/middlewares/auth.middleware";
import { errorHandler } from "./src/middlewares/error.middleware";
import { requestLogger } from "./src/middlewares/logger.middleware";
import apartmentRoutes from "./src/routes/apartment.routes";
import authRoutes from "./src/routes/auth.routes";
import buildingRoutes from "./src/routes/building.routes";
import issueRoutes from "./src/routes/issue.routes";
import paymentRoutes, { paymentWebhookRouter } from "./src/routes/payment.routes";
import usersRoutes from "./src/routes/users.routes";
import logger from "./src/utils/logger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhookRouter,
);

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.use("/api/auth", authRoutes);
app.use("/api/user", authMiddleware, usersRoutes);
app.use("/api/building", authMiddleware, buildingRoutes);
app.use("/api/apartment", authMiddleware, apartmentRoutes);
app.use("/api/payments", authMiddleware, paymentRoutes);
app.use("/api/issues", authMiddleware, issueRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
