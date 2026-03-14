import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app";
import { resetDb } from "./db";

describe("Auth guard coverage", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns 401 for protected route groups when token is missing", async () => {
    const protectedEndpoints = [
      "/api/users/me",
      "/api/buildings",
      "/api/apartments",
      "/api/residents",
      "/api/managers",
      "/api/messages",
      "/api/issues",
      "/api/payments",
    ];

    for (const endpoint of protectedEndpoints) {
      const res = await request(app).get(endpoint);
      expect(res.status).toBe(401);
    }
  });

  it("returns 401 for malformed token", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer not-a-real-jwt");

    expect(res.status).toBe(401);
  });

  it("returns 401 for expired token", async () => {
    const expiredToken = jwt.sign(
      {
        userId: "00000000-0000-0000-0000-000000000000",
        sessionType: "ADMIN",
      },
      process.env.ACCESS_SECRET!,
      { expiresIn: "-1s" },
    );

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });
});
