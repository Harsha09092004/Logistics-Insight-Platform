import { Router, type IRouter } from "express";
import { db, paymentsTable, invoicesTable, vendorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const { vendorId, invoiceId } = req.query;
    const rows = await db
      .select({
        id: paymentsTable.id,
        invoiceId: paymentsTable.invoiceId,
        invoiceNumber: invoicesTable.invoiceNumber,
        vendorId: paymentsTable.vendorId,
        vendorName: vendorsTable.name,
        amount: paymentsTable.amount,
        currency: paymentsTable.currency,
        paymentDate: paymentsTable.paymentDate,
        paymentMethod: paymentsTable.paymentMethod,
        referenceNumber: paymentsTable.referenceNumber,
        tdsDeducted: paymentsTable.tdsDeducted,
        notes: paymentsTable.notes,
        createdAt: paymentsTable.createdAt,
      })
      .from(paymentsTable)
      .leftJoin(invoicesTable, eq(invoicesTable.id, paymentsTable.invoiceId))
      .leftJoin(vendorsTable, eq(vendorsTable.id, paymentsTable.vendorId));

    let filtered = rows;
    if (vendorId) filtered = filtered.filter(r => r.vendorId === parseInt(vendorId as string));
    if (invoiceId) filtered = filtered.filter(r => r.invoiceId === parseInt(invoiceId as string));

    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

router.post("/", async (req, res) => {
  const { invoiceId, amount, paymentDate, paymentMethod, referenceNumber, tdsDeducted, notes } = req.body;
  if (!invoiceId || !amount || !paymentDate || !paymentMethod) {
    return res.status(400).json({ error: "invoiceId, amount, paymentDate and paymentMethod are required" });
  }
  try {
    const [invoice] = await db
      .select({ vendorId: invoicesTable.vendorId })
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoiceId));

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const [payment] = await db
      .insert(paymentsTable)
      .values({
        invoiceId,
        vendorId: invoice.vendorId,
        amount: String(amount),
        currency: "INR",
        paymentDate,
        paymentMethod,
        referenceNumber: referenceNumber ?? null,
        tdsDeducted: tdsDeducted ? String(tdsDeducted) : null,
        notes: notes ?? null,
      })
      .returning();

    await db
      .update(invoicesTable)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(invoicesTable.id, invoiceId));

    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record payment" });
  }
});

export default router;
