import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";
import { resetDb } from "./db";
import jwt from "jsonwebtoken";
import { seedCore, signToken } from "./helpers";
import { SessionType } from "../src/enums/sessionType.enum";

describe("Auth routes", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("requests OTP for existing user", async () => {
    const phone = `05${Math.floor(10000000 + Math.random() * 90000000)}`;
    await prisma.user.create({
      data: { phone, name: "User" },
    });

    const res = await request(app)
      .post("/api/auth/request-otp")
      .send({ phone });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("OTP sent");
  });

  it("rejects OTP request for unknown phone", async () => {
    const res = await request(app)
      .post("/api/auth/request-otp")
      .send({ phone: `05${Math.floor(10000000 + Math.random() * 90000000)}` });

    expect(res.status).toBe(404);
  });

  it("rejects invalid OTP", async () => {
    const phone = `05${Math.floor(10000000 + Math.random() * 90000000)}`;
    await prisma.user.create({
      data: {
        phone,
        otpCode: "123456",
        otpExpires: new Date(Date.now() + 1000 * 60),
      },
    });

    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone, otp: "000000" });

    expect(res.status).toBe(401);
  });

  it("rejects expired OTP", async () => {
    const phone = `05${Math.floor(10000000 + Math.random() * 90000000)}`;
    await prisma.user.create({
      data: {
        phone,
        otpCode: "123456",
        otpExpires: new Date(Date.now() - 1000),
      },
    });

    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone, otp: "123456" });

    expect(res.status).toBe(401);
  });

  it("rejects refresh without cookie", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
  });

  it("verifies OTP and returns access token with refresh cookie", async () => {
    const phone = `05${Math.floor(10000000 + Math.random() * 90000000)}`;
    await prisma.user.create({
      data: {
        phone,
        otpCode: "123456",
        otpExpires: new Date(Date.now() + 1000 * 60),
      },
    });

    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone, otp: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    const setCookie = res.headers["set-cookie"];
    const cookieHeader = Array.isArray(setCookie)
      ? setCookie.join(";")
      : (setCookie ?? "");
    expect(cookieHeader).toContain("refreshToken=");
  });

  it("invalidates OTP after successful verification", async () => {
    const phone = `05${Math.floor(10000000 + Math.random() * 90000000)}`;
    await prisma.user.create({
      data: {
        phone,
        otpCode: "123456",
        otpExpires: new Date(Date.now() + 1000 * 60),
      },
    });

    const first = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone, otp: "123456" });

    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone, otp: "123456" });

    expect(second.status).toBe(400);
  });

  it("refreshes token with valid cookie", async () => {
    const user = await prisma.user.create({
      data: { phone: `05${Math.floor(10000000 + Math.random() * 90000000)}` },
    });
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_SECRET!,
      { expiresIn: "7d" },
    );

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`refreshToken=${refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it("rejects refresh with invalid token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", ["refreshToken=not-a-jwt"]);

    expect(res.status).toBe(401);
  });

  it("completes profile for authenticated user", async () => {
    const user = await prisma.user.create({
      data: { phone: `05${Math.floor(10000000 + Math.random() * 90000000)}` },
    });
    const token = signToken({
      userId: user.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/auth/complete-profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Updated Name");
  });

  it("rejects complete-profile when unauthenticated", async () => {
    const res = await request(app)
      .post("/api/auth/complete-profile")
      .send({ name: "Updated Name" });

    expect(res.status).toBe(401);
  });

  it("validates complete-profile payload", async () => {
    const user = await prisma.user.create({
      data: { phone: `05${Math.floor(10000000 + Math.random() * 90000000)}` },
    });
    const token = signToken({
      userId: user.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/auth/complete-profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "" });

    expect(res.status).toBe(400);
  });

  it("selects manager context and returns token", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/auth/select-context")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "MANAGER", buildingId: building.id });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rejects selecting manager context for another building", async () => {
    const { managerUser, building } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "Other", address: "Else 12" },
    });
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/auth/select-context")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "MANAGER", buildingId: otherBuilding.id });

    expect(res.status).toBe(403);
  });

  it("rejects selecting resident context for another apartment", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const otherApartment = await prisma.apartment.create({
      data: { name: "Apt Other", buildingId: building.id },
    });

    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/auth/select-context")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "RESIDENT", apartmentId: otherApartment.id });

    expect(res.status).toBe(403);
  });

  it("validates select-context type", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/auth/select-context")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "INVALID" });

    expect(res.status).toBe(400);
  });
});
