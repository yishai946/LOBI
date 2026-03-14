import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";
import { resetDb } from "./db";
import { seedCore, signToken } from "./helpers";
import { SessionType } from "../src/enums/sessionType.enum";

describe("Apartment routes", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("manager can create apartment in their building", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/apartments")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "A2", buildingId: building.id });

    expect(res.status).toBe(201);
  });

  it("admin can create apartment", async () => {
    const { admin, building } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .post("/api/apartments")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "A3", buildingId: building.id });

    expect(res.status).toBe(201);
  });

  it("resident cannot list apartments", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get("/api/apartments")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("admin can list all apartments", async () => {
    const { admin } = await seedCore();
    const token = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .get("/api/apartments")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("manager can list apartments in their building", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get("/api/apartments")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("manager can get apartment by id in their building", async () => {
    const { managerUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/apartments/${apartment.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(apartment.id);
  });

  it("manager cannot get apartment by id in another building", async () => {
    const { managerUser, building } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "B4", address: "Else 6" },
    });
    const otherApartment = await prisma.apartment.create({
      data: { name: "Apt B4", buildingId: otherBuilding.id },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/apartments/${otherApartment.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("manager can update apartment in their building", async () => {
    const { managerUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .patch(`/api/apartments/${apartment.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Apt Updated" });

    expect(res.status).toBe(200);
    expect(res.body.apartment.name).toBe("Apt Updated");
  });

  it("manager cannot update apartment in another building", async () => {
    const { managerUser, building } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "B2", address: "Else 2" },
    });
    const otherApartment = await prisma.apartment.create({
      data: { name: "Apt B2", buildingId: otherBuilding.id },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .patch(`/api/apartments/${otherApartment.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Blocked" });

    expect(res.status).toBe(403);
  });

  it("manager can delete apartment in their building", async () => {
    const { managerUser, building } = await seedCore();
    const apartment = await prisma.apartment.create({
      data: { name: "Empty Apt", buildingId: building.id },
    });
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .delete(`/api/apartments/${apartment.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("manager cannot delete apartment in another building", async () => {
    const { managerUser, building } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "B3", address: "Else 4" },
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
      .delete(`/api/apartments/${otherApartment.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 when apartment is not found", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/apartments/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 when updating missing apartment", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .patch(`/api/apartments/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Missing" });

    expect(res.status).toBe(404);
  });

  it("returns 404 when deleting missing apartment", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .delete(`/api/apartments/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("validates apartment payload on create", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/apartments")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "", buildingId: building.id });

    expect(res.status).toBe(400);
  });

  it("validates apartment payload on update", async () => {
    const { managerUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .patch(`/api/apartments/${apartment.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "" });

    expect(res.status).toBe(400);
  });

  it("rejects duplicate apartment name in same building", async () => {
    const { managerUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/apartments")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: apartment.name, buildingId: building.id });

    expect(res.status).toBe(400);
  });
});
