import dotenv from "dotenv";
import app from "./src/app";
import logger from "./src/utils/logger";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
