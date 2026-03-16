import { Router, type IRouter } from "express";
import { db, vendorsTable, invoicesTable } from "@workspace/db";
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

export default router;
