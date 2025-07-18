// src/utils/config.js
export const GST_CAP          = 63_340;   // ATO motor-vehicle cap (ex-GST)
export const ESTABLISHMENT_FEE = 500;

// Tiered rates based on term - shorter terms = higher rates (like asset funding)
export const TERM_RATES = {
  1: 0.1000,    // 10.00% for 1 year
  2: 0.0865,    // 8.65% for 2 years  
  3: 0.0739,    // 7.39% for 3 years (updated)
  4: 0.0735,    // 7.35% for 4 years (updated)
  5: 0.0730     // 7.30% for 5 years
};

export const BROKERAGE_RATE    = 0.02;    // 2% of NAF 
export const DEFERRAL_MONTHS   = 1;       // 1 month 

export const BALLOON_PERCENTS = { 1:0.6563, 2:0.5625, 3:0.4688, 4:0.3750, 5:0.2813 };

export const RUN_MULT = {               // variable-cost multipliers
  UTE: 1.00, LARGE_UTE: 1.15, SUV: 0.95,
  HATCH: 0.90, SEDAN: 1.00, EV: 0.85
};

export const PAY_CYCLES = { Weekly:52, Fortnightly:26, Monthly:12 };