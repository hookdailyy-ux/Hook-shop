import { Router } from "express";

const router = Router();

router.post("/generate-product", async (req, res) => {
  return res.json({
    success: true,
    product: {
      title: "Test Product",
      titleAr: "منتج تجريبي",
      description: "AI connection test",
      descriptionAr: "اختبار اتصال الذكاء الاصطناعي",
      brand: "HOOK",
      category: "women",
      subcategory: "",
      colors: [],
      sizes: [],
      affiliateUrl: req.body?.affiliateUrl || "",
    },
  });
});

export default router;
