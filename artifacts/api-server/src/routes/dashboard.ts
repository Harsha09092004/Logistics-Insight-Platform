import { Router, type IRouter } from "express";
import { db, invoicesTable, shipmentsTable, vendorsTable, discrepanciesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  try {
    const invoiceStats = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(case when ${invoicesTable.status} = 'pending' then 1 end)::int`,
        disputed: sql<number>`count(case when ${invoicesTable.status} = 'disputed' then 1 end)::int`,
        overdue: sql<number>`count(case when ${invoicesTable.status} = 'overdue' then 1 end)::int`,
        matched: sql<number>`count(case when ${invoicesTable.status} = 'matched' then 1 end)::int`,
        amountPending: sql<number>`coalesce(sum(case when ${invoicesTable.status} = 'pending' then ${invoicesTable.amount}::numeric else 0 end), 0)`,
        amountDisputed: sql<number>`coalesce(sum(case when ${invoicesTable.status} = 'disputed' then ${invoicesTable.amount}::numeric else 0 end), 0)`,
        amountOverdue: sql<number>`coalesce(sum(case when ${invoicesTable.status} = 'overdue' then ${invoicesTable.amount}::numeric else 0 end), 0)`,
      })
      .from(invoicesTable);

    const shipmentStats = await db
      .select({
        active: sql<number>`count(case when ${shipmentsTable.status} = 'in_transit' then 1 end)::int`,
        delayed: sql<number>`count(case when ${shipmentsTable.status} = 'delayed' then 1 end)::int`,
      })
      .from(shipmentsTable);

    const vendorCount = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(vendorsTable);

    const discrepancyCount = await db
      .select({ open: sql<number>`count(*)::int` })
      .from(discrepanciesTable)
      .where(eq(discrepanciesTable.status, "open"));

    const stats = invoiceStats[0];
    const ships = shipmentStats[0];
    const totalInvoices = stats.total;
    const matchedInvoices = stats.matched;
    const reconciliationRate = totalInvoices > 0 ? Math.round((matchedInvoices / totalInvoices) * 100) : 0;

    res.json({
      totalInvoices,
      pendingInvoices: stats.pending,
      disputedInvoices: stats.disputed,
      overdueInvoices: stats.overdue,
      totalAmountPending: parseFloat(String(stats.amountPending)),
      totalAmountDisputed: parseFloat(String(stats.amountDisputed)),
      totalAmountOverdue: parseFloat(String(stats.amountOverdue)),
      reconciliationRate,
      openDiscrepancies: discrepancyCount[0].open,
      totalVendors: vendorCount[0].total,
      activeShipments: ships.active,
      delayedShipments: ships.delayed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

router.get("/trends", async (req, res) => {
  try {
    const { period = "month" } = req.query;
    const allowedUnits = ["week", "month", "quarter"];
    const truncateUnit = allowedUnits.includes(period as string) ? (period as string) : "month";

    const { pool } = await import("@workspace/db");
    const query = `
      SELECT
        to_char(date_trunc('${truncateUnit}', invoice_date::date), 'YYYY-MM-DD') as period,
        coalesce(sum(amount::numeric), 0) as "totalFreightCost",
        count(*)::int as "invoiceCount",
        coalesce(avg(amount::numeric), 0) as "avgInvoiceAmount",
        coalesce(
          count(case when status = 'disputed' then 1 end)::float / nullif(count(*), 0),
          0
        ) as "disputeRate"
      FROM invoices
      WHERE invoice_date::date >= current_date - interval '12 months'
      GROUP BY date_trunc('${truncateUnit}', invoice_date::date)
      ORDER BY date_trunc('${truncateUnit}', invoice_date::date) ASC
    `;

    const result = await pool.query(query);
    res.json(result.rows.map((r: any) => ({
      period: r.period,
      totalFreightCost: parseFloat(r.totalFreightCost),
      invoiceCount: r.invoiceCount,
      avgInvoiceAmount: parseFloat(r.avgInvoiceAmount),
      disputeRate: parseFloat(r.disputeRate),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trends" });
  }
});

export default router;
