import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";
import { resetDb } from "./db";
import { seedCore, signToken } from "./helpers";
import { SessionType } from "../src/enums/sessionType.enum";

describe("Resident routes", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("manager can list residents in their building", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get("/api/residents")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("admin can list all residents", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .get("/api/residents")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("resident cannot access resident list", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get("/api/residents")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("manager can create resident for apartment", async () => {
    const { managerUser, building, apartment } = await seedCore();
    const newUser = await prisma.user.create({
      data: {
        phone: `05${Date.now()}${Math.floor(Math.random() * 90 + 10)}`,
        name: "New Resident",
      },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/residents")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: newUser.id, apartmentId: apartment.id });

    expect(res.status).toBe(201);
  });

  it("manager cannot create resident for another building apartment", async () => {
    const { managerUser, building } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "Other", address: "Else 7" },
    });
    const otherApartment = await prisma.apartment.create({
      data: { name: "Apt Other", buildingId: otherBuilding.id },
    });
    const newUser = await prisma.user.create({
      data: {
        phone: `05${Date.now()}${Math.floor(Math.random() * 90 + 10)}`,
        name: "Cross Resident",
      },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/residents")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: newUser.id, apartmentId: otherApartment.id });

    expect(res.status).toBe(403);
  });

  it("manager can update resident apartment", async () => {
    const { managerUser, building, resident } = await seedCore();
    const otherApartment = await prisma.apartment.create({
      data: { name: "Apt 2", buildingId: building.id },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .patch(`/api/residents/${resident.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ apartmentId: otherApartment.id });

    expect(res.status).toBe(200);
  });

  it("manager can get resident by id", async () => {
    const { managerUser, building, resident } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/residents/${resident.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(resident.id);
  });

  it("manager cannot get resident by id from another building", async () => {
    const { managerUser, building } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "Other", address: "Else 13" },
    });
    const otherApartment = await prisma.apartment.create({
      data: { name: "Other Apt", buildingId: otherBuilding.id },
    });
    const otherUser = await prisma.user.create({
      data: {
        phone: `05${Date.now()}${Math.floor(Math.random() * 90 + 10)}`,
        name: "Other Resident",
      },
    });
    const otherResident = await prisma.resident.create({
      data: { userId: otherUser.id, apartmentId: otherApartment.id },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/residents/${otherResident.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("resident cannot get resident by id", async () => {
    const { residentUser, building, apartment, resident } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get(`/api/residents/${resident.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("manager cannot update resident to another building", async () => {
    const { managerUser, building, resident } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "Other", address: "Else 3" },
    });
    const otherApartment = await prisma.apartment.create({
      data: { name: "Apt O", buildingId: otherBuilding.id },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .patch(`/api/residents/${resident.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ apartmentId: otherApartment.id });

    expect(res.status).toBe(403);
  });

  it("manager can delete resident in their building", async () => {
    const { managerUser, building, resident } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .delete(`/api/residents/${resident.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("manager cannot delete resident in another building", async () => {
    const { managerUser, building } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "Other", address: "Else 14" },
    });
    const otherApartment = await prisma.apartment.create({
      data: { name: "Other Apt", buildingId: otherBuilding.id },
    });
    const otherUser = await prisma.user.create({
      data: {
        phone: `05${Date.now()}${Math.floor(Math.random() * 90 + 10)}`,
        name: "Delete Other",
      },
    });
    const otherResident = await prisma.resident.create({
      data: { userId: otherUser.id, apartmentId: otherApartment.id },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .delete(`/api/residents/${otherResident.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 when resident is not found", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/residents/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 when updating missing resident", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .patch(`/api/residents/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ apartmentId: crypto.randomUUID() });

    expect(res.status).toBe(404);
  });

  it("returns 404 when deleting missing resident", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .delete(`/api/residents/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("validates resident payload on create", async () => {
    const { managerUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/residents")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: "bad", apartmentId: apartment.id });

    expect(res.status).toBe(400);
  });

  it("validates resident payload on update", async () => {
    const { managerUser, building, resident } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .patch(`/api/residents/${resident.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ apartmentId: "bad" });

    expect(res.status).toBe(400);
  });
});
