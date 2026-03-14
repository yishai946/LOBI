import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";
import { resetDb } from "./db";
import { seedCore, signToken } from "./helpers";
import { SessionType } from "../src/enums/sessionType.enum";

describe("Building routes", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("admin can create building", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/buildings")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "B1", address: "Main 1" });

    expect(res.status).toBe(201);
    expect(res.body.building.name).toBe("B1");
  });

  it("manager cannot create building", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/buildings")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "B2", address: "Main 2" });

    expect(res.status).toBe(403);
  });

  it("admin can update building", async () => {
    const { admin, building } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .patch(`/api/buildings/${building.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.building.name).toBe("Updated");
  });

  it("admin can delete building", async () => {
    const { admin } = await seedCore();
    const building = await prisma.building.create({
      data: { name: "Solo", address: "No deps" },
    });
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .delete(`/api/buildings/${building.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const existing = await prisma.building.findUnique({
      where: { id: building.id },
    });
    expect(existing).toBeNull();
  });

  it("admin can list buildings", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .get("/api/buildings")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("resident cannot list buildings", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get("/api/buildings")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("manager can get their building by id", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/buildings/${building.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(building.id);
  });

  it("admin can get building by id", async () => {
    const { admin, building } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .get(`/api/buildings/${building.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(building.id);
  });

  it("manager cannot access another building", async () => {
    const { managerUser, building } = await seedCore();
    const other = await prisma.building.create({
      data: { name: "Other", address: "Else 2" },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/buildings/${other.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("manager cannot update building", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .patch(`/api/buildings/${building.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nope" });

    expect(res.status).toBe(403);
  });

  it("resident cannot update building", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .patch(`/api/buildings/${building.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nope" });

    expect(res.status).toBe(403);
  });

  it("manager cannot delete building", async () => {
    const { managerUser, building } = await seedCore();
    const target = await prisma.building.create({
      data: { name: "Target", address: "Else 10" },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .delete(`/api/buildings/${target.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("resident cannot delete building", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const target = await prisma.building.create({
      data: { name: "Target", address: "Else 11" },
    });

    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .delete(`/api/buildings/${target.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 when building is not found", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .get(`/api/buildings/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 when updating missing building", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .patch(`/api/buildings/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Missing" });

    expect(res.status).toBe(404);
  });

  it("returns 404 when deleting missing building", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .delete(`/api/buildings/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("validates building payload on create", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/buildings")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Bad", address: "123" });

    expect(res.status).toBe(400);
  });

  it("validates building payload on update", async () => {
    const { admin, building } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .patch(`/api/buildings/${building.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ address: "bad" });

    expect(res.status).toBe(400);
  });
});
