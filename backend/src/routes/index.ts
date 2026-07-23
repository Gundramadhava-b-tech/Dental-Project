import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import patientsRouter from "./patients.js";
import scansRouter from "./scans.js";
import analysesRouter from "./analyses.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(patientsRouter);
router.use(scansRouter);
router.use(analysesRouter);

export default router;
