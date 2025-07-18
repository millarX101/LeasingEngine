// src/utils/funderManager.js
import { calculateFinance } from "./financeCalculator.js";
import { FUNDER_RATES } from "./config.js";

export class FunderManager {
  constructor() {
    this.currentRates = { ...FUNDER_RATES };
    this.rateHistory = [];
  }

  // Update a specific funder's rate
  updateFunderRate(funder, newRate, reason = '') {
    const oldRate = this.currentRates[funder];
    this.currentRates[funder] = newRate;
    
    this.rateHistory.push({
      funder,
      previousRate: oldRate,
      newRate: newRate,
      timestamp: new Date(),
      reason: reason
    });
  }

  // Get current rates for all funders
  getCurrentRates() {
    return { ...this.currentRates };
  }

  // Compare quotes across all funders
  compareAllFunders(price, stamp, rego, termYears) {
    const results = [];
    
    Object.entries(this.currentRates).forEach(([funder, rate]) => {
      const quote = calculateFinance(price, stamp, rego, termYears, rate);
      
      results.push({
        funder: funder.toUpperCase(),
        rate: (rate * 100).toFixed(2),
        baseRate: rate,
        monthlyPayment: quote.monthlyPayment,
        allUpRate: quote.allUpRate,
        balloon: quote.balloon,
        totalCost: (quote.monthlyPayment * quote.termMonths) + quote.balloon,
        quote
      });
    });

    // Sort by monthly payment (lowest first)
    return results.sort((a, b) => a.monthlyPayment - b.monthlyPayment);
  }

  // Get best rate available
  getBestRate() {
    const rates = Object.values(this.currentRates);
    return Math.min(...rates);
  }

  // Get best funder
  getBestFunder() {
    const bestRate = this.getBestRate();
    return Object.entries(this.currentRates)
      .find(([funder, rate]) => rate === bestRate)?.[0];
  }

  // Get rate history
  getRateHistory() {
    return [...this.rateHistory];
  }
}

// Create singleton instance
export default new FunderManager();