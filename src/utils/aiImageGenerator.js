import dotenv from "dotenv";
import fetch from "node-fetch"; // Node doesn't have fetch built-in in older versions
dotenv.config();

export async function generateCarSceneImage(make, model, carType) {
  const apiKey = process.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.error("❌ Missing OpenAI API key.");
    return null;
  }

  const prompt = `${make} ${model}, photorealistic, parked on a scenic Australian coastal road, no people, cinematic lighting, no text`;

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024"
    })
  });

  if (!res.ok) {
    console.error("❌ Failed to generate image:", await res.text());
    return null;
  }

  const result = await res.json();
  return result.data[0]?.url;
}
