// src/utils/financeCalculator.js
import { GST_CAP, ESTABLISHMENT_FEE, BASE_RATE,
         BROKERAGE_RATE, DEFERRAL_MONTHS,
         BALLOON_PERCENTS } from "./config.js";

export function calculateFinance(price, stamp, rego, termYears) {
  const termMonths   = termYears*12;
  const monthlyRate  = BASE_RATE/12;

  const baseVehicle  = price - stamp - rego;
  const gstExBase    = baseVehicle/1.1;
  const gstOnCar     = baseVehicle-gstExBase;
  const claimableGST = Math.min(gstOnCar, GST_CAP*0.1);
  const gstNonClaim  = gstOnCar - claimableGST;

  const naf          = gstExBase + gstNonClaim + stamp + rego + ESTABLISHMENT_FEE;

  const balloon      = naf * BALLOON_PERCENTS[termYears];
  const brokerage    = naf * BROKERAGE_RATE;
  const amountFin    = naf + brokerage;

  // add deferred interest
  const principalInt = amountFin * (1+monthlyRate)**DEFERRAL_MONTHS;

  const repayments   = termMonths - DEFERRAL_MONTHS;
  const factor       = (1+monthlyRate)**repayments;
  const monthlyPmt   = (principalInt*monthlyRate - balloon*monthlyRate/factor) / (1-1/factor);

  return {
    amountFinanced    : amountFin,
    monthlyPayment    : monthlyPmt,
    balloon,
    brokerage,
    termMonths
  };
}
