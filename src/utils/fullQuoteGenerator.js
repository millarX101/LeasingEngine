// src/utils/fullQuoteGenerator.js

import { PAY_CYCLES } from "./config.js";
import { calculateStampDuty } from "./stampDutyCalculator.js";
import { calculateRunningCosts } from "./runningCosts.js";
import { calculateRego } from "./regoCalculator.js";
import { calculateInsurance } from "./insuranceCalculator.js";
import { calculateFinance } from "./financeCalculator.js";
import { calculateAllUpRate } from "./allUpRateCalculator.js";
import { calculateIncomeTaxSavings } from "./taxCalculator.js";

/**
 * Generate a complete novated lease quote.
 * 
 * @param {object} raw - Raw form input from UI
 * @param {object|null} runningOverride - Optional override for running costs
 * @returns {object} Full quote output for UI
 */
export function generateFullQuote(raw, runningOverride = null) {
  // ---------- Parse numeric inputs ----------
  const params = {
    ...raw,
    price: +raw.price || 0,
    kms: +raw.kms || 0,
    salary: +raw.salary || 0,
    termYears: +raw.termYears || 5,
  };

  const {
    state, price, isEV, carType, kms, salary, termYears,
    payCycle, engineType, engineSize, fuelType
  } = params;

  // ---------- Up-front costs ----------
  const stampDuty = calculateStampDuty(state, price, isEV);
  const rego = calculateRego(state);
  const insurance = calculateInsurance(carType);

  // ---------- Running costs ----------
  const baseRunning = runningOverride || calculateRunningCosts({
    engineType,
    engineSize,
    fuelType,
    bodyStyle: carType,
    annualKms: kms,
    isEV
  });

  const annualRunningCosts = {
    registration: rego,
    insurance,
    service: baseRunning.service,
    tyres: baseRunning.tyres,
    fuel: baseRunning.fuel,
  };

  const runningTotal = Object.values(annualRunningCosts).reduce((acc, val) => acc + (val || 0), 0);

  // ---------- Finance ----------
  const finance = calculateFinance(price, stampDuty, rego, termYears);
  finance.allUpRate = calculateAllUpRate(
    finance.amountFinanced,
    finance.monthlyPayment,
    finance.balloon,
    finance.termMonths
  );

  const annualFinance = finance.monthlyPayment * 12;
  const annualTotal = annualFinance + runningTotal;

  // ---------- ECM + Tax ----------
  const ecmAnnual = isEV ? 0 : (price - rego - stampDuty) * 0.20;
  const taxableBaseAnnual = annualTotal - ecmAnnual;
  const taxSavedAnnual = calculateIncomeTaxSavings(salary, taxableBaseAnnual);

  // ---------- Pay Cycle ----------
  const divisor = PAY_CYCLES[payCycle] ?? 12;

  const runningPerCycle = Object.fromEntries(
    Object.entries(annualRunningCosts).map(([k, v]) => [k, v / divisor])
  );

  // ---------- Final Quote Output ----------
  return {
    finance,
    running: runningPerCycle,
    leasePerCycle: annualTotal / divisor,
    taxPerCycle: taxSavedAnnual / divisor,
    oopPerCycle: (annualTotal - taxSavedAnnual) / divisor,
    effectiveRate: finance.allUpRate,
    isEV
  };
}
