import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";
import { resetDb } from "./db";
import { seedCore, signToken } from "./helpers";
import { SessionType } from "../src/enums/sessionType.enum";

const uniquePhone = () =>
  `05${Math.floor(10000000 + Math.random() * 90000000)}`;

describe("User routes", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("get /users/me returns current user", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(residentUser.id);
  });

  it("admin can list users", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("user can update own profile", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Name" });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("New Name");
  });

  it("admin can get user by id", async () => {
    const { admin, residentUser } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .get(`/api/users/${residentUser.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(residentUser.id);
  });

  it("non-admin cannot list users", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("non-admin cannot get user by id", async () => {
    const { managerUser, building, residentUser } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/users/${residentUser.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("admin can delete user", async () => {
    const { admin } = await seedCore();
    const residentUser = await prisma.user.create({
      data: {
        phone: `05${Date.now()}${Math.floor(Math.random() * 90 + 10)}`,
        name: "Delete Me",
      },
    });
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .delete(`/api/users/${residentUser.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("manager can create resident via /users/resident", async () => {
    const { managerUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/users/resident")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: uniquePhone(), apartmentId: apartment.id });

    expect(res.status).toBe(201);
    expect(res.body.resident).toBeDefined();
  });

  it("non-manager cannot create resident via /users/resident", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .post("/api/users/resident")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: uniquePhone(), apartmentId: apartment.id });

    expect(res.status).toBe(403);
  });

  it("validates payload for /users/resident", async () => {
    const { managerUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/users/resident")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: "123", apartmentId: apartment.id });

    expect(res.status).toBe(400);
  });

  it("returns 404 when apartment is not found in /users/resident", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/users/resident")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: uniquePhone(), apartmentId: crypto.randomUUID() });

    expect(res.status).toBe(404);
  });

  it("manager cannot create resident in another building via /users/resident", async () => {
    const { managerUser, building } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "Other", address: "Else 5" },
    });
    const otherApartment = await prisma.apartment.create({
      data: { name: "Apt Other", buildingId: otherBuilding.id },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/users/resident")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: uniquePhone(), apartmentId: otherApartment.id });

    expect(res.status).toBe(403);
  });

  it("admin can create manager via /users/manager", async () => {
    const { admin, building } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/users/manager")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: uniquePhone(), buildingId: building.id });

    expect(res.status).toBe(201);
    expect(res.body.manager).toBeDefined();
  });

  it("non-admin cannot create manager via /users/manager", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/users/manager")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: uniquePhone(), buildingId: building.id });

    expect(res.status).toBe(403);
  });

  it("validates payload for /users/manager", async () => {
    const { admin, building } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/users/manager")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: "bad", buildingId: building.id });

    expect(res.status).toBe(400);
  });

  it("returns 404 when building is not found in /users/manager", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/users/manager")
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: uniquePhone(), buildingId: crypto.randomUUID() });

    expect(res.status).toBe(404);
  });
});
