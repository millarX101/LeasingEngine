// src/utils/runningCosts.js

function classifyCarType(body = '') {
  const cleaned = body.trim().toLowerCase();

  if ([
    'sedan', 'station wagon', 'small station wagons', 'midsize station wagons'
  ].includes(cleaned)) return 'SEDAN';

  if ([
    'hatchback', 'compact cars', 'subcompact cars', 'mini compact cars'
  ].includes(cleaned)) return 'HATCH';

  if ([
    'suv', 'crossover', 'sport utility vehicles', 'small sport utility vehicles', 'standard sport utility vehicles'
  ].includes(cleaned)) return 'SUV';

  if ([
    'pickup', 'small pickup trucks', 'standard pickup trucks'
  ].includes(cleaned)) return 'UTE';

  if ([
    'coupe', 'convertible', 'roadster', 'two seaters'
  ].includes(cleaned)) return 'LARGE_UTE';

  if ([
    'minivan', 'van', 'panel van', 'cargo vans', 'passenger vans'
  ].includes(cleaned)) return 'VAN';

  return 'SEDAN'; // Default fallback
}

export function calculateRunningCosts({
  engineType,
  engineSize,
  fuelType,
  bodyStyle,
  annualKms
}) {
  // Constants
  const INSURANCE = 1900;
  const REGO = 900;
  const SERVICE_COST = 480;
  const SERVICE_INTERVAL_KM = 15000;
  const TYRE_LIFE_KM = 50000;
  const TYRE_COST = 300;
  const EV_COST_PER_KM = 0.042;

  // Derived values
  const isEV = (engineType || '').toLowerCase().includes('electric');
  const carType = classifyCarType(bodyStyle);
  const multiplier = isEV
    ? 0.85
    : {
        UTE: 1.00,
        LARGE_UTE: 1.15,
        SUV: 0.95,
        HATCH: 0.90,
        SEDAN: 1.00
      }[carType] ?? 1.00;

  // Fuel assumptions
  const fuelTypeLower = (fuelType || '').toLowerCase();
  const fuelPrice = fuelTypeLower.includes('diesel') ? 2.10 : 2.00;
  const lph = isEV ? 0 : (
    engineSize < 1.5 ? 6.5 :
    engineSize < 2.0 ? 7.5 :
    engineSize < 3.0 ? 8.5 :
    engineSize < 4.0 ? 10.0 : 12.0
  );

  // Running cost calculations
  const servicesPerYear = annualKms / SERVICE_INTERVAL_KM;
  const tyreSetsPerYear = annualKms / TYRE_LIFE_KM;

  const service = servicesPerYear * SERVICE_COST * multiplier;
  const tyres = tyreSetsPerYear * TYRE_COST * multiplier;
  const fuel = isEV
    ? annualKms * EV_COST_PER_KM * multiplier
    : (annualKms / 100) * lph * fuelPrice * multiplier;

  const total = INSURANCE + REGO + service + tyres + fuel;
  const r = x => Number(x.toFixed(2));

  return {
    carType,
    isEV,
    insurance: r(INSURANCE),
    rego: r(REGO),
    service: r(service),
    tyres: r(tyres),
    fuel: r(fuel),
    total: r(total),
  };
}
