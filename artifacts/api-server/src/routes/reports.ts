import { Router, type IRouter } from "express";
import { db, invoicesTable, vendorsTable, shipmentsTable, paymentsTable, discrepanciesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/aging", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        i.id as "invoiceId",
        i.invoice_number as "invoiceNumber",
        v.name as "vendorName",
        i.amount::numeric as amount,
        i.due_date as "dueDate",
        GREATEST(0, CURRENT_DATE - i.due_date::date) as "daysOverdue",
        CASE
          WHEN CURRENT_DATE <= i.due_date::date THEN 'current'
          WHEN CURRENT_DATE - i.due_date::date <= 30 THEN '0-30'
          WHEN CURRENT_DATE - i.due_date::date <= 60 THEN '31-60'
          WHEN CURRENT_DATE - i.due_date::date <= 90 THEN '61-90'
          ELSE '90+'
        END as bucket
      FROM invoices i
      LEFT JOIN vendors v ON v.id = i.vendor_id
      WHERE i.status IN ('pending', 'disputed', 'overdue')
      ORDER BY "daysOverdue" DESC
    `);

    const details = result.rows.map((r: any) => ({
      invoiceId: r.invoiceId,
      invoiceNumber: r.invoiceNumber,
      vendorName: r.vendorName,
      amount: parseFloat(r.amount),
      dueDate: r.dueDate,
      daysOverdue: parseInt(r.daysOverdue),
      bucket: r.bucket,
    }));

    const makeBucket = (bucketName: string) => {
      const items = details.filter(d => d.bucket === bucketName);
      const amount = items.reduce((s, d) => s + d.amount, 0);
      return { count: items.length, amount, percentage: 0 };
    };

    const current = makeBucket("current");
    const days30 = makeBucket("0-30");
    const days60 = makeBucket("31-60");
    const days90 = makeBucket("61-90");
    const over90 = makeBucket("90+");
    const totalOutstanding = current.amount + days30.amount + days60.amount + days90.amount + over90.amount;

    const pct = (a: number) => totalOutstanding > 0 ? Math.round((a / totalOutstanding) * 100) : 0;
    current.percentage = pct(current.amount);
    days30.percentage = pct(days30.amount);
    days60.percentage = pct(days60.amount);
    days90.percentage = pct(days90.amount);
    over90.percentage = pct(over90.amount);

    res.json({ current, days30, days60, days90, over90, totalOutstanding, details });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate aging report" });
  }
});

router.get("/gst", async (req, res) => {
  try {
    const { month } = req.query;
    const monthFilter = month ? `'${month}-01'` : `date_trunc('month', CURRENT_DATE)::text`;

    const result = await pool.query(`
      SELECT
        v.id as "vendorId",
        v.name as "vendorName",
        v.gstin,
        COUNT(i.id)::int as "invoiceCount",
        COALESCE(SUM(i.freight_charges::numeric + COALESCE(i.fuel_surcharge::numeric, 0) + COALESCE(i.other_charges::numeric, 0)), 0) as "taxableAmount",
        COALESCE(SUM(i.gst_amount::numeric), 0) as "gstAmount",
        COALESCE(SUM(i.tds_amount::numeric), 0) as "tdsAmount",
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT i.hsn_code), NULL) as "hsnCodes"
      FROM invoices i
      JOIN vendors v ON v.id = i.vendor_id
      WHERE date_trunc('month', i.invoice_date::date) = date_trunc('month', ${monthFilter}::date)
      GROUP BY v.id, v.name, v.gstin
      ORDER BY "taxableAmount" DESC
    `);

    const gstBreakdown = result.rows.map((r: any) => ({
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      gstin: r.gstin,
      invoiceCount: r.invoiceCount,
      taxableAmount: parseFloat(r.taxableAmount),
      gstAmount: parseFloat(r.gstAmount),
      tdsAmount: parseFloat(r.tdsAmount),
      hsnCodes: r.hsnCodes || [],
    }));

    const totals = gstBreakdown.reduce((acc, r) => ({
      taxable: acc.taxable + r.taxableAmount,
      gst: acc.gst + r.gstAmount,
      tds: acc.tds + r.tdsAmount,
      count: acc.count + r.invoiceCount,
    }), { taxable: 0, gst: 0, tds: 0, count: 0 });

    const reportMonth = month || new Date().toISOString().substring(0, 7);

    res.json({
      month: reportMonth,
      totalTaxableAmount: totals.taxable,
      totalGstCollected: totals.gst,
      totalTdsDeducted: totals.tds,
      invoiceCount: totals.count,
      gstBreakdown,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate GST report" });
  }
});

router.get("/vendor-performance", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        v.id as "vendorId",
        v.name as "vendorName",
        v.category,
        COUNT(DISTINCT i.id)::int as "totalInvoices",
        COALESCE(SUM(i.amount::numeric), 0) as "totalAmount",
        COALESCE(AVG(i.amount::numeric), 0) as "avgInvoiceAmount",
        COALESCE(
          COUNT(CASE WHEN i.status = 'disputed' THEN 1 END)::float / NULLIF(COUNT(i.id), 0),
          0
        ) as "disputeRate",
        COALESCE(SUM(CASE WHEN i.status IN ('pending','overdue','disputed') THEN i.amount::numeric ELSE 0 END), 0) as "overdueAmount",
        COUNT(DISTINCT s.id)::int as "totalShipments",
        COUNT(CASE WHEN s.status = 'delivered' AND s.actual_delivery <= s.scheduled_delivery THEN 1 END)::int as "onTimeDeliveries",
        COALESCE(AVG(CASE WHEN s.status = 'delayed' THEN EXTRACT(DAY FROM (CURRENT_DATE - s.scheduled_delivery::date)) END), 0) as "avgDelayDays"
      FROM vendors v
      LEFT JOIN invoices i ON i.vendor_id = v.id
      LEFT JOIN shipments s ON s.vendor_id = v.id
      GROUP BY v.id, v.name, v.category
      ORDER BY "totalAmount" DESC
    `);

    const rows = result.rows.map((r: any) => {
      const totalShipments = r.totalShipments || 0;
      const onTimeRate = totalShipments > 0 ? r.onTimeDeliveries / totalShipments : 0;
      const disputeRate = parseFloat(r.disputeRate) || 0;
      const avgDelay = parseFloat(r.avgDelayDays) || 0;
      const performanceScore = Math.max(0, Math.min(100,
        Math.round((onTimeRate * 40) + ((1 - disputeRate) * 40) + (Math.max(0, 20 - avgDelay * 2)))
      ));

      return {
        vendorId: r.vendorId,
        vendorName: r.vendorName,
        category: r.category,
        totalInvoices: r.totalInvoices,
        totalAmount: parseFloat(r.totalAmount),
        avgInvoiceAmount: parseFloat(r.avgInvoiceAmount),
        disputeRate,
        onTimeDeliveryRate: onTimeRate,
        avgDelayDays: avgDelay,
        overdueAmount: parseFloat(r.overdueAmount),
        performanceScore,
      };
    });

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate vendor performance report" });
  }
});

router.get("/export/invoices", async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = `
      SELECT
        i.invoice_number as "Invoice Number",
        v.name as "Vendor",
        v.gstin as "GSTIN",
        i.status as "Status",
        i.invoice_date as "Invoice Date",
        i.due_date as "Due Date",
        i.amount as "Total Amount (INR)",
        i.freight_charges as "Freight Charges",
        i.fuel_surcharge as "Fuel Surcharge",
        i.gst_amount as "GST Amount",
        i.tds_amount as "TDS Amount",
        i.hsn_code as "HSN Code",
        i.currency as "Currency",
        i.description as "Description"
      FROM invoices i
      LEFT JOIN vendors v ON v.id = i.vendor_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIdx = 1;
    if (status) { query += ` AND i.status = $${paramIdx++}`; params.push(status); }
    if (startDate) { query += ` AND i.invoice_date >= $${paramIdx++}`; params.push(startDate); }
    if (endDate) { query += ` AND i.invoice_date <= $${paramIdx++}`; params.push(endDate); }
    query += " ORDER BY i.invoice_date DESC";

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=invoices.csv");
      return res.send("No data found");
    }

    const headers = Object.keys(result.rows[0]);
    const csvRows = [
      headers.join(","),
      ...result.rows.map((row: any) =>
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = String(val);
          return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(",")
      ),
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=freightflow-invoices.csv");
    res.send(csvRows.join("\n"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export invoices" });
  }
});

export default router;
