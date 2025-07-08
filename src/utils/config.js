// src/utils/config.js
export const GST_CAP          = 63_340;   // ATO motor-vehicle cap (ex-GST)
export const ESTABLISHMENT_FEE = 500;
export const BASE_RATE         = 0.0685;   // 6.95 % p.a.
export const BROKERAGE_RATE    = 0.04;     // 4 % of NAF
export const DEFERRAL_MONTHS   = 2;

export const BALLOON_PERCENTS = { 1:0.6563, 2:0.5625, 3:0.4688, 4:0.3750, 5:0.2813 };

export const RUN_MULT = {               // variable-cost multipliers
  UTE: 1.00, LARGE_UTE: 1.15, SUV: 0.95,
  HATCH: 0.90, SEDAN: 1.00, EV: 0.85
};

export const PAY_CYCLES = { Weekly:52, Fortnightly:26, Monthly:12 };
