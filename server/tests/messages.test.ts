import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";
import { resetDb } from "./db";
import { seedCore, signToken } from "./helpers";
import { SessionType } from "../src/enums/sessionType.enum";
import crypto from "crypto";

describe("Message routes", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("manager can create message", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Notice", content: "Hello" });

    expect(res.status).toBe(201);
  });

  it("resident cannot create message", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Notice", content: "Hello" });

    expect(res.status).toBe(403);
  });

  it("admin cannot create message", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Notice", content: "Hello" });

    expect(res.status).toBe(403);
  });

  it("validates message payload on create", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "", content: "Hello" });

    expect(res.status).toBe(400);
  });

  it("resident can list messages", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get("/api/messages")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("manager can list messages for their building", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get("/api/messages")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("manager list is scoped to their building", async () => {
    const { managerUser, building } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "Other", address: "Else 20" },
    });
    await prisma.message.create({
      data: { buildingId: building.id, title: "Mine", content: "Yes" },
    });
    await prisma.message.create({
      data: { buildingId: otherBuilding.id, title: "Other", content: "No" },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get("/api/messages")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(
      res.body.every(
        (m: { buildingId: string }) => m.buildingId === building.id,
      ),
    ).toBe(true);
  });

  it("resident list is scoped to their building", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "Other", address: "Else 21" },
    });
    await prisma.message.create({
      data: { buildingId: building.id, title: "Mine", content: "Yes" },
    });
    await prisma.message.create({
      data: { buildingId: otherBuilding.id, title: "Other", content: "No" },
    });

    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get("/api/messages")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(
      res.body.every(
        (m: { buildingId: string }) => m.buildingId === building.id,
      ),
    ).toBe(true);
  });

  it("manager can get message by id", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const created = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Notice", content: "Hello" });

    const res = await request(app)
      .get(`/api/messages/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("resident can get message by id in their building", async () => {
    const { managerUser, residentUser, building, apartment } = await seedCore();
    const managerToken = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });
    const created = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ title: "Notice", content: "Hello" });

    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get(`/api/messages/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("resident cannot access message from another building", async () => {
    const { managerUser, residentUser, building, apartment } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "Other", address: "Else 9" },
    });
    const otherManager = await prisma.user.create({
      data: {
        phone: `05${Date.now()}${Math.floor(Math.random() * 90 + 10)}`,
        name: "Other Manager",
      },
    });
    await prisma.manager.create({
      data: { userId: otherManager.id, buildingId: otherBuilding.id },
    });

    const otherToken = signToken({
      userId: otherManager.id,
      sessionType: SessionType.MANAGER,
      buildingId: otherBuilding.id,
    });

    const created = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "Other", content: "Nope" });

    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get(`/api/messages/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("manager cannot access message from another building", async () => {
    const { managerUser, building } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "Other", address: "Else 22" },
    });
    const message = await prisma.message.create({
      data: { buildingId: otherBuilding.id, title: "Other", content: "No" },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/messages/${message.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("admin can delete message", async () => {
    const { admin, managerUser, building } = await seedCore();
    const managerToken = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const created = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ title: "To delete", content: "Bye" });

    const adminToken = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .delete(`/api/messages/${created.body.data.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it("manager cannot delete message", async () => {
    const { managerUser, building } = await seedCore();
    const managerToken = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const created = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ title: "To delete", content: "Bye" });

    const res = await request(app)
      .delete(`/api/messages/${created.body.data.id}`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(403);
  });

  it("resident cannot delete message", async () => {
    const { residentUser, managerUser, building, apartment } = await seedCore();
    const managerToken = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });
    const created = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ title: "To delete", content: "Bye" });

    const residentToken = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .delete(`/api/messages/${created.body.data.id}`)
      .set("Authorization", `Bearer ${residentToken}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 for unknown message id", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/messages/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 when deleting unknown message", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .delete(`/api/messages/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
