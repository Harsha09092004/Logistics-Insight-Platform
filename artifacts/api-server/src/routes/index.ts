import { Router, type IRouter } from "express";
import healthRouter from "./health";
import invoicesRouter from "./invoices";
import vendorsRouter from "./vendors";
import shipmentsRouter from "./shipments";
import reconciliationRouter from "./reconciliation";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/invoices", invoicesRouter);
router.use("/vendors", vendorsRouter);
router.use("/shipments", shipmentsRouter);
router.use("/reconciliation", reconciliationRouter);
router.use("/dashboard", dashboardRouter);

export default router;
