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
Affiliate link:
${affiliateUrl}

Images:
${JSON.stringify(images)}

Return ONLY valid JSON:

{
"title":"",
"titleAr":"",
"description":"",
"descriptionAr":"",
"brand":"",
"category":"",
"subcategory":"",
"colors":[],
"sizes":[]
}
`,
      }),
    });

    const data: any = await response.json();
    console.log("FULL OPENAI RESPONSE:", JSON.stringify(data, null, 2));
    const text =
      data.output_text || data.output?.[0]?.content?.[0]?.text || "{}";
    console.log("HOOK AI TEXT:", text);

    let product = {};
    try {
      product = JSON.parse(text);
    } catch {
      product = {
        title: "",
        titleAr: "",
        description: "",
        descriptionAr: "",
        brand: "",
        category: "women",
        subcategory: "",
        colors: [],
        sizes: [],
      };
    }

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
