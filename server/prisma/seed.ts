import { Prisma } from "../generated/prisma/client";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("Seeding the database with comprehensive test data...\n");

  // ============================================================================
  // 1. CREATE USERS (different roles and statuses for edge case testing)
  // ============================================================================
  console.log("📝 Creating users...");

  const adminUser = await prisma.user.create({
    data: {
      phone: "0500000001",
      name: "מנהל מערכת",
      role: "ADMIN",
      isActive: true,
      notifyOnMessages: true,
      notifyOnIssues: true,
      notifyOnPayments: true,
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      phone: "0500000002",
      name: "ישראל ישראלי - מנהל בניין",
      role: "USER",
      isActive: true,
      notifyOnMessages: true,
      notifyOnIssues: true,
      notifyOnPayments: true,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      phone: "0500000099",
      name: "מרים כהן - מנהלת בניין 2",
      role: "USER",
      isActive: true,
    },
  });

  // Residents with different notification preferences
  const resident1 = await prisma.user.create({
    data: {
      phone: "0500000003",
      name: "אבי כהן",
      role: "USER",
      isActive: true,
      notifyOnMessages: true,
      notifyOnIssues: false,
      notifyOnPayments: true,
    },
  });

  const resident2 = await prisma.user.create({
    data: {
      phone: "0500000004",
      name: "רונית לוי",
      role: "USER",
      isActive: true,
      notifyOnMessages: false,
      notifyOnIssues: true,
      notifyOnPayments: true,
    },
  });

  const resident3 = await prisma.user.create({
    data: {
      phone: "0500000005",
      name: "דניאל גורן",
      role: "USER",
      isActive: true,
      notifyOnMessages: true,
      notifyOnIssues: true,
      notifyOnPayments: false,
    },
  });

  const resident4 = await prisma.user.create({
    data: {
      phone: "0500000006",
      name: "שרה נתן",
      role: "USER",
      isActive: true,
    },
  });

  // Inactive user - for testing soft deletes/filtering
  const inactiveUser = await prisma.user.create({
    data: {
      phone: "0500000007",
      name: "משה מופקד (משתמש לא פעיל)",
      role: "USER",
      isActive: false,
    },
  });

  console.log("✅ Created 7 users (1 admin, 2 managers, 4 residents)\n");

  // ============================================================================
  // 2. CREATE BUILDINGS (multiple buildings for multi-building scenarios)
  // ============================================================================
  console.log("📝 Creating buildings...");

  const building1 = await prisma.building.create({
    data: {
      name: "מגדלי השמש - בניין A",
      address: "רחוב הרצל 10, תל אביב",
      logoUrl: "https://example.com/logo-a.png",
    },
  });

  const building2 = await prisma.building.create({
    data: {
      name: "מגדלי השמש - בניין B",
      address: "רחוב דיזנגוף 50, תל אביב",
      logoUrl: "https://example.com/logo-b.png",
    },
  });

  console.log("✅ Created 2 buildings\n");

  // ============================================================================
  // 3. CREATE MANAGERS & ASSIGN TO BUILDINGS
  // ============================================================================
  console.log("📝 Assigning managers to buildings...");

  await prisma.manager.create({
    data: { userId: manager1.id, buildingId: building1.id },
  });

  await prisma.manager.create({
    data: { userId: manager2.id, buildingId: building2.id },
  });

  console.log("✅ Assigned managers to buildings\n");

  // ============================================================================
  // 4. CREATE APARTMENTS (various scenarios)
  // ============================================================================
  console.log("📝 Creating apartments...");

  // Building 1 apartments
  const apt1_1 = await prisma.apartment.create({
    data: { name: "דירה 101", buildingId: building1.id },
  });

  const apt1_2 = await prisma.apartment.create({
    data: { name: "דירה 102", buildingId: building1.id },
  });

  const apt1_3 = await prisma.apartment.create({
    data: { name: "דירה 103", buildingId: building1.id },
  });

  const apt1_4 = await prisma.apartment.create({
    data: { name: "דירה 201", buildingId: building1.id },
  });

  const apt1_5 = await prisma.apartment.create({
    data: { name: "דירה 202", buildingId: building1.id },
  });

  // Building 2 apartments
  const apt2_1 = await prisma.apartment.create({
    data: { name: "דירה 1", buildingId: building2.id },
  });

  const apt2_2 = await prisma.apartment.create({
    data: { name: "דירה 2", buildingId: building2.id },
  });

  console.log("✅ Created 7 apartments (5 in building 1, 2 in building 2)\n");

  // ============================================================================
  // 5. ASSIGN RESIDENTS TO APARTMENTS
  // ============================================================================
  console.log("📝 Assigning residents to apartments...");

  await prisma.resident.create({
    data: { userId: resident1.id, apartmentId: apt1_1.id },
  });

  await prisma.resident.create({
    data: { userId: resident2.id, apartmentId: apt1_2.id },
  });

  await prisma.resident.create({
    data: { userId: resident3.id, apartmentId: apt1_3.id },
  });

  await prisma.resident.create({
    data: { userId: resident4.id, apartmentId: apt2_1.id },
  });

  // apt1_4, apt1_5, apt2_2 are unassigned (empty apartments)

  console.log("✅ Assigned 4 residents. Left 3 apartments empty for testing\n");

  // ============================================================================
  // 6. CREATE MESSAGES (different types, urgency, and states)
  // ============================================================================
  console.log("📝 Creating messages...");

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const msg1 = await prisma.message.create({
    data: {
      buildingId: building1.id,
      title: "🚨 הפסקת מים חירום",
      content:
        "מחר בין השעות 10:00 ל-14:00 תהיה הפסקת מים בעקבות תקלה בתשתית. נא להיערך בהתאם.",
      isUrgent: true,
      isPinned: true,
      createdById: manager1.id,
      createdByContextType: "MANAGER",
    },
  });

  const msg2 = await prisma.message.create({
    data: {
      buildingId: building1.id,
      title: "אסיפת דיירים",
      content:
        "ביום שלישי הקרוב תתקיים אסיפת דיירים בלובי הבניין בשעה 20:00. אנא הרשמו מראש.",
      isUrgent: false,
      isPinned: false,
      createdById: manager1.id,
      createdByContextType: "MANAGER",
      createdAt: yesterday,
    },
  });

  const msg3 = await prisma.message.create({
    data: {
      buildingId: building1.id,
      title: "קריאה לתנדבויות",
      content: "אנחנו מחפשים דיירים להשתתפות בוועדות הבניין",
      isUrgent: false,
      isPinned: false,
      createdById: manager1.id,
      createdByContextType: "MANAGER",
      createdAt: twoDaysAgo,
    },
  });

  const msg4 = await prisma.message.create({
    data: {
      buildingId: building1.id,
      title: "הודעה מדייר",
      content: "האם יש מישהו שיכול לעזור במעליון?",
      isUrgent: false,
      isPinned: false,
      createdById: resident1.id,
      createdByContextType: "RESIDENT",
    },
  });

  const msg5 = await prisma.message.create({
    data: {
      buildingId: building2.id,
      title: "ברוכים הבאים לבניין B",
      content: "זו הודעת ברוכים הבאים לתושבי הבניין החדש",
      isUrgent: false,
      isPinned: true,
      createdById: manager2.id,
      createdByContextType: "MANAGER",
    },
  });

  console.log("✅ Created 5 messages (2 urgent, 3 normal)\n");

  // ============================================================================
  // 7. CREATE ISSUES (all statuses with proper timestamps)
  // ============================================================================
  console.log("📝 Creating issues with all statuses...");

  const issue1 = await prisma.issue.create({
    data: {
      buildingId: building1.id,
      title: "🔴 נזילה חמורה בלובי",
      description: "יש נזילה גדולה מהתקרה באזור המעליות",
      isUrgent: true,
      status: "open",
      openedAt: twoDaysAgo,
      createdById: resident1.id,
      createdByContextType: "RESIDENT",
      createdAt: twoDaysAgo,
    },
  });

  const issue2 = await prisma.issue.create({
    data: {
      buildingId: building1.id,
      title: "מנורה שרופה בקומה 2",
      description: "המנורה במסדרון קומה 2 לא דולקת",
      isUrgent: false,
      status: "inProgress",
      openedAt: yesterday,
      inProgressAt: yesterday,
      createdById: resident2.id,
      createdByContextType: "RESIDENT",
      createdAt: yesterday,
    },
  });

  const issue3 = await prisma.issue.create({
    data: {
      buildingId: building1.id,
      title: "תקלה בדלת כניסה - แก้已修复",
      description: "דלת הכניסה לא נסגרת כמו שצריך - תוקנה",
      isUrgent: false,
      status: "done",
      openedAt: twoDaysAgo,
      inProgressAt: yesterday,
      doneAt: now,
      createdById: resident3.id,
      createdByContextType: "RESIDENT",
      createdAt: twoDaysAgo,
    },
  });

  const issue4 = await prisma.issue.create({
    data: {
      buildingId: building2.id,
      title: "🔴 תקלה בחשמל",
      description: "אין זרם חשמל בקומה 1",
      isUrgent: true,
      status: "open",
      openedAt: yesterday,
      createdById: resident4.id,
      createdByContextType: "RESIDENT",
      createdAt: yesterday,
    },
  });

  console.log(
    "✅ Created 4 issues (statuses: 2 open, 1 in progress, 1 done)\n",
  );

  // ============================================================================
  // 8. CREATE ISSUE IMAGES (for issue with attachments testing)
  // ============================================================================
  console.log("📝 Creating issue images...");

  await prisma.issueImage.createMany({
    data: [
      { issueId: issue1.id, imageKey: "issues/issue1/photo1.jpg" },
      { issueId: issue1.id, imageKey: "issues/issue1/photo2.jpg" },
      { issueId: issue2.id, imageKey: "issues/issue2/photo1.jpg" },
    ],
  });

  console.log("✅ Created 3 issue images\n");

  // ============================================================================
  // 9. CREATE PAYMENTS (all statuses and scenarios)
  // ============================================================================
  console.log("📝 Creating payments with various statuses...");

  const dueToday = new Date(new Date().setHours(23, 59, 59, 999));
  const dueTomorrow = new Date(
    new Date().getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000,
  );
  const dueNextWeek = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
  const dueLastWeek = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);

  // Regular payments (not recurring)
  const payment1 = await prisma.payment.create({
    data: {
      buildingId: building1.id,
      title: "ועד בית - חודש אפריל",
      description: "תשלום שוטף ועד בית",
      amount: new Prisma.Decimal("350.00"),
      currency: "ILS",
      dueAt: dueTomorrow,
      isRecurring: false,
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      buildingId: building1.id,
      title: "תיקון דירות - קצה בניין",
      description: "עבודות תיקון בקניון הבניין",
      amount: new Prisma.Decimal("500.00"),
      currency: "ILS",
      dueAt: dueNextWeek,
      isRecurring: false,
    },
  });

  // Overdue payment (for testing overdue filtering)
  const paymentOverdue = await prisma.payment.create({
    data: {
      buildingId: building1.id,
      title: "ועד בית - חודש מרץ (עתיק)",
      description: "תשלום שוטף ועד בית",
      amount: new Prisma.Decimal("350.00"),
      currency: "ILS",
      dueAt: dueLastWeek,
      isRecurring: false,
    },
  });

  const payment2_building = await prisma.payment.create({
    data: {
      buildingId: building2.id,
      title: "בדיקת מעליון",
      description: "בדיקה תקופתית של המעליון",
      amount: new Prisma.Decimal("150.00"),
      currency: "ILS",
      dueAt: dueToday,
      isRecurring: false,
    },
  });

  console.log("✅ Created 4 payments\n");

  // ============================================================================
  // 10. CREATE PAYMENT ASSIGNMENTS (different states)
  // ============================================================================
  console.log("📝 Creating payment assignments with all states...");

  // Payment 1: PENDING, PAID, PENDING
  await prisma.paymentAssignment.createMany({
    data: [
      {
        paymentId: payment1.id,
        apartmentId: apt1_1.id,
        status: "PENDING",
      },
      {
        paymentId: payment1.id,
        apartmentId: apt1_2.id,
        status: "PAID",
        paidAt: yesterday,
        paidById: resident2.id,
      },
      {
        paymentId: payment1.id,
        apartmentId: apt1_3.id,
        status: "PENDING",
      },
    ],
  });

  // Payment 2: mix of statuses
  await prisma.paymentAssignment.createMany({
    data: [
      {
        paymentId: payment2.id,
        apartmentId: apt1_1.id,
        status: "PENDING",
      },
      {
        paymentId: payment2.id,
        apartmentId: apt1_2.id,
        status: "PENDING",
      },
      {
        paymentId: payment2.id,
        apartmentId: apt1_3.id,
        status: "PENDING",
      },
    ],
  });

  // Overdue payment
  await prisma.paymentAssignment.createMany({
    data: [
      {
        paymentId: paymentOverdue.id,
        apartmentId: apt1_1.id,
        status: "PENDING",
      },
      {
        paymentId: paymentOverdue.id,
        apartmentId: apt1_2.id,
        status: "PAID",
        paidAt: dueLastWeek,
        paidById: resident2.id,
      },
    ],
  });

  // Payment 2 in building 2
  await prisma.paymentAssignment.createMany({
    data: [
      {
        paymentId: payment2_building.id,
        apartmentId: apt2_1.id,
        status: "PENDING",
      },
      {
        paymentId: payment2_building.id,
        apartmentId: apt2_2.id,
        status: "PENDING",
      },
    ],
  });

  console.log("✅ Created payment assignments in various states\n");

  // ============================================================================
  // 11. CREATE RECURRING PAYMENT SERIES (different statuses)
  // ============================================================================
  console.log("📝 Creating recurring payment series...");

  const recurringActive = await prisma.recurringPaymentSeries.create({
    data: {
      buildingId: building1.id,
      createdById: manager1.id,
      title: "בדיקה תקופתית מעליון - חודשי",
      description: "בדיקה חודשית של המעליון",
      amount: new Prisma.Decimal("150.00"),
      currency: "ILS",
      cadence: "MONTHLY",
      anchorDay: 5, // 5th of each month
      startsAt: new Date("2026-01-05"),
      status: "ACTIVE",
    },
  });

  const recurringPaused = await prisma.recurringPaymentSeries.create({
    data: {
      buildingId: building1.id,
      createdById: manager1.id,
      title: "ביטוח בניין - מושהה",
      description: "פרמיה חודשית לביטוח הבניין",
      amount: new Prisma.Decimal("800.00"),
      currency: "ILS",
      cadence: "MONTHLY",
      anchorDay: 15,
      startsAt: new Date("2026-02-15"),
      status: "PAUSED",
    },
  });

  const recurringEnded = await prisma.recurringPaymentSeries.create({
    data: {
      buildingId: building1.id,
      createdById: manager1.id,
      title: "פרויקט תיקון - סיים",
      description: "חיוב חודשי לפרויקט התיקונים",
      amount: new Prisma.Decimal("200.00"),
      currency: "ILS",
      cadence: "MONTHLY",
      anchorDay: 20,
      startsAt: new Date("2025-11-20"),
      endsAt: new Date("2026-03-20"),
      status: "ENDED",
    },
  });

  const recurringBuilding2 = await prisma.recurringPaymentSeries.create({
    data: {
      buildingId: building2.id,
      createdById: manager2.id,
      title: "דמי ניהול - בניין B",
      description: "דמי ניהול חודשיים",
      amount: new Prisma.Decimal("400.00"),
      currency: "ILS",
      cadence: "MONTHLY",
      anchorDay: 1,
      startsAt: new Date("2026-01-01"),
      status: "ACTIVE",
    },
  });

  console.log(
    "✅ Created 4 recurring series (statuses: ACTIVE, PAUSED, ENDED)\n",
  );

  // ============================================================================
  // 12. CREATE RECURRING ENROLLMENTS (different statuses and scenarios)
  // ============================================================================
  console.log("📝 Creating recurring payment enrollments...");

  // Active enrollments
  await prisma.recurringPaymentEnrollment.createMany({
    data: [
      {
        seriesId: recurringActive.id,
        apartmentId: apt1_1.id,
        residentId: resident1.id,
        status: "ACTIVE",
        autoPayEnabledAt: yesterday,
        nextBillingAt: now,
        lastChargedAt: yesterday,
      },
      {
        seriesId: recurringActive.id,
        apartmentId: apt1_2.id,
        residentId: resident2.id,
        status: "ACTIVE",
        autoPayEnabledAt: twoDaysAgo,
        nextBillingAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Paused enrollments
  await prisma.recurringPaymentEnrollment.create({
    data: {
      seriesId: recurringPaused.id,
      apartmentId: apt1_3.id,
      residentId: resident3.id,
      status: "PAUSED",
    },
  });

  // Canceled enrollments
  await prisma.recurringPaymentEnrollment.create({
    data: {
      seriesId: recurringEnded.id,
      apartmentId: apt1_1.id,
      residentId: resident1.id,
      status: "CANCELED",
    },
  });

  // Building 2 enrollments
  await prisma.recurringPaymentEnrollment.create({
    data: {
      seriesId: recurringBuilding2.id,
      apartmentId: apt2_1.id,
      residentId: resident4.id,
      status: "ACTIVE",
      autoPayEnabledAt: twoDaysAgo,
    },
  });

  console.log(
    "✅ Created 5 recurring enrollments (statuses: ACTIVE, PAUSED, CANCELED)\n",
  );

  // ============================================================================
  // 13. CREATE UPGRADE REQUESTS (different requests from different users)
  // ============================================================================
  console.log("📝 Creating upgrade requests...");

  await prisma.upgradeRequest.createMany({
    data: [
      {
        buildingId: building1.id,
        residentId: resident1.id,
        featureRequested: "DIGITAL_PAYMENTS",
      },
      {
        buildingId: building1.id,
        residentId: resident3.id,
        featureRequested: "DIGITAL_PAYMENTS",
      },
      {
        buildingId: building2.id,
        residentId: resident4.id,
        featureRequested: "DIGITAL_PAYMENTS",
      },
    ],
  });

  console.log("✅ Created 3 upgrade requests\n");

  // ============================================================================
  // 14. CREATE NOTIFICATIONS (all types, read/unread states)
  // ============================================================================
  console.log("📝 Creating notifications...");

  await prisma.notification.createMany({
    data: [
      // NEW_MESSAGE notifications
      {
        userId: resident1.id,
        buildingId: building1.id,
        type: "NEW_MESSAGE",
        title: `הודעה חדשה: ${msg1.title}`,
        body: "יש הודעה חדשה בבניין",
        referenceId: msg1.id,
        referenceType: "message",
        isRead: false,
      },
      {
        userId: resident2.id,
        buildingId: building1.id,
        type: "NEW_MESSAGE",
        title: `הודעה חדשה: ${msg1.title}`,
        referenceId: msg1.id,
        referenceType: "message",
        isRead: true,
        readAt: yesterday,
      },

      // ISSUE_STATUS_CHANGED notifications
      {
        userId: resident1.id,
        buildingId: building1.id,
        type: "ISSUE_STATUS_CHANGED",
        title: `סטטוס תקלה עודכן: "${issue1.title}" → פתוח`,
        referenceId: issue1.id,
        referenceType: "issue",
        isRead: false,
      },
      {
        userId: manager1.id,
        buildingId: building1.id,
        type: "ISSUE_STATUS_CHANGED",
        title: `סטטוס תקלה עודכן: "${issue2.title}" → בטיפול`,
        referenceId: issue2.id,
        referenceType: "issue",
        isRead: false,
      },
      {
        userId: manager1.id,
        buildingId: building1.id,
        type: "ISSUE_STATUS_CHANGED",
        title: `סטטוס תקלה עודכן: "${issue3.title}" → הסתיים`,
        referenceId: issue3.id,
        referenceType: "issue",
        isRead: true,
        readAt: yesterday,
      },

      // NEW_PAYMENT notifications
      {
        userId: resident1.id,
        buildingId: building1.id,
        type: "NEW_PAYMENT",
        title: `תשלום חדש: ${payment1.title}`,
        body: "יש תשלום חדש שחייב עליו",
        referenceId: payment1.id,
        referenceType: "payment",
        isRead: false,
      },
      {
        userId: resident2.id,
        buildingId: building1.id,
        type: "NEW_PAYMENT",
        title: `תשלום חדש: ${payment1.title}`,
        referenceId: payment1.id,
        referenceType: "payment",
        isRead: true,
        readAt: yesterday,
      },

      // PAYMENT_REMINDER notifications
      {
        userId: resident1.id,
        buildingId: building1.id,
        type: "PAYMENT_REMINDER",
        title: `תזכורת תשלום: ${paymentOverdue.title}`,
        body: "התשלום חייב זמן וממתין לתשלום",
        referenceId: paymentOverdue.id,
        referenceType: "payment",
        isRead: false,
      },

      // UPGRADE_REQUEST notifications
      {
        userId: manager1.id,
        buildingId: building1.id,
        type: "UPGRADE_REQUEST",
        title: `בקשת שדרוג: בקשה לתכונה ממישהו מהדיירים`,
        body: "דייר מבקש תכונה חדשה",
        isRead: false,
      },
    ],
  });

  console.log("✅ Created 11 notifications (read & unread)\n");

  // ============================================================================
  // 15. CREATE WEBHOOK EVENTS (for testing webhook reconciliation)
  // ============================================================================
  console.log("📝 Creating webhook test data...");

  const webhookEvent1 = await prisma.paymentWebhookEvent.create({
    data: {
      provider: "stripe",
      eventId: "evt_test_001",
      eventType: "charge.succeeded",
      status: "PROCESSED",
      deliveryCount: 1,
      receivedAt: yesterday,
      processedAt: yesterday,
    },
  });

  const webhookEvent2 = await prisma.paymentWebhookEvent.create({
    data: {
      provider: "stripe",
      eventId: "evt_test_002",
      eventType: "charge.failed",
      status: "PROCESSING",
      deliveryCount: 1,
      receivedAt: now,
    },
  });

  const webhookEvent3 = await prisma.paymentWebhookEvent.create({
    data: {
      provider: "stripe",
      eventId: "evt_test_003",
      eventType: "payment_intent.canceled",
      status: "FAILED",
      deliveryCount: 3,
      receivedAt: twoDaysAgo,
      errorMessage: "Max retries exceeded",
    },
  });

  console.log("✅ Created 3 webhook events\n");

  // ============================================================================
  // 16. CREATE WEBHOOK RECONCILIATION ATTEMPTS
  // ============================================================================
  console.log("📝 Creating webhook reconciliation attempts...");

  await prisma.webhookReconciliationAttempt.createMany({
    data: [
      {
        webhookEventId: webhookEvent1.id,
        provider: "stripe",
        eventId: "evt_test_001",
        attemptNumber: 1,
        status: "SUCCESS",
        attemptedAt: yesterday,
      },
      {
        webhookEventId: webhookEvent2.id,
        provider: "stripe",
        eventId: "evt_test_002",
        attemptNumber: 1,
        status: "PENDING",
        nextAttemptAt: new Date(now.getTime() + 60 * 60 * 1000),
        attemptedAt: now,
      },
      {
        webhookEventId: webhookEvent3.id,
        provider: "stripe",
        eventId: "evt_test_003",
        attemptNumber: 1,
        status: "FAILED",
        errorMessage: "Connection timeout",
        attemptedAt: twoDaysAgo,
      },
      {
        webhookEventId: webhookEvent3.id,
        provider: "stripe",
        eventId: "evt_test_003",
        attemptNumber: 2,
        status: "FAILED",
        errorMessage: "Connection timeout",
        attemptedAt: new Date(twoDaysAgo.getTime() + 30 * 60 * 1000),
      },
      {
        webhookEventId: webhookEvent3.id,
        provider: "stripe",
        eventId: "evt_test_003",
        attemptNumber: 3,
        status: "FAILED",
        errorMessage: "Max retries exceeded",
        attemptedAt: new Date(twoDaysAgo.getTime() + 60 * 60 * 1000),
      },
    ],
  });

  console.log("✅ Created webhook reconciliation attempts\n");

  // ============================================================================
  // 17. CREATE WEBHOOK METRICS (for analytics)
  // ============================================================================
  console.log("📝 Creating webhook metrics...");

  await prisma.webhookMetrics.create({
    data: {
      date: new Date(now.toISOString().split("T")[0]),
      provider: "stripe",
      eventType: "charge.succeeded",
      totalReceived: 10,
      totalSucceeded: 8,
      totalFailed: 2,
      totalReconciled: 10,
      avgProcessingTimeMs: 1250,
    },
  });

  await prisma.webhookMetrics.create({
    data: {
      date: new Date(yesterday.toISOString().split("T")[0]),
      provider: "stripe",
      eventType: "charge.failed",
      totalReceived: 3,
      totalSucceeded: 1,
      totalFailed: 2,
      totalReconciled: 3,
      avgProcessingTimeMs: 2500,
    },
  });

  console.log("✅ Created webhook metrics\n");

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(80));
  console.log("\n📊 SEED DATA SUMMARY:");
  console.log("   • Users: 7 (1 admin, 2 managers, 4 residents)");
  console.log("   • Buildings: 2");
  console.log("   • Apartments: 7 (4 with residents, 3 empty)");
  console.log("   • Messages: 5");
  console.log("   • Issues: 4 (all 3 statuses, 3 with images)");
  console.log("   • Payments: 4 (various states and due dates)");
  console.log("   • Payment Assignments: 9");
  console.log("   • Recurring Series: 4 (ACTIVE, PAUSED, ENDED)");
  console.log("   • Recurring Enrollments: 5");
  console.log("   • Upgrade Requests: 3");
  console.log("   • Notifications: 11 (read & unread)");
  console.log("   • Webhook Events: 3");
  console.log("   • Webhook Reconciliation Attempts: 5");
  console.log("   • Webhook Metrics: 2");
  console.log("\n🧪 EDGE CASES INCLUDED:");
  console.log("   ✓ Inactive users (for filtering)");
  console.log("   ✓ Empty apartments (no residents)");
  console.log("   ✓ Overdue payments & payment reminders");
  console.log("   ✓ All issue statuses with timestamps");
  console.log("   ✓ All notification types (read & unread)");
  console.log("   ✓ Recurring payments in all states");
  console.log("   ✓ Multi-building scenarios");
  console.log("   ✓ Webhook failures & retry scenarios");
  console.log("   ✓ Different user notification preferences");
  console.log(`\n⏰ Seed completed at: ${new Date().toLocaleString()}\n`);
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
