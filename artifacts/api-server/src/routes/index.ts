import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import looksRouter from "./looks";
import newsletterRouter from "./newsletter";
import adminRouter from "./admin";
import subcategoriesRouter from "./subcategories";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(looksRouter);
router.use(newsletterRouter);
router.use(adminRouter);
router.use(subcategoriesRouter);

export default router;
