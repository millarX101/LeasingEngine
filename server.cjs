// server.cjs

const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

let vehicles = [];

// Load vehicle data
async function loadData() {
  try {
    const dataPath = path.join(__dirname, 'data', 'vehicles_updated.json');
    const raw = await fs.readFile(dataPath, 'utf-8');
    vehicles = JSON.parse(raw);
    console.log(`✅ Loaded ${vehicles.length} vehicles`);
  } catch (err) {
    console.error('❌ Failed to load vehicle data:', err.message);
  }
}

// API routes

app.get('/api/makes', (req, res) => {
  const makes = [...new Set(vehicles.map(v => v.make).filter(Boolean))];
  res.json(makes.sort());
});

app.get('/api/models', (req, res) => {
  const { make } = req.query;
  if (!make) return res.status(400).json({ error: 'Missing make' });

  const models = [
    ...new Set(
      vehicles
        .filter(v => v.make.toLowerCase() === make.toLowerCase())
        .map(v => v.model)
        .filter(Boolean)
    )
  ];
  res.json(models.sort());
});

app.get('/api/years', (req, res) => {
  const { make, model } = req.query;
  if (!make || !model) return res.status(400).json({ error: 'Missing make/model' });

  const years = [
    ...new Set(
      vehicles
        .filter(v =>
          v.make.toLowerCase() === make.toLowerCase() &&
          v.model.toLowerCase() === model.toLowerCase()
        )
        .map(v => v.year)
    )
  ];
  res.json(years.sort((a, b) => b - a));
});

app.get('/api/details', (req, res) => {
  const { make, model, year } = req.query;
  if (!make || !model || !year) return res.status(400).json({ error: 'Missing fields' });

  const match = vehicles.find(v =>
    v.make.toLowerCase() === make.toLowerCase() &&
    v.model.toLowerCase() === model.toLowerCase() &&
    String(v.year) === String(year)
  );

  if (!match) return res.status(404).json({ error: 'Vehicle not found' });

  const engineType = (match.engine_type || '').toLowerCase();
  const bodyStyle = (match.body_style || '').toLowerCase();
  const engineSize = parseFloat(match.engine_size) || 2.0;
  const fuelType = match.fuel_type || 'Petrol';
  const isEV = engineType.includes('electric');

  const classifyCarType = (body = '') => {
    body = body.trim().toLowerCase();
    if (['sedan', 'station wagon', 'small station wagons', 'midsize station wagons'].includes(body)) return 'SEDAN';
    if (['hatchback', 'compact cars', 'subcompact cars', 'mini compact cars'].includes(body)) return 'HATCH';
    if (['suv', 'crossover', 'sport utility vehicles', 'small sport utility vehicles', 'standard sport utility vehicles'].includes(body)) return 'SUV';
    if (['pickup', 'small pickup trucks', 'standard pickup trucks'].includes(body)) return 'UTE';
    if (['coupe', 'convertible', 'roadster', 'two seaters'].includes(body)) return 'LARGE_UTE';
    if (['minivan', 'van', 'panel van', 'cargo vans', 'passenger vans'].includes(body)) return 'VAN';
    return 'SEDAN';
  };

  const carType = classifyCarType(bodyStyle);

  const runningCosts = {
    insurance: 1900,
    rego: 900,
    service: 720,
    tyres: 300,
    fuel: isEV ? 600 : 1800,
    total: isEV ? 4420 : 6620
  };

  res.json({ carType, isEV, engineSize, fuelType, runningCosts });
});

app.post('/api/image/generate-image', async (req, res) => {
  const { make, model, year, variant, carType } = req.body;

  const carDesc = `${year || ''} ${make} ${model} ${variant || ''}`.trim();

  // Very simple, clean scene prompts — less branding hallucination
  const sceneMap = {
    SUV: `${carDesc} parked on a quiet road near the coast, clear skies, no people, photorealistic`,
    Hatch: `${carDesc} driving down an empty city street at dusk, clean background, no text or people, photorealistic`,
    Sedan: `${carDesc} parked on a residential street, soft morning light, no people, ultra-realistic`,
    Ute: `${carDesc} on a gravel track with trees in the background, no people, no signage, clean lighting`,
    LARGE_UTE: `${carDesc} parked on a country road with open landscape, no people or text, simple setting, high realism`,
    Van: `${carDesc} parked in a work zone with minimal detail, natural lighting, photorealistic, no people`,
    EV: `${carDesc} charging at a generic EV station with modern background, clean light, no logos or people`
  };

  const scene = sceneMap[carType?.toUpperCase()] || `${carDesc} on a plain sealed road, bushland behind, daylight, no people`;

  const prompt = `${scene}, Australian spec vehicle, high quality, no branding, no logos, no people, no text, ultra-realistic photo`;

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "800x800"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: errorText });
    }

    const result = await response.json();
    res.json({ url: result.data[0]?.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
loadData().then(() => {
  app.listen(PORT, () =>
    console.log(`🚗 millarX car server running on http://localhost:${PORT}`)
  );
});
