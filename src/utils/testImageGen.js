// src/utils/testImageGen.js
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ⬇️ Setup to resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⬇️ Load .env from root of project
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ⬇️ Now import generator AFTER .env is loaded
import { generateCarSceneImage } from "./aiImageGenerator.js";

// Log key for confirmation (optional)
console.log("Loaded API key:", process.env.VITE_OPENAI_API_KEY);

// Test image generation
const make = "Mazda";
const model = "CX-5";
const carType = "SUV";

generateCarSceneImage(make, model, carType).then((url) => {
  if (url) {
    console.log("✅ Image URL:", url);
  } else {
    console.log("❌ Image generation failed.");
  }
});
