import prisma from "../src/lib/prisma";

export const resetDb = async () => {
  await prisma.paymentWebhookEvent.deleteMany();
  await prisma.issueImage.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.message.deleteMany();
  await prisma.paymentAssignment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.resident.deleteMany();
  await prisma.manager.deleteMany();
  await prisma.apartment.deleteMany();
  await prisma.building.deleteMany();
  await prisma.user.deleteMany();
};
