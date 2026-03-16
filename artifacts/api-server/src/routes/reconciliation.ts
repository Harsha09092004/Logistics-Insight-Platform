import { Router, type IRouter } from "express";
import { db, invoicesTable, shipmentsTable, discrepanciesTable, vendorsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.post("/run", async (req, res) => {
  const { invoiceIds } = req.body;
  if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
    return res.status(400).json({ error: "invoiceIds array is required" });
  }

  try {
    const invoices = await db
      .select({
        id: invoicesTable.id,
        invoiceNumber: invoicesTable.invoiceNumber,
        vendorId: invoicesTable.vendorId,
        shipmentId: invoicesTable.shipmentId,
        amount: invoicesTable.amount,
        freightCharges: invoicesTable.freightCharges,
        fuelSurcharge: invoicesTable.fuelSurcharge,
        otherCharges: invoicesTable.otherCharges,
        gstAmount: invoicesTable.gstAmount,
        status: invoicesTable.status,
      })
      .from(invoicesTable)
      .where(inArray(invoicesTable.id, invoiceIds));

    const details = [];
    let matched = 0;
    let disputed = 0;
    let discrepanciesFound = 0;
    let totalVariance = 0;

    for (const invoice of invoices) {
      const invoiceAmount = parseFloat(invoice.amount as string);
      let expectedAmount = invoiceAmount;
      let varianceAmount = 0;
      let reason = "No shipment linked";
      let newStatus = "pending";

      if (invoice.shipmentId) {
        const [shipment] = await db
          .select({ agreedFreightCost: shipmentsTable.agreedFreightCost })
          .from(shipmentsTable)
          .where(eq(shipmentsTable.id, invoice.shipmentId));

        if (shipment) {
          const baseCost = parseFloat(shipment.agreedFreightCost as string);
          const fuelSurcharge = parseFloat((invoice.fuelSurcharge as string) ?? "0") || 0;
          const otherCharges = parseFloat((invoice.otherCharges as string) ?? "0") || 0;
          const gstAmount = parseFloat((invoice.gstAmount as string) ?? "0") || 0;

          expectedAmount = baseCost + fuelSurcharge + otherCharges + gstAmount;
          varianceAmount = invoiceAmount - expectedAmount;
          const variancePct = Math.abs(varianceAmount) / expectedAmount;

          if (variancePct < 0.01) {
            newStatus = "matched";
            reason = "Amount matches agreed freight cost";
          } else {
            newStatus = "disputed";
            reason = `Amount deviation of ₹${Math.abs(varianceAmount).toFixed(2)} (${(variancePct * 100).toFixed(1)}% variance)`;
          }
        }
      } else {
        const allInvoices = await db
          .select({ id: invoicesTable.id, invoiceNumber: invoicesTable.invoiceNumber })
          .from(invoicesTable)
          .where(eq(invoicesTable.vendorId, invoice.vendorId));
        const sameAmount = allInvoices.filter(i => i.id !== invoice.id);
        if (sameAmount.length > 0) {
          newStatus = "disputed";
          reason = "Possible duplicate invoice detected - no shipment linked";
        } else {
          newStatus = "disputed";
          reason = "No shipment linked for reconciliation";
        }
        varianceAmount = invoiceAmount;
        expectedAmount = 0;
      }

      await db
        .update(invoicesTable)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(invoicesTable.id, invoice.id));

      if (newStatus === "matched") {
        matched++;
      } else if (newStatus === "disputed") {
        disputed++;
        discrepanciesFound++;
        totalVariance += Math.abs(varianceAmount);

        const discrepancyType = !invoice.shipmentId ? "missing_shipment" :
          Math.abs(varianceAmount) > 0 ? "amount_mismatch" : "rate_deviation";

        const [existing] = await db
          .select()
          .from(discrepanciesTable)
          .where(eq(discrepanciesTable.invoiceId, invoice.id));

        if (!existing) {
          await db.insert(discrepanciesTable).values({
            invoiceId: invoice.id,
            type: discrepancyType,
            invoicedAmount: String(invoiceAmount),
            expectedAmount: String(expectedAmount),
            varianceAmount: String(Math.abs(varianceAmount)),
            status: "open",
            description: reason,
          });
        }
      }

      details.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: newStatus,
        varianceAmount,
        reason,
      });
    }

    res.json({
      processed: invoices.length,
      matched,
      disputed,
      discrepanciesFound,
      totalVarianceAmount: totalVariance,
      details,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Reconciliation failed" });
  }
});

router.get("/discrepancies", async (req, res) => {
  try {
    const { status } = req.query;
    const rows = await db
      .select({
        id: discrepanciesTable.id,
        invoiceId: discrepanciesTable.invoiceId,
        invoiceNumber: invoicesTable.invoiceNumber,
        vendorName: vendorsTable.name,
        type: discrepanciesTable.type,
        invoicedAmount: discrepanciesTable.invoicedAmount,
        expectedAmount: discrepanciesTable.expectedAmount,
        varianceAmount: discrepanciesTable.varianceAmount,
        status: discrepanciesTable.status,
        description: discrepanciesTable.description,
        resolution: discrepanciesTable.resolution,
        createdAt: discrepanciesTable.createdAt,
      })
      .from(discrepanciesTable)
      .leftJoin(invoicesTable, eq(invoicesTable.id, discrepanciesTable.invoiceId))
      .leftJoin(vendorsTable, eq(vendorsTable.id, invoicesTable.vendorId));

    let filtered = rows;
    if (status) filtered = filtered.filter(r => r.status === status);

    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch discrepancies" });
  }
});

router.patch("/discrepancies/:id/resolve", async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, resolution } = req.body;
  if (!status || !resolution) {
    return res.status(400).json({ error: "status and resolution are required" });
  }
  try {
    const [discrepancy] = await db
      .update(discrepanciesTable)
      .set({ status, resolution, updatedAt: new Date() })
      .where(eq(discrepanciesTable.id, id))
      .returning();
    if (!discrepancy) return res.status(404).json({ error: "Discrepancy not found" });
    res.json(discrepancy);
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve discrepancy" });
  }
});

export default router;
