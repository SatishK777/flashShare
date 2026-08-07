// Routes index
import { Router } from "express";
import healthRoutes from "./health.routes.js";
import shareRoutes from "./share.routes.js";
import fileRoutes from "./file.routes.js";
import downloadRoutes from "./download.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import configRoutes from "./config.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/shares", shareRoutes);
router.use("/", fileRoutes);
router.use("/", downloadRoutes);
router.use("/", analyticsRoutes);
router.use("/", configRoutes);

export default router;
