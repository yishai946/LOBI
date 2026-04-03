import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import YAML from "js-yaml";
import swaggerUi from "swagger-ui-express";
import { authMiddleware } from "./middlewares/auth.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/logger.middleware";
import apartmentRoutes from "./routes/apartment.routes";
import authRoutes from "./routes/auth.routes";
import buildingRoutes from "./routes/building.routes";
import issuesRoutes from "./routes/issues.routes";
import managersRoutes from "./routes/managers.routes";
import messagesRoutes from "./routes/messages.routes";
import paymentRoutes, {
  paymentPublicRouter,
  paymentWebhookRouter,
} from "./routes/payment.routes";
import residentsRoutes from "./routes/residents.routes";
import usersRoutes from "./routes/users.routes";
import notificationRoutes from "./routes/notification.routes";
import pushRoutes from "./routes/push.routes";

dotenv.config();

const app = express();
const swaggerPath = path.resolve(process.cwd(), "swagger.yaml");
const swaggerSpec = YAML.load(
  fs.readFileSync(swaggerPath, "utf8"),
) as swaggerUi.JsonObject;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhookRouter,
);
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// Public for now; can be wrapped with admin auth later.
app.get("/docs-json", (_req, res) => {
  res.json(swaggerSpec);
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/payments/public", paymentPublicRouter);
app.use("/api/users", authMiddleware, usersRoutes);
app.use("/api/buildings", authMiddleware, buildingRoutes);
app.use("/api/apartments", authMiddleware, apartmentRoutes);
app.use("/api/payments", authMiddleware, paymentRoutes);
app.use("/api/issues", authMiddleware, issuesRoutes);
app.use("/api/residents", authMiddleware, residentsRoutes);
app.use("/api/managers", authMiddleware, managersRoutes);
app.use("/api/messages", authMiddleware, messagesRoutes);
app.use("/api/notifications", authMiddleware, notificationRoutes);
app.use("/api/push", authMiddleware, pushRoutes);

app.use(errorHandler);

export default app;
