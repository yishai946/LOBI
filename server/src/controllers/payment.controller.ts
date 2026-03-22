import { Request, Response } from "express";
import * as paymentService from "../services/payment.service";
import { HttpError } from "../utils/HttpError";
import {
  parseEnumQueryParam,
  parsePaginationQuery,
  parseSortOrderQuery,
} from "../utils/pagination";

const paymentFilterValues = [
  "all",
  "pending",
  "paid",
  "overdue",
  "upcoming",
  "recentPaid",
] as const;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const createPayment = async (req: Request, res: Response) => {
  const { payment } = await paymentService.createPayment(req.user, req.body);

  return res.status(201).json({
    message: "Payment created successfully",
    payment,
  });
};

export const getPayments = async (req: Request, res: Response) => {
  const buildingId = req.query.buildingId as string | undefined;
  const pagination = parsePaginationQuery(req.query);
  const sort = parseSortOrderQuery(req.query.sort);
  const filter = parseEnumQueryParam(
    req.query.filter,
    "filter",
    paymentFilterValues,
  );
  const payments = await paymentService.getPayments(
    req.user,
    buildingId,
    pagination,
    {
      sortByDueAt: sort,
      filter,
    },
  );

  res.json(payments);
};

export const getPaymentById = async (req: Request, res: Response) => {
  const payment = await paymentService.getPaymentById(
    req.user,
    req.params.paymentId as string,
  );

  res.json(payment);
};

export const updatePayment = async (req: Request, res: Response) => {
  const payment = await paymentService.updatePayment(
    req.user,
    req.params.paymentId as string,
    req.body,
  );

  res.json({
    message: "Payment updated successfully",
    payment,
  });
};

export const deletePayment = async (req: Request, res: Response) => {
  const payment = await paymentService.deletePayment(
    req.user,
    req.params.paymentId as string,
  );

  res.json({
    message: "Payment deleted successfully",
    payment,
  });
};

export const getMyPayments = async (req: Request, res: Response) => {
  const pagination = parsePaginationQuery(req.query);
  const sort = parseSortOrderQuery(req.query.sort);
  const filter = parseEnumQueryParam(
    req.query.filter,
    "filter",
    paymentFilterValues,
  );
  const payments = await paymentService.getMyPayments(req.user, pagination, {
    sortByDueAt: sort,
    filter,
  });

  res.json(payments);
};

export const getMyNextPayment = async (req: Request, res: Response) => {
  const nextPayment = await paymentService.getMyNextPayment(req.user);

  res.json(nextPayment);
};

export const getPaymentAssignments = async (req: Request, res: Response) => {
  const pagination = parsePaginationQuery(req.query);
  const assignments = await paymentService.getAssignmentsForPayment(
    req.user,
    req.params.paymentId as string,
    pagination,
  );

  res.json(assignments);
};

export const createCheckoutSession = async (req: Request, res: Response) => {
  const result = await paymentService.createCheckoutSession(
    req.user,
    req.params.assignmentId as string,
    req.body,
    req.headers.origin as string | undefined,
  );

  res.json(result);
};

export const createPayAllCheckoutSession = async (
  req: Request,
  res: Response,
) => {
  const result = await paymentService.createPayAllCheckoutSession(
    req.user,
    req.headers.origin as string | undefined,
  );

  res.json(result);
};

export const paymentWebhook = async (req: Request, res: Response) => {
  const signatureHeader = paymentService.getPaymentWebhookSignatureHeader();
  const signature = req.headers[signatureHeader];

  if (!signature || Array.isArray(signature)) {
    throw new HttpError("חתימת Stripe חסרה", 400);
  }

  const event = paymentService.constructPaymentWebhookEvent(
    req.body,
    signature,
  );

  if (event.type === "checkout.session.completed") {
    const session = event.session;

    if (!session) {
      throw new HttpError("אירוע תשלום חסר פרטי session", 400);
    }

    const assignmentIds = session.metadata?.assignmentIds;

    if (session.metadata?.payAll === "true" && assignmentIds) {
      await paymentService.markAssignmentsPaid(
        assignmentIds.split(",").filter(Boolean),
        session.metadata?.userId,
      );
    } else {
      await paymentService.markAssignmentPaid(
        session.id,
        session.metadata?.userId,
      );
    }
  }

  res.json({ received: true });
};

export const getPublicReceipt = async (req: Request, res: Response) => {
  const sessionId = req.query.session_id as string | undefined;
  const shouldDownload = req.query.download === "1";

  if (!sessionId) {
    throw new HttpError("נדרש session_id", 400);
  }

  const receipt = await paymentService.getCustomReceiptBySessionId(sessionId);

  const issueDate = new Date(receipt.issueDateIso).toLocaleString("he-IL");
  const paidAt = receipt.paidAtIso
    ? new Date(receipt.paidAtIso).toLocaleString("he-IL")
    : "";

  const rows = [
    {
      label: "שירות",
      value: receipt.paymentTitle,
    },
    {
      label: "תיאור",
      value: receipt.paymentDescription || "תשלום ועד בית",
    },
    {
      label: "בניין",
      value: `${receipt.buildingName}, ${receipt.buildingAddress}`,
    },
    {
      label: "דירה",
      value: receipt.apartmentName,
    },
    {
      label: "אמצעי תשלום",
      value: paymentService.getReceiptPaymentMethodLabel(),
    },
    {
      label: "אסמכתא",
      value: receipt.stripeSessionId,
    },
  ]
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.label)}</td>
          <td>${escapeHtml(item.value)}</td>
        </tr>
      `,
    )
    .join("");

  const html = `
    <!doctype html>
    <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>קבלה ${escapeHtml(receipt.receiptNumber)}</title>
        <style>
          :root {
            --ink: #0f172a;
            --muted: #475569;
            --line: #d1d5db;
            --panel: #ffffff;
            --surface: #f4f7fb;
            --accent: #0f766e;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: radial-gradient(circle at 10% 0%, #e8f3ff 0%, var(--surface) 38%, #eef2f7 100%);
            color: var(--ink);
            font-family: "Assistant", "Segoe UI", Arial, sans-serif;
            padding: 32px 14px;
          }
          .sheet {
            max-width: 860px;
            margin: 0 auto;
            background: var(--panel);
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 18px 44px rgba(15, 23, 42, 0.11);
          }
          .head {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            background: linear-gradient(130deg, #0f766e 0%, #0ea5a4 55%, #7dd3fc 100%);
            color: #fff;
            padding: 22px;
          }
          .title {
            margin: 0;
            font-size: 30px;
            font-weight: 800;
          }
          .subtitle { margin-top: 6px; opacity: 0.92; font-size: 14px; }
          .meta { text-align: left; }
          .meta-line { margin: 4px 0; font-size: 14px; }
          .meta-line strong { font-weight: 700; }
          .body { padding: 24px; }
          .cols {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 18px;
          }
          .card {
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 14px;
            background: #ffffff;
          }
          .card h3 { margin: 0 0 10px; font-size: 16px; }
          .kv { margin: 6px 0; color: var(--muted); font-size: 14px; }
          .kv strong { color: var(--ink); }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            overflow: hidden;
            border: 1px solid var(--line);
            border-radius: 12px;
          }
          th, td {
            border-bottom: 1px solid var(--line);
            padding: 11px 12px;
            font-size: 14px;
            text-align: right;
            vertical-align: top;
          }
          th { background: #f8fafc; }
          tr:last-child td { border-bottom: 0; }
          .total {
            margin-top: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #ecfeff;
            border: 1px solid #99f6e4;
            border-radius: 12px;
            padding: 12px 14px;
            font-size: 18px;
            font-weight: 800;
            color: #115e59;
          }
          .foot {
            margin-top: 14px;
            color: #334155;
            font-size: 12px;
            line-height: 1.7;
          }
          @media (max-width: 720px) {
            .head { grid-template-columns: 1fr; }
            .meta { text-align: right; }
            .cols { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <article class="sheet">
          <header class="head">
            <div>
              <h1 class="title">קבלה</h1>
              <div class="subtitle">מסמך ממוחשב עבור תשלום ועד בית</div>
            </div>
            <div class="meta">
              <div class="meta-line"><strong>מספר קבלה:</strong> ${escapeHtml(receipt.receiptNumber)}</div>
              <div class="meta-line"><strong>תאריך הפקה:</strong> ${escapeHtml(issueDate)}</div>
              <div class="meta-line"><strong>סטטוס:</strong> שולם</div>
            </div>
          </header>

          <section class="body">
            <div class="cols">
              <section class="card">
                <h3>פרטי העסק</h3>
                <div class="kv"><strong>${escapeHtml(receipt.businessType)}:</strong> ${escapeHtml(receipt.businessName)}</div>
                <div class="kv"><strong>מספר מזהה:</strong> ${escapeHtml(receipt.businessId)}</div>
                <div class="kv"><strong>כתובת:</strong> ${escapeHtml(receipt.businessAddress)}</div>
                <div class="kv"><strong>טלפון:</strong> ${escapeHtml(receipt.businessPhone || "לא צוין")}</div>
                <div class="kv"><strong>אימייל:</strong> ${escapeHtml(receipt.businessEmail || "לא צוין")}</div>
              </section>
              <section class="card">
                <h3>פרטי המשלם</h3>
                <div class="kv"><strong>שם:</strong> ${escapeHtml(receipt.payerName)}</div>
                <div class="kv"><strong>טלפון:</strong> ${escapeHtml(receipt.payerPhone || "לא צוין")}</div>
                <div class="kv"><strong>מועד תשלום:</strong> ${escapeHtml(paidAt || issueDate)}</div>
              </section>
            </div>

            <table>
              <thead>
                <tr>
                  <th>שדה</th>
                  <th>ערך</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div class="total">
              <span>סה"כ לתשלום</span>
              <span>${escapeHtml(receipt.formattedAmount)}</span>
            </div>

            <div class="foot">
              המסמך הופק אוטומטית ממערכת לובי ומהווה אסמכתא על תשלום שהתקבל.<br />
              לשאלות על החיוב ניתן לפנות להנהלת הבניין לפי פרטי העסק המופיעים מעלה.
            </div>
          </section>
        </article>
      </body>
    </html>
  `;

  if (shouldDownload) {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="receipt-${receipt.receiptNumber}.html"`,
    );
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
};
