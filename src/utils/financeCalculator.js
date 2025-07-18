// src/utils/financeCalculator.js
import { GST_CAP, ESTABLISHMENT_FEE, TERM_RATES,
         BROKERAGE_RATE, DEFERRAL_MONTHS,
         BALLOON_PERCENTS } from "./config.js";

export function calculateFinance(price, stamp, rego, termYears) {
  const termMonths   = termYears * 12;
  
  // Use tiered rate based on term
  const baseRate = TERM_RATES[termYears] || TERM_RATES[5]; // Default to 5-year rate if term not found
  const monthlyRate  = baseRate / 12;

  const baseVehicle  = price - stamp - rego;
  const gstExBase    = baseVehicle / 1.1;
  const gstOnCar     = baseVehicle - gstExBase;
  const claimableGST = Math.min(gstOnCar, GST_CAP * 0.1);
  const gstNonClaim  = gstOnCar - claimableGST;

  const naf          = gstExBase + gstNonClaim + stamp + rego + ESTABLISHMENT_FEE;

  const balloon      = naf * BALLOON_PERCENTS[termYears];
  const brokerage    = naf * BROKERAGE_RATE;
  const amountFin    = naf + brokerage;

  // add deferred interest
  const principalInt = amountFin * Math.pow(1 + monthlyRate, DEFERRAL_MONTHS);

  const repayments   = termMonths - DEFERRAL_MONTHS;
  const factor       = Math.pow(1 + monthlyRate, repayments);
  const monthlyPmt   = (principalInt * monthlyRate - balloon * monthlyRate / factor) / (1 - 1/factor);

  return {
    amountFinanced    : amountFin,
    monthlyPayment    : monthlyPmt,
    balloon,
    brokerage,
    termMonths,
    baseRate,          // Include the rate used
    naf               // Add NAF to the return
  };
}