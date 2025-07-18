// src/hooks/useFunderRates.js
import { useState, useCallback } from 'react';
import funderManager from '../utils/funderManager.js';
import { calculateStampDuty } from '../utils/stampDutyCalculator.js';
import { calculateRego } from '../utils/regoCalculator.js';

export function useFunderRates() {
  const [rates, setRates] = useState(funderManager.getCurrentRates());
  const [rateHistory, setRateHistory] = useState(funderManager.getRateHistory());

  const updateRate = useCallback((funder, newRate, reason) => {
    funderManager.updateFunderRate(funder, newRate, reason);
    setRates(funderManager.getCurrentRates());
    setRateHistory(funderManager.getRateHistory());
  }, []);

  const compareRates = useCallback((vehiclePrice, state = 'VIC', termYears = 3) => {
    const stampDuty = calculateStampDuty(state, vehiclePrice);
    const rego = calculateRego(state);
    
    return funderManager.compareAllFunders(vehiclePrice, stampDuty, rego, termYears);
  }, []);

  const getBestQuote = useCallback((vehiclePrice, state = 'VIC', termYears = 3) => {
    const comparison = compareRates(vehiclePrice, state, termYears);
    return comparison[0]; // First item is best (sorted by monthly payment)
  }, [compareRates]);

  return {
    rates,
    rateHistory,
    updateRate,
    compareRates,
    getBestQuote,
    bestFunder: funderManager.getBestFunder(),
    bestRate: funderManager.getBestRate()
  };
}