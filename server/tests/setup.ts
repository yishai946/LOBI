import "dotenv/config";
import path from "path";
import dotenv from "dotenv";
import prisma from "../src/lib/prisma";

const envPath = path.resolve(__dirname, "..", ".env.test");
dotenv.config({ path: envPath });

process.env.NODE_ENV = "test";

afterAll(async () => {
  await prisma.$disconnect();
});
