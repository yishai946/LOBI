import path from "path";
import dotenv from "dotenv";

process.env.NODE_ENV = "test";

const envPath = path.resolve(__dirname, "..", ".env.test");
const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
  throw result.error;
}
