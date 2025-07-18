// src/utils/stampDutyCalculator.js - IMPROVED VERSION
// Last updated: July 2025 - Check quarterly for rate changes

/**
 * Calculate motor vehicle stamp duty for Australian states
 * @param {string} state - Australian state/territory code
 * @param {number} price - Vehicle price (including GST)
 * @param {boolean} isEV - Is the vehicle electric/zero emission
 * @param {boolean} isHybrid - Is the vehicle a hybrid (some states have concessions)
 * @param {string} fuelType - Fuel type for additional classifications
 * @returns {number} - Stamp duty amount in dollars
 */
export function calculateStampDuty(state, price, isEV = false, isHybrid = false, fuelType = '') {
  // Input validation
  if (!state || typeof state !== 'string') {
    throw new Error('State must be provided as a valid string');
  }
  
  if (!price || price < 0) {
    throw new Error('Price must be a positive number');
  }
  
  if (price > 1000000) {
    console.warn('Very high vehicle price detected. Please verify amount.');
  }
  
  const stateUpper = state.toUpperCase().trim();
  const fuelTypeLower = fuelType.toLowerCase();
  
  // Check if vehicle qualifies as zero emission
  const isZeroEmission = isEV || 
                        fuelTypeLower.includes('electric') || 
                        fuelTypeLower.includes('hydrogen') ||
                        fuelTypeLower.includes('fuel cell');
  
  switch (stateUpper) {
    case 'VIC':
    case 'VICTORIA':
      return calculateVictoriaStampDuty(price, isZeroEmission, isHybrid);
      
    case 'NSW':
    case 'NEW SOUTH WALES':
      return calculateNSWStampDuty(price, isZeroEmission, isHybrid);
      
    case 'QLD':
    case 'QUEENSLAND':
      return calculateQueenslandStampDuty(price, isZeroEmission, isHybrid);
      
    case 'SA':
    case 'SOUTH AUSTRALIA':
      return calculateSouthAustraliaStampDuty(price, isZeroEmission, isHybrid);
      
    case 'WA':
    case 'WESTERN AUSTRALIA':
      return calculateWesternAustraliaStampDuty(price, isZeroEmission, isHybrid);
      
    case 'TAS':
    case 'TASMANIA':
      return calculateTasmaniaStampDuty(price, isZeroEmission, isHybrid);
      
    case 'ACT':
    case 'AUSTRALIAN CAPITAL TERRITORY':
      return calculateACTStampDuty(price, isZeroEmission, isHybrid);
      
    case 'NT':
    case 'NORTHERN TERRITORY':
      return calculateNorthernTerritoryStampDuty(price, isZeroEmission, isHybrid);
      
    default:
      throw new Error(`Unknown state: ${state}. Please use a valid Australian state code.`);
  }
}

/**
 * Victoria stamp duty calculation
 * Rates as of July 2025
 */
function calculateVictoriaStampDuty(price, isZeroEmission, isHybrid) {
  // Zero emission vehicle exemption
  if (isZeroEmission) {
    if (price <= 68740) {
      return 0; // Full exemption
    } else if (price <= 100000) {
      // Partial exemption - calculate on amount above $68,740
      const taxableAmount = price - 68740;
      return taxableAmount >= 60000 ? taxableAmount * 0.042 : taxableAmount * 0.033;
    }
    // Above $100k, pay full stamp duty (no concession)
  }
  
  // Standard rates for non-EVs
  if (price < 60000) {
    return price * 0.033; // 3.3%
  } else {
    return price * 0.042; // 4.2%
  }
}

/**
 * New South Wales stamp duty calculation
 */
function calculateNSWStampDuty(price, isZeroEmission, isHybrid) {
  // Calculate base stamp duty
  let stampDuty;
  if (price <= 45000) {
    stampDuty = price * 0.03; // 3%
  } else {
    stampDuty = 45000 * 0.03 + (price - 45000) * 0.05; // 3% + 5%
  }
  
  // EV rebate (effectively reduces stamp duty)
  if (isZeroEmission && price <= 78000) {
    const rebate = Math.min(3000, stampDuty); // $3,000 rebate capped at actual stamp duty
    stampDuty = Math.max(0, stampDuty - rebate);
  }
  
  return stampDuty;
}

/**
 * Queensland stamp duty calculation
 */
function calculateQueenslandStampDuty(price, isZeroEmission, isHybrid) {
  // Full exemption for zero emission vehicles
  if (isZeroEmission) {
    return 0;
  }
  
  // Standard 3% rate for all other vehicles
  return price * 0.03;
}

/**
 * South Australia stamp duty calculation
 * Complex tiered system
 */
function calculateSouthAustraliaStampDuty(price, isZeroEmission, isHybrid) {
  // EV exemption up to certain thresholds
  if (isZeroEmission && price <= 77565) {
    return 0; // Full exemption for EVs under threshold
  }
  
  // Tiered calculation
  if (price <= 1000) {
    return 0;
  } else if (price <= 2000) {
    return 15;
  } else if (price <= 3000) {
    return 15 + (price - 2000) * 0.02;
  } else if (price <= 4000) {
    return 35 + (price - 3000) * 0.03;
  } else if (price <= 7000) {
    return 65 + (price - 4000) * 0.035;
  } else if (price <= 10000) {
    return 170 + (price - 7000) * 0.04;
  } else if (price <= 20000) {
    return 290 + (price - 10000) * 0.045;
  } else if (price <= 50000) {
    return 740 + (price - 20000) * 0.05;
  } else {
    return 2240 + (price - 50000) * 0.055;
  }
}

/**
 * Western Australia stamp duty calculation
 */
function calculateWesternAustraliaStampDuty(price, isZeroEmission, isHybrid) {
  // EV concession - 50% reduction for zero emission vehicles
  let concessionMultiplier = 1;
  if (isZeroEmission) {
    concessionMultiplier = 0.5; // 50% concession
  }
  
  let stampDuty;
  if (price <= 25000) {
    stampDuty = price * 0.0275; // 2.75%
  } else if (price <= 50000) {
    stampDuty = price * 0.0285; // 2.85%
  } else {
    stampDuty = price * 0.065; // 6.5%
  }
  
  return stampDuty * concessionMultiplier;
}

/**
 * Tasmania stamp duty calculation
 */
function calculateTasmaniaStampDuty(price, isZeroEmission, isHybrid) {
  // EV concession - check if applicable
  if (isZeroEmission && price <= 70000) {
    return 0; // Exemption for EVs under $70k
  }
  
  // Standard rates
  if (price <= 7000) {
    return price * 0.03; // 3%
  } else {
    return price * 0.04; // 4%
  }
}

/**
 * ACT stamp duty calculation
 * More complex than the current 3% flat rate
 */
function calculateACTStampDuty(price, isZeroEmission, isHybrid) {
  // Zero emission vehicle exemption
  if (isZeroEmission) {
    return 0; // Full exemption
  }
  
  // Tiered system for ACT
  if (price <= 14000) {
    return price * 0.02; // 2%
  } else if (price <= 30000) {
    return 280 + (price - 14000) * 0.03; // 3%
  } else if (price <= 80000) {
    return 760 + (price - 30000) * 0.04; // 4%
  } else {
    return 2760 + (price - 80000) * 0.05; // 5%
  }
}

/**
 * Northern Territory stamp duty calculation
 */
function calculateNorthernTerritoryStampDuty(price, isZeroEmission, isHybrid) {
  // Basic EV concession
  if (isZeroEmission && price <= 50000) {
    return 0; // Exemption for lower-priced EVs
  }
  
  // Standard 3% rate (simplified)
  return price * 0.03;
}

/**
 * Get stamp duty breakdown with explanations
 * @param {string} state - State code
 * @param {number} price - Vehicle price
 * @param {boolean} isEV - Is electric vehicle
 * @param {boolean} isHybrid - Is hybrid vehicle
 * @returns {object} - Detailed breakdown
 */
export function getStampDutyBreakdown(state, price, isEV = false, isHybrid = false) {
  const baseStampDuty = calculateStampDuty(state, price, false, false); // Without concessions
  const actualStampDuty = calculateStampDuty(state, price, isEV, isHybrid); // With concessions
  const savings = baseStampDuty - actualStampDuty;
  
  return {
    state: state.toUpperCase(),
    vehiclePrice: price,
    isEV,
    isHybrid,
    baseStampDuty: Math.round(baseStampDuty),
    actualStampDuty: Math.round(actualStampDuty),
    savings: Math.round(savings),
    effectiveRate: price > 0 ? (actualStampDuty / price * 100).toFixed(2) + '%' : '0%',
    explanation: getStampDutyExplanation(state, price, isEV, isHybrid, savings)
  };
}

/**
 * Get explanation of stamp duty calculation
 */
function getStampDutyExplanation(state, price, isEV, isHybrid, savings) {
  const stateUpper = state.toUpperCase();
  
  if (savings > 0 && isEV) {
    switch (stateUpper) {
      case 'VIC':
        if (price <= 68740) {
          return 'Full EV exemption applied (under $68,740)';
        } else if (price <= 100000) {
          return 'Partial EV exemption applied (calculated on amount above $68,740)';
        }
        break;
      case 'NSW':
        return `EV rebate of $${Math.round(savings)} applied`;
      case 'QLD':
        return 'Full EV exemption applied';
      case 'SA':
        return price <= 77565 ? 'Full EV exemption applied' : 'Partial EV concession applied';
      case 'WA':
        return '50% EV concession applied';
      case 'TAS':
        return price <= 70000 ? 'Full EV exemption applied' : 'Standard rates apply';
      case 'ACT':
        return 'Full EV exemption applied';
      case 'NT':
        return price <= 50000 ? 'EV exemption applied' : 'Standard rates apply';
    }
  }
  
  return `Standard ${stateUpper} stamp duty rates applied`;
}

/**
 * Check if stamp duty rates may have changed
 * @returns {boolean} - True if rates should be reviewed
 */
export function shouldReviewRates() {
  const lastUpdated = new Date('2025-07-18'); // Update this when rates are reviewed
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  return lastUpdated < threeMonthsAgo;
}

/**
 * Get current stamp duty rate summary for all states
 * @param {number} price - Vehicle price for comparison
 * @param {boolean} isEV - Is electric vehicle
 * @returns {array} - Comparison across all states
 */
export function compareStampDutyAcrossStates(price, isEV = false) {
  const states = ['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'];
  
  return states.map(state => {
    const breakdown = getStampDutyBreakdown(state, price, isEV);
    return {
      state,
      stampDuty: breakdown.actualStampDuty,
      savings: breakdown.savings,
      effectiveRate: breakdown.effectiveRate
    };
  }).sort((a, b) => a.stampDuty - b.stampDuty);
}

// Export the original function for backwards compatibility
export { calculateStampDuty as calculateStampDutyLegacy };