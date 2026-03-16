import { Router, type IRouter } from "express";
import { db, vendorsTable, invoicesTable, pool } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const vendors = await db
      .select({
        id: vendorsTable.id,
        name: vendorsTable.name,
        gstin: vendorsTable.gstin,
        contactEmail: vendorsTable.contactEmail,
        contactPhone: vendorsTable.contactPhone,
        address: vendorsTable.address,
        paymentTermsDays: vendorsTable.paymentTermsDays,
        category: vendorsTable.category,
        createdAt: vendorsTable.createdAt,
        totalInvoices: sql<number>`count(${invoicesTable.id})::int`,
        totalAmountDue: sql<number>`coalesce(sum(case when ${invoicesTable.status} in ('pending','overdue','disputed') then ${invoicesTable.amount}::numeric else 0 end), 0)`,
      })
      .from(vendorsTable)
      .leftJoin(invoicesTable, eq(invoicesTable.vendorId, vendorsTable.id))
      .groupBy(vendorsTable.id);

    res.json(vendors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, id));
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

router.post("/", async (req, res) => {
  const { name, gstin, contactEmail, contactPhone, address, paymentTermsDays, category } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: "name and category are required" });
  }
  try {
    const [vendor] = await db
      .insert(vendorsTable)
      .values({ name, gstin, contactEmail, contactPhone, address, paymentTermsDays: paymentTermsDays ?? 30, category })
      .returning();
    res.status(201).json(vendor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create vendor" });
  }
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, gstin, contactEmail, contactPhone, address, paymentTermsDays } = req.body;
  try {
    const [vendor] = await db
      .update(vendorsTable)
      .set({ name, gstin, contactEmail, contactPhone, address, paymentTermsDays, updatedAt: new Date() })
      .where(eq(vendorsTable.id, id))
      .returning();
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: "Failed to update vendor" });
  }
});

router.get("/:id/performance", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query(`
      SELECT
        v.id as "vendorId",
        v.name as "vendorName",
        v.category,
        COUNT(DISTINCT i.id)::int as "totalInvoices",
        COALESCE(SUM(i.amount::numeric), 0) as "totalAmount",
        COALESCE(AVG(i.amount::numeric), 0) as "avgInvoiceAmount",
        COALESCE(COUNT(CASE WHEN i.status = 'disputed' THEN 1 END)::float / NULLIF(COUNT(i.id), 0), 0) as "disputeRate",
        COALESCE(SUM(CASE WHEN i.status IN ('pending','overdue','disputed') THEN i.amount::numeric ELSE 0 END), 0) as "overdueAmount",
        COUNT(DISTINCT s.id)::int as "totalShipments",
        COUNT(CASE WHEN s.status = 'delivered' AND s.actual_delivery <= s.scheduled_delivery THEN 1 END)::int as "onTimeDeliveries",
        COALESCE(AVG(CASE WHEN s.status = 'delayed' THEN EXTRACT(DAY FROM (CURRENT_DATE - s.scheduled_delivery::date)) END), 0) as "avgDelayDays"
      FROM vendors v
      LEFT JOIN invoices i ON i.vendor_id = v.id
      LEFT JOIN shipments s ON s.vendor_id = v.id
      WHERE v.id = $1
      GROUP BY v.id, v.name, v.category
    `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ error: "Vendor not found" });
    const r = result.rows[0];
    const totalShipments = r.totalShipments || 0;
    const onTimeRate = totalShipments > 0 ? r.onTimeDeliveries / totalShipments : 0;
    const disputeRate = parseFloat(r.disputeRate) || 0;
    const avgDelay = parseFloat(r.avgDelayDays) || 0;
    const performanceScore = Math.max(0, Math.min(100,
      Math.round((onTimeRate * 40) + ((1 - disputeRate) * 40) + (Math.max(0, 20 - avgDelay * 2)))
    ));
    res.json({ ...r, onTimeDeliveryRate: onTimeRate, avgDelayDays: avgDelay, disputeRate, performanceScore, totalAmount: parseFloat(r.totalAmount), avgInvoiceAmount: parseFloat(r.avgInvoiceAmount), overdueAmount: parseFloat(r.overdueAmount) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch vendor performance" });
  }
});

export default router;
