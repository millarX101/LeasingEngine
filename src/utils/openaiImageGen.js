import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCarImage(prompt) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "800x800",
      n: 1,
    });
    return response.data[0]?.url;
  } catch (err) {
    console.error("❌ Failed to generate image:", err.message);
    return null;
  }
}
