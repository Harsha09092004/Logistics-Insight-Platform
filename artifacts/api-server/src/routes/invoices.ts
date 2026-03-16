import { Router, type IRouter } from "express";
import { db, invoicesTable, vendorsTable, shipmentsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const { status, vendorId, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const rows = await db
      .select({
        id: invoicesTable.id,
        invoiceNumber: invoicesTable.invoiceNumber,
        vendorId: invoicesTable.vendorId,
        vendorName: vendorsTable.name,
        shipmentId: invoicesTable.shipmentId,
        amount: invoicesTable.amount,
        currency: invoicesTable.currency,
        status: invoicesTable.status,
        invoiceDate: invoicesTable.invoiceDate,
        dueDate: invoicesTable.dueDate,
        description: invoicesTable.description,
        freightCharges: invoicesTable.freightCharges,
        fuelSurcharge: invoicesTable.fuelSurcharge,
        otherCharges: invoicesTable.otherCharges,
        gstAmount: invoicesTable.gstAmount,
        discrepancyNotes: invoicesTable.discrepancyNotes,
        createdAt: invoicesTable.createdAt,
        updatedAt: invoicesTable.updatedAt,
      })
      .from(invoicesTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, invoicesTable.vendorId));

    let filtered = rows;
    if (status) filtered = filtered.filter(r => r.status === status);
    if (vendorId) filtered = filtered.filter(r => r.vendorId === parseInt(vendorId as string));

    const total = filtered.length;
    const data = filtered.slice(offset, offset + limitNum);

    res.json({ data, total, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [row] = await db
      .select({
        id: invoicesTable.id,
        invoiceNumber: invoicesTable.invoiceNumber,
        vendorId: invoicesTable.vendorId,
        vendorName: vendorsTable.name,
        shipmentId: invoicesTable.shipmentId,
        amount: invoicesTable.amount,
        currency: invoicesTable.currency,
        status: invoicesTable.status,
        invoiceDate: invoicesTable.invoiceDate,
        dueDate: invoicesTable.dueDate,
        description: invoicesTable.description,
        freightCharges: invoicesTable.freightCharges,
        fuelSurcharge: invoicesTable.fuelSurcharge,
        otherCharges: invoicesTable.otherCharges,
        gstAmount: invoicesTable.gstAmount,
        discrepancyNotes: invoicesTable.discrepancyNotes,
        createdAt: invoicesTable.createdAt,
        updatedAt: invoicesTable.updatedAt,
      })
      .from(invoicesTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, invoicesTable.vendorId))
      .where(eq(invoicesTable.id, id));
    if (!row) return res.status(404).json({ error: "Invoice not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

router.post("/", async (req, res) => {
  const { invoiceNumber, vendorId, shipmentId, amount, currency, invoiceDate, dueDate, description, freightCharges, fuelSurcharge, otherCharges, gstAmount } = req.body;
  if (!invoiceNumber || !vendorId || !amount || !invoiceDate || !dueDate || !freightCharges) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const [invoice] = await db
      .insert(invoicesTable)
      .values({
        invoiceNumber,
        vendorId,
        shipmentId: shipmentId ?? null,
        amount: String(amount),
        currency: currency ?? "INR",
        status: "pending",
        invoiceDate,
        dueDate,
        description: description ?? null,
        freightCharges: String(freightCharges),
        fuelSurcharge: fuelSurcharge ? String(fuelSurcharge) : null,
        otherCharges: otherCharges ? String(otherCharges) : null,
        gstAmount: gstAmount ? String(gstAmount) : null,
      })
      .returning();
    const [vendor] = await db.select({ name: vendorsTable.name }).from(vendorsTable).where(eq(vendorsTable.id, vendorId));
    res.status(201).json({ ...invoice, vendorName: vendor?.name ?? "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, shipmentId, discrepancyNotes, amount, fuelSurcharge, otherCharges, gstAmount } = req.body;
  try {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) updateData.status = status;
    if (shipmentId !== undefined) updateData.shipmentId = shipmentId;
    if (discrepancyNotes !== undefined) updateData.discrepancyNotes = discrepancyNotes;
    if (amount !== undefined) updateData.amount = String(amount);
    if (fuelSurcharge !== undefined) updateData.fuelSurcharge = String(fuelSurcharge);
    if (otherCharges !== undefined) updateData.otherCharges = String(otherCharges);
    if (gstAmount !== undefined) updateData.gstAmount = String(gstAmount);

    const [invoice] = await db
      .update(invoicesTable)
      .set(updateData)
      .where(eq(invoicesTable.id, id))
      .returning();
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await db.delete(invoicesTable).where(eq(invoicesTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

export default router;
