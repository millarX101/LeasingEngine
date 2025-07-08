import express from "express";
import { generateCarSceneImage } from "../utils/aiImageGenerator.js";

const router = express.Router();

router.post("/generate-image", async (req, res) => {
  const { make, model, carType } = req.body;

  if (!make || !model || !carType) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const imageUrl = await generateCarSceneImage(make, model, carType);
    if (!imageUrl) throw new Error("No image returned");
    res.json({ imageUrl });
  } catch (err) {
    console.error("Image generation error:", err);
    res.status(500).json({ error: "Image generation failed" });
  }
});

export default router;
