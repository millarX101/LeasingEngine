const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function generateCarSceneImage(make, model, carType = "") {
  if (!OPENAI_API_KEY) {
    console.error("❌ Missing OpenAI API key.");
    return null;
  }

  const prompt = `${make} ${model} ${carType}, photorealistic, parked on a scenic Australian coastal road, no people, cinematic lighting, no text, blue sky, reflections`;

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Failed to generate image:", errorText);
      return null;
    }

    const result = await response.json();
    return result.data[0]?.url || null;
  } catch (err) {
    console.error("❌ Network error while fetching image:", err);
    return null;
  }
}
