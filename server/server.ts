import "dotenv/config";
import http from "http";
import app from "./src/app";
import logger from "./src/utils/logger";
import { initSocket } from "./src/lib/socket";

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
