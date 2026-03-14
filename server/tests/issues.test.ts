import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";
import { resetDb } from "./db";
import { seedCore, signToken } from "./helpers";
import { SessionType } from "../src/enums/sessionType.enum";
import crypto from "crypto";

jest.mock("../src/services/s3.service", () => ({
  generateUploadUrls: async () => [
    {
      key: "issues/building/apartment/00000000-0000-0000-0000-000000000000.jpg",
      uploadUrl: "https://s3.test/upload",
    },
  ],
}));

describe("Issue routes", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("resident can generate upload URLs", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .post("/api/issues/upload-urls")
      .set("Authorization", `Bearer ${token}`)
      .send({ files: [{ filename: "a.jpg", contentType: "image/jpeg" }] });

    expect(res.status).toBe(200);
    expect(res.body.uploads.length).toBe(1);
  });

  it("manager cannot generate upload URLs", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/issues/upload-urls")
      .set("Authorization", `Bearer ${token}`)
      .send({ files: [{ filename: "a.jpg", contentType: "image/jpeg" }] });

    expect(res.status).toBe(403);
  });

  it("resident can create issue with keys", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const key = `issues/${building.id}/${apartment.id}/00000000-0000-0000-0000-000000000000.jpg`;
    const res = await request(app)
      .post("/api/issues")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Leak", imageKeys: [key] });

    expect(res.status).toBe(201);
  });

  it("resident cannot create issue with mismatched image key", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const key = `issues/other/${apartment.id}/00000000-0000-0000-0000-000000000000.jpg`;
    const res = await request(app)
      .post("/api/issues")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Leak", imageKeys: [key] });

    expect(res.status).toBe(400);
  });

  it("resident cannot request more than 3 upload URLs", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .post("/api/issues/upload-urls")
      .set("Authorization", `Bearer ${token}`)
      .send({
        files: [
          { filename: "1.jpg", contentType: "image/jpeg" },
          { filename: "2.jpg", contentType: "image/jpeg" },
          { filename: "3.jpg", contentType: "image/jpeg" },
          { filename: "4.jpg", contentType: "image/jpeg" },
        ],
      });

    expect(res.status).toBe(400);
  });

  it("manager can create issue for apartment", async () => {
    const { managerUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/issues")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Manager issue", apartmentId: apartment.id });

    expect(res.status).toBe(201);
  });

  it("resident can list issues in their building", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const key = `issues/${building.id}/${apartment.id}/00000000-0000-0000-0000-000000000000.jpg`;
    await prisma.issue.create({
      data: {
        title: "Leak",
        buildingId: building.id,
        apartmentId: apartment.id,
        createdById: residentUser.id,
        images: { create: [{ imageKey: key }] },
      },
    });

    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get("/api/issues")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("manager can get issue by id in their building", async () => {
    const { managerUser, building, apartment } = await seedCore();
    const issue = await prisma.issue.create({
      data: {
        title: "Manager view",
        buildingId: building.id,
        apartmentId: apartment.id,
        createdById: managerUser.id,
      },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/issues/${issue.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(issue.id);
  });

  it("resident cannot get issue from another building", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "Other", address: "Else 23" },
    });
    const otherApartment = await prisma.apartment.create({
      data: { name: "Other Apt", buildingId: otherBuilding.id },
    });
    const issue = await prisma.issue.create({
      data: {
        title: "Other issue",
        buildingId: otherBuilding.id,
        apartmentId: otherApartment.id,
        createdById: residentUser.id,
      },
    });

    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get(`/api/issues/${issue.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("resident can update their issue", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const issue = await prisma.issue.create({
      data: {
        title: "Old",
        buildingId: building.id,
        apartmentId: apartment.id,
        createdById: residentUser.id,
      },
    });

    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .patch(`/api/issues/${issue.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated" });

    expect(res.status).toBe(200);
  });

  it("resident cannot update another user's issue", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const otherUser = await prisma.user.create({
      data: {
        phone: `05${Date.now()}${Math.floor(Math.random() * 90 + 10)}`,
        name: "Other",
      },
    });
    const issue = await prisma.issue.create({
      data: {
        title: "Other",
        buildingId: building.id,
        apartmentId: apartment.id,
        createdById: otherUser.id,
      },
    });

    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .patch(`/api/issues/${issue.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Blocked" });

    expect(res.status).toBe(403);
  });

  it("manager cannot update issue in another building", async () => {
    const { managerUser, building } = await seedCore();
    const otherBuilding = await prisma.building.create({
      data: { name: "Other", address: "Else 24" },
    });
    const otherApartment = await prisma.apartment.create({
      data: { name: "Other Apt", buildingId: otherBuilding.id },
    });
    const issue = await prisma.issue.create({
      data: {
        title: "Cross",
        buildingId: otherBuilding.id,
        apartmentId: otherApartment.id,
        createdById: managerUser.id,
      },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .patch(`/api/issues/${issue.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Blocked" });

    expect(res.status).toBe(403);
  });

  it("manager can delete issue in their building", async () => {
    const { managerUser, building, apartment } = await seedCore();
    const issue = await prisma.issue.create({
      data: {
        title: "Remove",
        buildingId: building.id,
        apartmentId: apartment.id,
        createdById: managerUser.id,
      },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .delete(`/api/issues/${issue.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("resident can delete their own issue", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const issue = await prisma.issue.create({
      data: {
        title: "My issue",
        buildingId: building.id,
        apartmentId: apartment.id,
        createdById: residentUser.id,
      },
    });

    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .delete(`/api/issues/${issue.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("resident cannot delete another user's issue", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const otherUser = await prisma.user.create({
      data: {
        phone: `05${Date.now()}${Math.floor(Math.random() * 90 + 10)}`,
        name: "Other",
      },
    });
    const issue = await prisma.issue.create({
      data: {
        title: "Other issue",
        buildingId: building.id,
        apartmentId: apartment.id,
        createdById: otherUser.id,
      },
    });

    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .delete(`/api/issues/${issue.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 when issue is not found", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/issues/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 when updating unknown issue", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .patch(`/api/issues/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Missing" });

    expect(res.status).toBe(404);
  });

  it("returns 404 when deleting unknown issue", async () => {
    const { managerUser, building } = await seedCore();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .delete(`/api/issues/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("validates issue payload on create", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .post("/api/issues")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "" });

    expect(res.status).toBe(400);
  });

  it("validates issue payload on update", async () => {
    const { residentUser, building, apartment } = await seedCore();
    const issue = await prisma.issue.create({
      data: {
        title: "Old",
        buildingId: building.id,
        apartmentId: apartment.id,
        createdById: residentUser.id,
      },
    });
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .patch(`/api/issues/${issue.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "" });

    expect(res.status).toBe(400);
  });
});
