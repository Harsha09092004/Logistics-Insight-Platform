import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { invoicesTable } from "./invoices";

export const discrepanciesTable = pgTable("discrepancies", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoicesTable.id),
  type: text("type").notNull(),
  invoicedAmount: numeric("invoiced_amount", { precision: 12, scale: 2 }).notNull(),
  expectedAmount: numeric("expected_amount", { precision: 12, scale: 2 }).notNull(),
  varianceAmount: numeric("variance_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("open"),
  description: text("description"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDiscrepancySchema = createInsertSchema(discrepanciesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDiscrepancy = z.infer<typeof insertDiscrepancySchema>;
export type Discrepancy = typeof discrepanciesTable.$inferSelect;
