// src/utils/aiImageClient.js

export async function generateCarSceneImage(make, model, carType) {
  try {
    const response = await fetch("http://localhost:4000/api/image/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ make, model, carType })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Failed to generate image:", error);
      return null;
    }

    const { url } = await response.json();
    return url;
  } catch (err) {
    console.error("❌ Network error while fetching image:", err.message);
    return null;
  }
}
