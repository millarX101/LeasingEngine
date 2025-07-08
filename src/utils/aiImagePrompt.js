
// src/utils/aiImagePrompt.js

/**
 * Generates an AI prompt for car image generation based on car type and details.
 *
 * @param {string} carType - Classified car type (e.g., SUV, Hatch, Sports).
 * @param {string} make - Car make (e.g., Mazda).
 * @param {string} model - Car model (e.g., CX-5).
 * @returns {string} - Scene prompt for image generation.
 */
export function createPrompt(make, model, year, variant, carType) {
  const carDesc = `${year} ${make} ${model} ${variant}`.trim();

  const sceneMap = {
    SUV: `${carDesc} parked on a beachside road trip, roof racks and gear, clear skies, warm Australian lighting, no people, photorealistic`,
    Hatch: `${carDesc} driving through a modern city laneway at dusk, cafe backdrop, sharp reflections, no people, photorealistic`,
    Sedan: `${carDesc} parked in a quiet suburban driveway, leafy trees, morning light, clean surrounds, no people, photorealistic`,
    Sports: `${carDesc} on a winding mountain pass like the Great Ocean Road, golden hour, dramatic lighting, no people, cinematic realism`,
    Ute: `${carDesc} off-road on a dirt trail with mountain bikes secured in tray, rugged Australian bush, no people, dust trail, photorealistic`,
    Luxury: `${carDesc} parked outside a high-end hotel, clean footpath, dusk lighting, no people, elegant render, photorealistic`,
    EV: `${carDesc} charging at a modern public EV station, minimalist architecture, sunrise, clean styling, no people, high realism`
  };

  return sceneMap[carType] || `${carDesc} driving on a country road, scenic surroundings, no people, high-quality render`;
}