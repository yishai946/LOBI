import { Prisma } from "../generated/prisma/client";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("Seeding the database...");

  // 1. Create users (Admin, Manager, Residents)
  const adminUser = await prisma.user.create({
    data: {
      phone: "0500000001",
      name: "מנהל מערכת",
      role: "ADMIN",
      isActive: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      phone: "0500000002",
      name: "ישראל ישראלי",
      role: "USER",
      isActive: true,
    },
  });

  const resident1 = await prisma.user.create({
    data: {
      phone: "0500000003",
      name: "אבי כהן",
      role: "USER",
      isActive: true,
    },
  });

  const resident2 = await prisma.user.create({
    data: {
      phone: "0500000004",
      name: "רונית לוי",
      role: "USER",
      isActive: true,
    },
  });
  console.log("Created users");

  // 2. Create a building
  const building = await prisma.building.create({
    data: {
      name: "מגדלי השמש",
      address: "רחוב הרצל 10, תל אביב",
    },
  });
  console.log(`Created building: ${building.name}`);

  // 3. Assign manager to building
  await prisma.manager.create({
    data: {
      userId: managerUser.id,
      buildingId: building.id,
    },
  });
  console.log(`Assigned ${managerUser.name} as manager`);

  // 4. Create apartments
  const apt1 = await prisma.apartment.create({
    data: {
      name: "דירה 101",
      buildingId: building.id,
    },
  });

  const apt2 = await prisma.apartment.create({
    data: {
      name: "דירה 102",
      buildingId: building.id,
    },
  });

  const apt3 = await prisma.apartment.create({
    data: {
      name: "דירה 103",
      buildingId: building.id,
    },
  });
  console.log("Created apartments");

  // 5. Assign residents to apartments
  await prisma.resident.create({
    data: {
      userId: resident1.id,
      apartmentId: apt1.id,
    },
  });

  await prisma.resident.create({
    data: {
      userId: resident2.id,
      apartmentId: apt2.id,
    },
  });
  console.log("Assigned residents");

  // 6. Create some messages (announcements)
  const message1 = await prisma.message.create({
    data: {
      buildingId: building.id,
      title: "הפסקת מים מחר",
      content:
        "מחר בין השעות 10:00 ל-14:00 תהיה הפסקת מים בעקבות עבודות תשתית. נא להיערך בהתאם.",
      isUrgent: true,
      isPinned: true,
      createdById: managerUser.id,
      createdByContextType: "MANAGER",
    },
  });

  const message2 = await prisma.message.create({
    data: {
      buildingId: building.id,
      title: "אסיפת דיירים",
      content:
        "ביום שלישי הקרוב תתקיים אסיפת דיירים בלובי הבניין בשעה 20:00. נוכחותכם חשובה.",
      isUrgent: false,
      isPinned: false,
      createdById: managerUser.id,
      createdByContextType: "MANAGER",
    },
  });
  console.log("Created messages");

  // 8. Create some issues
  const issue1 = await prisma.issue.create({
    data: {
      buildingId: building.id,
      title: "נזילה בלובי",
      description: "יש נזילה מהתקרה באזור המעליות.",
      isUrgent: true,
      status: "open",
      createdById: resident1.id,
      createdByContextType: "RESIDENT",
    },
  });

  const issue2 = await prisma.issue.create({
    data: {
      buildingId: building.id,
      title: "מנורה שרופה בקומה 2",
      description: "המנורה במסדרון לא דולקת.",
      isUrgent: false,
      status: "inProgress",
      createdById: resident2.id,
      createdByContextType: "RESIDENT",
    },
  });
  console.log("Created issues");

  // 9. Create a payment
  const payment = await prisma.payment.create({
    data: {
      buildingId: building.id,
      title: "ועד בית - חודש מרץ",
      description: "תשלום שוטף ועד בית",
      amount: new Prisma.Decimal("350.00"),
      currency: "ILS",
      dueAt: new Date(new Date().setDate(new Date().getDate() + 7)),
      isRecurring: false,
    },
  });

  // Assign payment to apartments
  await prisma.paymentAssignment.createMany({
    data: [
      {
        paymentId: payment.id,
        apartmentId: apt1.id,
        status: "PENDING",
      },
      {
        paymentId: payment.id,
        apartmentId: apt2.id,
        status: "PAID",
        paidAt: new Date(),
        paidById: resident2.id,
      },
      {
        paymentId: payment.id,
        apartmentId: apt3.id,
        status: "PENDING",
      },
    ],
  });
  console.log("Created payments and assignments");

  // 9. Generate some notifications manually to simulate the system
  await prisma.notification.createMany({
    data: [
      {
        userId: resident1.id,
        buildingId: building.id,
        type: "NEW_MESSAGE",
        title: `הודעה חדשה: ${message1.title}`,
        referenceId: message1.id,
        referenceType: "message",
        isRead: false,
      },
      {
        userId: resident1.id,
        buildingId: building.id,
        type: "NEW_PAYMENT",
        title: `תשלום חדש: ${payment.title}`,
        referenceId: payment.id,
        referenceType: "payment",
        isRead: false,
      },
      {
        userId: managerUser.id,
        buildingId: building.id,
        type: "NEW_MESSAGE",
        title: `הודעה חדשה: ${message2.title}`,
        referenceId: message2.id,
        referenceType: "message",
        isRead: true, // manager read it
        readAt: new Date(),
      },
      {
        userId: resident2.id,
        buildingId: building.id,
        type: "ISSUE_STATUS_CHANGED",
        title: `סטטוס תקלה עודכן: ${issue2.title} → בטיפול`,
        referenceId: issue2.id,
        referenceType: "issue",
        isRead: false,
      },
    ],
  });
  console.log("Created notifications");

  console.log("✅ Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("BIG ERROR:");
    console.error(e.message);
    if (e.cause) console.error("CAUSE:", JSON.stringify(e.cause, null, 2));
    if (e.code) console.error("CODE:", e.code);
    if (e.meta) console.error("META:", e.meta);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
