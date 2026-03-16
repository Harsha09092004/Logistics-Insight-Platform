import { pgTable, text, serial, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vendorsTable } from "./vendors";
import { shipmentsTable } from "./shipments";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  vendorId: integer("vendor_id").notNull().references(() => vendorsTable.id),
  shipmentId: integer("shipment_id").references(() => shipmentsTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("pending"),
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),
  description: text("description"),
  freightCharges: numeric("freight_charges", { precision: 12, scale: 2 }).notNull(),
  fuelSurcharge: numeric("fuel_surcharge", { precision: 12, scale: 2 }),
  otherCharges: numeric("other_charges", { precision: 12, scale: 2 }),
  gstAmount: numeric("gst_amount", { precision: 12, scale: 2 }),
  tdsAmount: numeric("tds_amount", { precision: 12, scale: 2 }),
  hsnCode: text("hsn_code"),
  discrepancyNotes: text("discrepancy_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
