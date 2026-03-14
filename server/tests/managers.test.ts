import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";
import { resetDb } from "./db";
import { seedCore, signToken } from "./helpers";
import { SessionType } from "../src/enums/sessionType.enum";
import crypto from "crypto";

describe("Manager routes", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("admin can list managers", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .get("/api/managers")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("manager cannot list managers", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get("/api/managers")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("admin can create manager", async () => {
    const { admin, building } = await seedCore();
    const user = await prisma.user.create({
      data: {
        phone: `05${Date.now()}${Math.floor(Math.random() * 90 + 10)}`,
        name: "New Manager",
      },
    });
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/managers")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: user.id, buildingId: building.id });

    expect(res.status).toBe(201);
  });

  it("validates manager payload on create", async () => {
    const { admin, building } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/managers")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: "bad", buildingId: building.id });

    expect(res.status).toBe(400);
  });

  it("returns 404 when creating manager for missing building", async () => {
    const { admin } = await seedCore();
    const user = await prisma.user.create({
      data: {
        phone: `05${Date.now()}${Math.floor(Math.random() * 90 + 10)}`,
        name: "No Building",
      },
    });
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/managers")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: user.id, buildingId: crypto.randomUUID() });

    expect(res.status).toBe(404);
  });

  it("rejects duplicate manager relation", async () => {
    const { admin, manager, building } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/managers")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: manager.userId, buildingId: building.id });

    expect(res.status).toBe(400);
  });

  it("admin can get manager by id", async () => {
    const { admin, manager } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .get(`/api/managers/${manager.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("non-admin cannot get manager by id", async () => {
    const { managerUser, building, manager } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/managers/${manager.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("admin can delete manager", async () => {
    const { admin, manager } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .delete(`/api/managers/${manager.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("returns 404 when manager is not found", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .get(`/api/managers/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 when deleting missing manager", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .delete(`/api/managers/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
