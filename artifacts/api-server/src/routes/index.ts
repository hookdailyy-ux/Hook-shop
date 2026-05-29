import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import looksRouter from "./looks";
import setupsRouter from "./setups";
import newsletterRouter from "./newsletter";
import adminRouter from "./admin";
import subcategoriesRouter from "./subcategories";
import authRouter from "./auth";
import siteSettingsRouter from "./site-settings";
import categoriesRouter from "./categories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(siteSettingsRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(looksRouter);
router.use(setupsRouter);
router.use(newsletterRouter);
router.use(adminRouter);
router.use(subcategoriesRouter);

export default router;
