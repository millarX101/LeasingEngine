// src/utils/runningCosts.js - IMPROVED VERSION

/**
 * Enhanced car type classification with fuzzy matching
 * @param {string} bodyStyle - Vehicle body style
 * @param {string} make - Vehicle make (optional, for better classification)
 * @returns {string} - Classified car type
 */
function classifyCarType(bodyStyle = '', make = '') {
  const cleaned = bodyStyle.trim().toLowerCase();
  const makeClean = make.trim().toLowerCase();
  
  // Handle special cases by make first
  if (makeClean === 'tesla' || makeClean === 'polestar' || makeClean === 'rivian') {
    if (cleaned.includes('model s') || cleaned.includes('model x')) return 'LARGE_EV';
    return 'EV_SEDAN'; // Most EVs are sedan-like
  }
  
  // Luxury brands tend to have higher costs
  const luxuryBrands = ['bmw', 'mercedes', 'audi', 'lexus', 'jaguar', 'porsche', 'maserati'];
  const isLuxury = luxuryBrands.includes(makeClean);
  
  // Fuzzy matching for body styles
  if (cleaned.includes('sedan') || cleaned.includes('saloon') || 
      cleaned.includes('4 door') || cleaned.includes('four door')) {
    return isLuxury ? 'LUXURY_SEDAN' : 'SEDAN';
  }
  
  if (cleaned.includes('hatch') || cleaned.includes('compact') || 
      cleaned.includes('city') || cleaned.includes('mini')) {
    return 'HATCH';
  }
  
  if (cleaned.includes('suv') || cleaned.includes('crossover') || 
      cleaned.includes('4wd') || cleaned.includes('awd') || 
      cleaned.includes('sport utility')) {
    if (cleaned.includes('large') || cleaned.includes('full size')) {
      return isLuxury ? 'LUXURY_LARGE_SUV' : 'LARGE_SUV';
    }
    return isLuxury ? 'LUXURY_SUV' : 'SUV';
  }
  
  if (cleaned.includes('pickup') || cleaned.includes('ute') || 
      cleaned.includes('truck') || cleaned.includes('tray')) {
    if (cleaned.includes('large') || cleaned.includes('heavy duty')) {
      return 'LARGE_UTE';
    }
    return 'UTE';
  }
  
  if (cleaned.includes('coupe') || cleaned.includes('convertible') || 
      cleaned.includes('roadster') || cleaned.includes('sports') ||
      cleaned.includes('2 door') || cleaned.includes('two door')) {
    return isLuxury ? 'LUXURY_COUPE' : 'COUPE';
  }
  
  if (cleaned.includes('wagon') || cleaned.includes('estate') || 
      cleaned.includes('touring')) {
    return isLuxury ? 'LUXURY_WAGON' : 'WAGON';
  }
  
  if (cleaned.includes('van') || cleaned.includes('commercial') || 
      cleaned.includes('cargo')) {
    return 'VAN';
  }
  
  // Default fallback
  return isLuxury ? 'LUXURY_SEDAN' : 'SEDAN';
}

/**
 * Get vehicle-specific multipliers for cost calculations
 * @param {string} carType - Classified car type
 * @param {boolean} isEV - Is electric vehicle
 * @param {number} vehicleValue - Vehicle value for luxury adjustment
 * @returns {object} - Cost multipliers
 */
function getVehicleMultipliers(carType, isEV, vehicleValue = 0) {
  // Base multipliers for different vehicle types
  const baseMultipliers = {
    // Standard vehicles
    'HATCH': { service: 0.85, tyres: 0.90, fuel: 0.90 },
    'SEDAN': { service: 1.00, tyres: 1.00, fuel: 1.00 },
    'WAGON': { service: 1.05, tyres: 1.05, fuel: 1.05 },
    'SUV': { service: 1.15, tyres: 1.20, fuel: 1.10 },
    'LARGE_SUV': { service: 1.30, tyres: 1.40, fuel: 1.25 },
    'UTE': { service: 1.10, tyres: 1.15, fuel: 1.05 },
    'LARGE_UTE': { service: 1.25, tyres: 1.30, fuel: 1.20 },
    'COUPE': { service: 1.20, tyres: 1.25, fuel: 1.10 },
    'VAN': { service: 1.20, tyres: 1.30, fuel: 1.15 },
    
    // Luxury vehicles (higher service costs)
    'LUXURY_SEDAN': { service: 1.40, tyres: 1.30, fuel: 1.05 },
    'LUXURY_SUV': { service: 1.60, tyres: 1.50, fuel: 1.15 },
    'LUXURY_LARGE_SUV': { service: 1.80, tyres: 1.70, fuel: 1.30 },
    'LUXURY_COUPE': { service: 1.70, tyres: 1.60, fuel: 1.20 },
    'LUXURY_WAGON': { service: 1.50, tyres: 1.40, fuel: 1.10 },
    
    // Electric vehicles (lower service, higher tyre wear, no fuel)
    'EV_SEDAN': { service: 0.60, tyres: 1.10, fuel: 0 },
    'LARGE_EV': { service: 0.70, tyres: 1.20, fuel: 0 }
  };
  
  // Get base multiplier or default
  const multiplier = baseMultipliers[carType] || baseMultipliers['SEDAN'];
  
  // Adjust for high-value vehicles (>$80k)
  if (vehicleValue > 80000) {
    multiplier.service *= 1.2;
    multiplier.tyres *= 1.1;
  }
  
  // EVs get reduced service costs
  if (isEV) {
    multiplier.service *= 0.6; // EVs need less maintenance
    multiplier.fuel = 0; // No fuel costs
  }
  
  return multiplier;
}

/**
 * Calculate fuel consumption based on engine and vehicle characteristics
 * @param {number} engineSize - Engine size in litres
 * @param {string} fuelType - Type of fuel
 * @param {string} carType - Vehicle type
 * @param {boolean} isEV - Is electric vehicle
 * @returns {number} - Litres per 100km or kWh per 100km for EVs
 */
function calculateFuelConsumption(engineSize, fuelType, carType, isEV) {
  if (isEV) {
    // kWh per 100km for EVs based on vehicle size
    const evConsumption = {
      'EV_SEDAN': 18,
      'LARGE_EV': 24,
      'HATCH': 16,
      'SUV': 22,
      'LARGE_SUV': 28
    };
    return evConsumption[carType] || 18;
  }
  
  // Base consumption by engine size
  let baseLPH;
  if (engineSize <= 1.0) baseLPH = 5.5;
  else if (engineSize <= 1.5) baseLPH = 6.5;
  else if (engineSize <= 2.0) baseLPH = 7.5;
  else if (engineSize <= 2.5) baseLPH = 8.5;
  else if (engineSize <= 3.0) baseLPH = 9.5;
  else if (engineSize <= 4.0) baseLPH = 11.0;
  else if (engineSize <= 5.0) baseLPH = 13.0;
  else baseLPH = 15.0;
  
  // Adjust for fuel type
  const fuelTypeMultiplier = {
    'diesel': 0.85,    // Diesel is more efficient
    'hybrid': 0.65,    // Hybrids use less fuel
    'petrol': 1.0,     // Base
    'premium': 1.05,   // Premium petrol, slightly less efficient
    'e85': 1.3         // E85 ethanol, less efficient
  };
  
  const fuelTypeLower = fuelType.toLowerCase();
  let multiplier = 1.0;
  
  for (const [type, mult] of Object.entries(fuelTypeMultiplier)) {
    if (fuelTypeLower.includes(type)) {
      multiplier = mult;
      break;
    }
  }
  
  // Adjust for vehicle type
  const vehicleTypeMultiplier = {
    'HATCH': 0.90,
    'SEDAN': 1.00,
    'WAGON': 1.05,
    'SUV': 1.20,
    'LARGE_SUV': 1.35,
    'UTE': 1.15,
    'LARGE_UTE': 1.30,
    'COUPE': 1.10,
    'VAN': 1.25
  };
  
  const vehicleMultiplier = vehicleTypeMultiplier[carType] || 1.0;
  
  return baseLPH * multiplier * vehicleMultiplier;
}

/**
 * Enhanced running costs calculation
 * @param {object} params - Calculation parameters
 * @returns {object} - Calculated running costs
 */
export function calculateRunningCosts({
  engineType,
  engineSize = 2.0,
  fuelType = 'petrol',
  bodyStyle = 'sedan',
  annualKms = 15000,
  make = '',
  vehicleValue = 0
}) {
  // Input validation
  if (annualKms <= 0 || annualKms > 100000) {
    throw new Error('Annual kilometres must be between 1 and 100,000');
  }
  
  if (engineSize < 0 || engineSize > 8) {
    throw new Error('Engine size must be between 0 and 8 litres');
  }
  
  // Constants - adjust annually
  const SERVICE_COST = 480;
  const SERVICE_INTERVAL_KM = 15000;
  const TYRE_LIFE_KM = 50000;
  const TYRE_COST = 300;
  const EV_COST_PER_KWH = 0.28; // Electricity cost per kWh
  
  // Fuel prices - update these regularly
  const FUEL_PRICES = {
    petrol: 2.00,
    diesel: 2.10,
    premium: 2.15,
    lpg: 1.20,
    e85: 1.80
  };
  
  // Determine vehicle characteristics
  const isEV = (engineType || '').toLowerCase().includes('electric') || 
               engineSize === 0 || 
               fuelType.toLowerCase().includes('electric');
  
  const isHybrid = fuelType.toLowerCase().includes('hybrid');
  const carType = classifyCarType(bodyStyle, make);
  const multipliers = getVehicleMultipliers(carType, isEV, vehicleValue);
  
  // Calculate fuel/energy consumption
  const consumption = calculateFuelConsumption(
    isEV ? 0 : engineSize, 
    fuelType, 
    carType, 
    isEV
  );
  
  // Get fuel price
  const fuelTypeLower = fuelType.toLowerCase();
  let fuelPrice = FUEL_PRICES.petrol; // default
  
  for (const [type, price] of Object.entries(FUEL_PRICES)) {
    if (fuelTypeLower.includes(type)) {
      fuelPrice = price;
      break;
    }
  }
  
  // Calculate annual costs - ONGOING COSTS ONLY
  const servicesPerYear = annualKms / SERVICE_INTERVAL_KM;
  const tyreSetsPerYear = annualKms / TYRE_LIFE_KM;
  
  // Service costs (reduced for EVs, higher for luxury)
  const serviceTotal = servicesPerYear * SERVICE_COST * multipliers.service;
  
  // Tyre costs (varies by vehicle type and weight)
  const tyreTotal = tyreSetsPerYear * TYRE_COST * multipliers.tyres;
  
  // Fuel/Energy costs
  let fuelTotal = 0;
  if (isEV) {
    // Electric vehicles - kWh consumption
    const annualKwh = (annualKms / 100) * consumption;
    fuelTotal = annualKwh * EV_COST_PER_KWH;
  } else {
    // ICE vehicles - fuel consumption
    const annualLitres = (annualKms / 100) * consumption;
    fuelTotal = annualLitres * fuelPrice;
  }
  
  // Apply final adjustments for hybrids
  if (isHybrid && !isEV) {
    fuelTotal *= 0.7; // Hybrids use ~30% less fuel
    serviceTotal *= 1.1; // But have slightly higher service costs
  }
  
  // Round to whole dollars
  const round = (value) => Math.round(value);
  
  // Calculate total (EXCLUDING insurance and registration)
  const total = serviceTotal + tyreTotal + fuelTotal;
  
  return {
    // Vehicle classification
    carType,
    isEV,
    isHybrid,
    
    // Cost breakdown (annual amounts)
    service: round(serviceTotal),
    tyres: round(tyreTotal),
    fuel: round(fuelTotal),
    total: round(total),
    
    // Additional details for transparency
    details: {
      consumption: isEV ? `${consumption} kWh/100km` : `${consumption.toFixed(1)} L/100km`,
      fuelPrice: isEV ? `$${EV_COST_PER_KWH}/kWh` : `$${fuelPrice}/L`,
      servicesPerYear: Number(servicesPerYear.toFixed(2)),
      tyreSetsPerYear: Number(tyreSetsPerYear.toFixed(2)),
      multipliers: multipliers
    }
  };
}

// Utility function to estimate costs for different scenarios
export function estimateRunningCosts(vehicleSpecs) {
  const scenarios = ['Low usage (10k km)', 'Average usage (15k km)', 'High usage (25k km)'];
  const kmAmounts = [10000, 15000, 25000];
  
  return scenarios.map((scenario, index) => ({
    scenario,
    costs: calculateRunningCosts({
      ...vehicleSpecs,
      annualKms: kmAmounts[index]
    })
  }));
}

// Export for backwards compatibility
export { classifyCarType, getVehicleMultipliers, calculateFuelConsumption };