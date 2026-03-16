import { Router, type IRouter } from "express";
import { db, shipmentsTable, vendorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const { status, vendorId } = req.query;
    const rows = await db
      .select({
        id: shipmentsTable.id,
        shipmentNumber: shipmentsTable.shipmentNumber,
        vendorId: shipmentsTable.vendorId,
        vendorName: vendorsTable.name,
        origin: shipmentsTable.origin,
        destination: shipmentsTable.destination,
        status: shipmentsTable.status,
        scheduledDelivery: shipmentsTable.scheduledDelivery,
        actualDelivery: shipmentsTable.actualDelivery,
        agreedFreightCost: shipmentsTable.agreedFreightCost,
        weightKg: shipmentsTable.weightKg,
        description: shipmentsTable.description,
        createdAt: shipmentsTable.createdAt,
      })
      .from(shipmentsTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, shipmentsTable.vendorId));

    let filtered = rows;
    if (status) filtered = filtered.filter(r => r.status === status);
    if (vendorId) filtered = filtered.filter(r => r.vendorId === parseInt(vendorId as string));

    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch shipments" });
  }
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [row] = await db
      .select({
        id: shipmentsTable.id,
        shipmentNumber: shipmentsTable.shipmentNumber,
        vendorId: shipmentsTable.vendorId,
        vendorName: vendorsTable.name,
        origin: shipmentsTable.origin,
        destination: shipmentsTable.destination,
        status: shipmentsTable.status,
        scheduledDelivery: shipmentsTable.scheduledDelivery,
        actualDelivery: shipmentsTable.actualDelivery,
        agreedFreightCost: shipmentsTable.agreedFreightCost,
        weightKg: shipmentsTable.weightKg,
        description: shipmentsTable.description,
        createdAt: shipmentsTable.createdAt,
      })
      .from(shipmentsTable)
      .leftJoin(vendorsTable, eq(vendorsTable.id, shipmentsTable.vendorId))
      .where(eq(shipmentsTable.id, id));
    if (!row) return res.status(404).json({ error: "Shipment not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch shipment" });
  }
});

router.post("/", async (req, res) => {
  const { shipmentNumber, vendorId, origin, destination, scheduledDelivery, agreedFreightCost, weightKg, description } = req.body;
  if (!shipmentNumber || !vendorId || !origin || !destination || agreedFreightCost === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const [shipment] = await db
      .insert(shipmentsTable)
      .values({ shipmentNumber, vendorId, origin, destination, scheduledDelivery, agreedFreightCost: String(agreedFreightCost), weightKg: weightKg ? String(weightKg) : null, description })
      .returning();
    const [vendor] = await db.select({ name: vendorsTable.name }).from(vendorsTable).where(eq(vendorsTable.id, vendorId));
    res.status(201).json({ ...shipment, vendorName: vendor?.name ?? "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create shipment" });
  }
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, actualDelivery, agreedFreightCost } = req.body;
  try {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) updateData.status = status;
    if (actualDelivery !== undefined) updateData.actualDelivery = actualDelivery;
    if (agreedFreightCost !== undefined) updateData.agreedFreightCost = String(agreedFreightCost);

    const [shipment] = await db
      .update(shipmentsTable)
      .set(updateData)
      .where(eq(shipmentsTable.id, id))
      .returning();
    if (!shipment) return res.status(404).json({ error: "Shipment not found" });
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ error: "Failed to update shipment" });
  }
});

export default router;
