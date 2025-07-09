export default async (req, res) => {
  const apiKey = process.env.VITE_OPENAI_API_KEY;   // stored only in Netlify UI
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing API key' });
  }

  const { make, model, carType } = req.body || {};
  const prompt =
    `${make} ${model} ${carType}, photorealistic, parked on a scenic Australian coastal road, no people, cinematic lighting, no text`;

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024'
      })
    });
    const json = await openaiRes.json();
    return res.status(200).json({ url: json.data?.[0]?.url || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'generation failed' });
  }
};
