import { Router } from "express";

const router = Router();

router.post("/generate-product", async (req, res) => {
  try {
    const { affiliateUrl, images = [] } = req.body;

    if (!affiliateUrl) {
      return res.status(400).json({
        success: false,
        message: "Affiliate link is required",
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        input: `
You are HOOK AI, an admin assistant for a luxury affiliate store.

The admin provides:
- Affiliate link
- Product images

Generate ONLY valid JSON.

Rules:
- Keep affiliate link unchanged.
- Generate English and Arabic titles.
- Generate English and Arabic descriptions.
- Include only real colors.
- Include only real sizes.
- Category must be one of:
women, men, couples, kids, accessories, electronics, home-essentials.

Affiliate link:
${affiliateUrl}

Images:
${JSON.stringify(images)}

Return:

{
"title":"",
"titleAr":"",
"description":"",
"descriptionAr":"",
"brand":"",
"category":"",
"subcategory":"",
"colors":[],
"sizes":[],
"affiliateUrl":""
}
`,
      }),
    });

    const data: any = await response.json();
    const text = data.output_text || "{}";
    const product = JSON.parse(text);

    return res.json({
      success: true,
      product: {
        ...product,
        affiliateUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate product",
    });
  }
});

export default router;
