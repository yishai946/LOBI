/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/env.setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  maxWorkers: 3,
  testTimeout: 20000,
};
