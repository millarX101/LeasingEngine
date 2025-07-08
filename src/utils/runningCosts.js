// src/utils/runningCosts.js

function classifyCarType(body = '') {
  body = body.trim().toLowerCase();

  if (['sedan', 'station wagon', 'small station wagons', 'midsize station wagons'].includes(body))
    return 'SEDAN';
  if (['hatchback', 'compact cars', 'subcompact cars', 'mini compact cars'].includes(body))
    return 'HATCH';
  if (['suv', 'crossover', 'sport utility vehicles', 'small sport utility vehicles', 'standard sport utility vehicles'].includes(body))
    return 'SUV';
  if (['pickup', 'small pickup trucks', 'standard pickup trucks'].includes(body))
    return 'UTE';
  if (['coupe', 'convertible', 'roadster', 'two seaters'].includes(body))
    return 'LARGE_UTE';
  if (['minivan', 'van', 'panel van', 'cargo vans', 'passenger vans'].includes(body))
    return 'VAN';

  return 'SEDAN'; // fallback
}

export function calculateRunningCosts({ engineType, engineSize, fuelType, bodyStyle, annualKms }) {
  const insurance = 1900;
  const rego = 900;
  const serviceCostPerVisit = 480;
  const serviceIntervalKms = 15000;
  const tyreLifeKms = 50000;
  const baseTyreCost = 300;

  const servicesPerYear = annualKms / serviceIntervalKms;
  const tyreSetsPerYear = annualKms / tyreLifeKms;

  const fuelTypeLower = (fuelType || '').toLowerCase();
  const engineTypeLower = (engineType || '').toLowerCase();
  const isEV = engineTypeLower.includes('electric');
  const carType = classifyCarType(bodyStyle);

  const multipliers = {
    UTE: 1.00,
    LARGE_UTE: 1.15,
    SUV: 0.95,
    HATCH: 0.90,
    SEDAN: 1.00,
    EV: 0.85,
  };

  const m = isEV ? multipliers['EV'] : multipliers[carType] ?? 1;

  const estimatedLph = isEV ? 0 : (
    engineSize < 1.5 ? 6.5 :
    engineSize < 2.0 ? 7.5 :
    engineSize < 3.0 ? 8.5 :
    engineSize < 4.0 ? 10.0 : 12.0
  );

  const fuelPrice = fuelTypeLower.includes('diesel') ? 2.10 : 2.00;
  const evCostPerKm = 0.042;

  const service = servicesPerYear * serviceCostPerVisit * m;
  const tyres = tyreSetsPerYear * baseTyreCost * m;
  const fuel = isEV
    ? annualKms * evCostPerKm * m
    : (annualKms / 100) * estimatedLph * fuelPrice * m;

  const total = insurance + rego + service + tyres + fuel;
  const r = x => Number(x.toFixed(2));

  return {
    carType,
    isEV,
    insurance: r(insurance),
    rego: r(rego),
    service: r(service),
    tyres: r(tyres),
    fuel: r(fuel),
    total: r(total),
  };
}
