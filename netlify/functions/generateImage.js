export default async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Missing OpenAI API key');
    return res.status(500).json({ error: 'Missing API key' });
  }

  const { make, model, carType } = req.body || {};
  
  if (!make || !model) {
    return res.status(400).json({ error: 'Make and model are required' });
  }

  const prompt = `A ${make} ${model} ${carType || 'car'}, photorealistic rendering, parked on a scenic Australian coastal road, no people, cinematic lighting, high detail, branding removed, no text`;

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

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error('OpenAI API error:', errorText);
      return res.status(openaiRes.status).json({ error: 'OpenAI API error', details: errorText });
    }

    const json = await openaiRes.json();
    const imageUrl = json.data?.[0]?.url;
    
    if (!imageUrl) {
      console.error('No image URL returned from OpenAI');
      return res.status(500).json({ error: 'No image generated' });
    }

    return res.status(200).json({ url: imageUrl });
  } catch (err) {
    console.error('Image generation error:', err);
    return res.status(500).json({ error: 'Generation failed', details: err.message });
  }
};
