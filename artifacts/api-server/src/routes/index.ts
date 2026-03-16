import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import invoicesRouter from "./invoices";
import vendorsRouter from "./vendors";
import shipmentsRouter from "./shipments";
import reconciliationRouter from "./reconciliation";
import dashboardRouter from "./dashboard";
import paymentsRouter from "./payments";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/invoices", invoicesRouter);
router.use("/vendors", vendorsRouter);
router.use("/shipments", shipmentsRouter);
router.use("/reconciliation", reconciliationRouter);
router.use("/dashboard", dashboardRouter);
router.use("/payments", paymentsRouter);
router.use("/reports", reportsRouter);

export default router;
