// Enhanced Quote Generation Engine - integrates all utility functions properly
import { calculateFinance } from './utils/financeCalculator.js';
import { calculateStampDuty } from './utils/stampDutyCalculator.js';
import { calculateRego } from './utils/regoCalculator.js';
import { calculateRunningCosts } from './utils/runningCosts.js';
import { calculateInsurance } from './utils/insuranceCalculator.js';
import { calculateIncomeTaxSavings } from './utils/taxCalculator.js';
import { calculateAllUpRate } from './utils/allUpRateCalculator.js';
import { PAY_CYCLES } from './utils/config.js';

export class EnhancedQuoteEngine {
  constructor() {
    this.validationRules = {
      price: { min: 1000, max: 500000 },
      salary: { min: 20000, max: 500000 },
      kms: { min: 5000, max: 50000 },
      termYears: { min: 1, max: 5 },
      engineSize: { min: 0, max: 8.0 },
      businessUsePercent: { min: 0, max: 100 }
    };
  }

  // Comprehensive validation with detailed error messages
  validateQuoteData(formData) {
    const errors = [];
    const warnings = [];

    // Required fields
    const requiredFields = [
      'clientName', 'clientEmail', 'make', 'model', 'year', 
      'price', 'salary', 'kms', 'state'
    ];

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field] === '') {
        errors.push(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
      }
    });

    // Email validation
    if (formData.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      errors.push('Please enter a valid email address');
    }

    // Numeric validations
    Object.entries(this.validationRules).forEach(([field, rules]) => {
      const value = formData[field];
      if (value !== undefined && value !== null) {
        if (value < rules.min) {
          errors.push(`${field} must be at least ${rules.min.toLocaleString()}`);
        }
        if (value > rules.max) {
          errors.push(`${field} cannot exceed ${rules.max.toLocaleString()}`);
        }
      }
    });

    // Business logic warnings
    if (formData.price > formData.salary * 1.5) {
      warnings.push('Vehicle price is more than 1.5x annual salary - may affect loan approval');
    }

    if (formData.kms > 25000) {
      warnings.push('High annual kilometers may result in higher running costs');
    }

    if (formData.salary < 50000 && formData.price > 40000) {
      warnings.push('Consider a lower-priced vehicle for better affordability');
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }

  // Enhanced quote generation with comprehensive calculations
  async generateComprehensiveQuote(formData) {
    // Validate input data
    const validation = this.validateQuoteData(formData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      // Step 1: Calculate all fees and taxes
      const stampDuty = calculateStampDuty(formData.state, formData.price, formData.isEV);
      const rego = calculateRego(formData.state);
      
      // Step 2: Calculate finance details
      const finance = calculateFinance(formData.price, stampDuty, rego, formData.termYears);
      
      // Step 3: Calculate running costs with proper vehicle classification
      const runningCosts = calculateRunningCosts({
        engineType: formData.isEV ? 'electric' : 'petrol',
        engineSize: formData.engineSize || 2.0,
        fuelType: formData.fuelType || 'Petrol',
        bodyStyle: formData.bodyStyle || 'Sedan',
        annualKms: formData.kms
      });

      // Step 4: Calculate insurance
      const insurance = calculateInsurance(runningCosts.carType);

      // Step 5: Calculate total annual costs
      const annualFinanceCost = finance.monthlyPayment * 12;
      const totalAnnualCosts = annualFinanceCost + runningCosts.total + insurance;

      // Step 6: Calculate tax benefits based on FBT method
      let taxSavings = 0;
      let fbtLiability = 0;
      
      if (formData.ecm === 'Employee Contribution Method') {
        // ECM - simpler calculation
        taxSavings = calculateIncomeTaxSavings(formData.salary, totalAnnualCosts);
      } else {
        // Operating Cost Method - more complex with business use
        const businessPortion = (formData.businessUsePercent || 80) / 100;
        const deductibleAmount = totalAnnualCosts * businessPortion;
        taxSavings = calculateIncomeTaxSavings(formData.salary, deductibleAmount);
        
        // Calculate FBT liability on private use
        const privatePortion = 1 - businessPortion;
        fbtLiability = totalAnnualCosts * privatePortion * 0.47; // FBT rate
      }

      // Step 7: Calculate net position
      const netAnnualCost = totalAnnualCosts - taxSavings + fbtLiability;
      const payFrequency = PAY_CYCLES[formData.payCycle] || 12;
      const netPayDeduction = netAnnualCost / payFrequency;

      // Step 8: Calculate all-up rate for comparison
      const allUpRate = calculateAllUpRate(
        finance.naf,
        finance.monthlyPayment,
        finance.balloon,
        finance.termMonths
      );

      // Step 9: Calculate comparison with after-tax purchase
      const afterTaxPurchaseMonthly = (formData.price / (formData.termYears * 12)) + 
                                     (runningCosts.total + insurance) / 12;
      const monthlySavings = afterTaxPurchaseMonthly - netPayDeduction;
      const totalSavingsOverTerm = monthlySavings * 12 * formData.termYears;

      // Step 10: Generate recommendations
      const recommendations = this.generateRecommendations(formData, {
        netPayDeduction,
        totalSavingsOverTerm,
        allUpRate
      });

      // Step 11: Create comprehensive quote object
      const quote = {
        id: `Q-${Date.now()}`,
        timestamp: new Date().toISOString(),
        quoteRef: this.generateQuoteReference(),
        
        // Input data
        client: {
          name: formData.clientName,
          email: formData.clientEmail,
          phone: formData.phone || '',
          employer: formData.employer || '',
          salary: formData.salary,
          startDate: formData.startDate || ''
        },
        
        vehicle: {
          make: formData.make,
          model: formData.model,
          year: formData.year,
          trim: formData.trim || '',
          driveAwayPrice: formData.price,
          engineSize: formData.engineSize || 2.0,
          fuelType: formData.fuelType || 'Petrol',
          bodyStyle: formData.bodyStyle || 'Sedan',
          isEV: formData.isEV || false,
          carType: runningCosts.carType
        },
        
        lease: {
          termYears: formData.termYears,
          termMonths: formData.termYears * 12,
          annualKms: formData.kms,
          payCycle: formData.payCycle,
          fbtMethod: formData.ecm,
          businessUsePercent: formData.businessUsePercent || 0,
          state: formData.state
        },
        
        // Calculated breakdown
        costs: {
          vehiclePrice: formData.price,
          stampDuty: Math.round(stampDuty),
          registration: rego,
          establishmentFee: 500,
          brokerage: Math.round(finance.brokerage),
          naf: Math.round(finance.naf),
          totalAnnualCosts: Math.round(totalAnnualCosts)
        },
        
        finance: {
          amountFinanced: Math.round(finance.amountFinanced),
          monthlyPayment: Math.round(finance.monthlyPayment),
          annualPayment: Math.round(finance.monthlyPayment * 12),
          balloon: Math.round(finance.balloon),
          balloonPercent: Math.round((finance.balloon / finance.naf) * 100),
          interestRate: 6.20,
          allUpRate: allUpRate,
          totalInterest: Math.round((finance.monthlyPayment * finance.termMonths) + finance.balloon - finance.naf)
        },
        
        runningCosts: {
          annual: Math.round(runningCosts.total),
          insurance: Math.round(insurance),
          fuel: runningCosts.fuel,
          service: runningCosts.service,
          tyres: runningCosts.tyres,
          rego: runningCosts.rego,
          breakdown: {
            fuelPerKm: formData.isEV ? 0.042 : 0.15,
            serviceInterval: 15000,
            tyreLife: 50000
          }
        },
        
        tax: {
          method: formData.ecm,
          annualSavings: Math.round(taxSavings),
          fbtLiability: Math.round(fbtLiability),
          netAnnualCost: Math.round(netAnnualCost),
          payDeduction: Math.round(netPayDeduction),
          payCycle: formData.payCycle,
          marginalTaxRate: this.getMarginalTaxRate(formData.salary)
        },
        
        comparison: {
          afterTaxPurchase: Math.round(afterTaxPurchaseMonthly),
          novatedLease: Math.round(netPayDeduction),
          monthlySavings: Math.round(monthlySavings),
          totalSavings: Math.round(totalSavingsOverTerm),
          savingsPercent: Math.round((monthlySavings / afterTaxPurchaseMonthly) * 100)
        },
        
        summary: {
          totalCostOfOwnership: Math.round(totalAnnualCosts * formData.termYears),
          totalTaxSavings: Math.round(taxSavings * formData.termYears),
          totalNetCost: Math.round(netAnnualCost * formData.termYears),
          effectiveVehicleCost: Math.round(formData.price - (taxSavings * formData.termYears)),
          breakEvenMonth: this.calculateBreakEven(monthlySavings, formData.price)
        },
        
        recommendations,
        
        // Metadata
        calculationVersion: '2.0',
        validUntil: this.getExpiryDate(),
        terms: this.getTermsAndConditions(),
        disclaimers: this.getDisclaimers()
      };

      // Add validation warnings if any
      if (validation.warnings.length > 0) {
        quote.warnings = validation.warnings;
      }

      return {
        success: true,
        quote,
        calculations: {
          stepByStep: this.getStepByStepCalculations(formData, quote),
          assumptions: this.getCalculationAssumptions()
        }
      };

    } catch (error) {
      console.error('Quote generation error:', error);
      return {
        success: false,
        error: error.message,
        details: error.stack
      };
    }
  }

  // Generate intelligent recommendations
  generateRecommendations(formData, results) {
    const recommendations = [];

    // Financial recommendations
    if (results.totalSavingsOverTerm > 10000) {
      recommendations.push({
        type: 'savings',
        priority: 'high',
        title: 'Excellent Tax Savings',
        message: `This novated lease will save you ${this.formatCurrency(results.totalSavingsOverTerm)} over ${formData.termYears} years compared to after-tax purchase.`
      });
    }

    if (results.allUpRate > 10) {
      recommendations.push({
        type: 'warning',
        priority: 'medium',
        title: 'Consider Shorter Term',
        message: 'The all-up rate is higher than market rates. Consider a shorter lease term or larger deposit.'
      });
    }

    // Vehicle recommendations
    if (formData.isEV) {
      recommendations.push({
        type: 'benefit',
        priority: 'high',
        title: 'Electric Vehicle Benefits',
        message: 'EVs often qualify for additional government incentives and lower FBT rates.'
      });
    }

    if (formData.kms > 20000) {
      recommendations.push({
        type: 'advice',
        priority: 'medium',
        title: 'High Mileage Considerations',
        message: 'With high annual mileage, consider vehicles with better fuel efficiency or hybrid options.'
      });
    }

    // Term recommendations
    if (formData.termYears >= 4 && formData.price < 30000) {
      recommendations.push({
        type: 'advice',
        priority: 'low',
        title: 'Consider Shorter Term',
        message: 'For lower-value vehicles, shorter lease terms often provide better value.'
      });
    }

    return recommendations;
  }

  // Helper methods
  generateQuoteReference() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const time = date.getTime().toString().slice(-4);
    return `Q-${dateStr}-${time}`;
  }

  getMarginalTaxRate(salary) {
    if (salary <= 18200) return 0;
    if (salary <= 45000) return 19;
    if (salary <= 135000) return 30;
    if (salary <= 190000) return 37;
    return 45;
  }

  calculateBreakEven(monthlySavings, vehiclePrice) {
    if (monthlySavings <= 0) return null;
    const setupCosts = 1000; // Approximate setup costs
    return Math.ceil(setupCosts / monthlySavings);
  }

  getExpiryDate() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString();
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getStepByStepCalculations(formData, quote) {
    return {
      step1: {
        title: 'Vehicle Costs',
        details: {
          driveAwayPrice: formData.price,
          stampDuty: quote.costs.stampDuty,
          registration: quote.costs.registration,
          establishmentFee: quote.costs.establishmentFee
        }
      },
      step2: {
        title: 'Finance Calculation',
        details: {
          naf: quote.costs.naf,
          brokerage: quote.costs.brokerage,
          monthlyPayment: quote.finance.monthlyPayment,
          balloon: quote.finance.balloon
        }
      },
      step3: {
        title: 'Running Costs',
        details: {
          fuel: quote.runningCosts.fuel,
          insurance: quote.runningCosts.insurance,
          service: quote.runningCosts.service,
          tyres: quote.runningCosts.tyres,
          total: quote.runningCosts.annual
        }
      },
      step4: {
        title: 'Tax Calculation',
        details: {
          totalAnnualCosts: quote.costs.totalAnnualCosts,
          taxSavings: quote.tax.annualSavings,
          netCost: quote.tax.netAnnualCost,
          payDeduction: quote.tax.payDeduction
        }
      }
    };
  }

  getCalculationAssumptions() {
    return {
      interestRate: '6.20% p.a. (subject to credit approval)',
      fuelPrice: '$2.00/L petrol, $2.10/L diesel',
      insuranceCost: '$1,900 annually (varies by vehicle and driver)',
      serviceCost: '$480 per service (15,000km intervals)',
      tyreCost: '$300 per set (50,000km life)',
      taxYear: '2024-25 tax rates',
      gstCap: '$63,340 (ATO motor vehicle limit)',
      fbtRate: '47% (2024-25 rate)'
    };
  }

  getTermsAndConditions() {
    return [
      'Quote valid for 30 days from issue date',
      'Finance subject to credit approval',
      'Interest rates may vary based on credit assessment',
      'Vehicle must be used for business purposes to qualify for tax benefits',
      'FBT implications may apply - consult your tax advisor',
      'All quotes are estimates and final costs may vary'
    ];
  }

  getDisclaimers() {
    return [
      'This quote is for illustration purposes only and does not constitute a formal offer',
      'Tax savings are estimates and individual circumstances may vary',
      'Professional tax advice should be sought before making financial decisions',
      'Vehicle prices and availability subject to change',
      'millarX acts as a credit representative and may receive commission from lenders'
    ];
  }
}

// Export the enhanced quote generation function
export async function generateEnhancedQuote(formData) {
  const engine = new EnhancedQuoteEngine();
  return await engine.generateComprehensiveQuote(formData);
}

// Utility function for real-time quote preview
export function generateQuotePreview(formData) {
  try {
    if (!formData.price || !formData.salary) {
      return null;
    }

    // Quick estimate for preview
    const estimatedMonthlyPayment = formData.price * 0.02; // Rough 2% of vehicle price
    const estimatedTaxSavings = formData.salary * 0.1; // Rough 10% of salary
    const estimatedNetCost = estimatedMonthlyPayment - (estimatedTaxSavings / 12);

    return {
      monthlyPayment: Math.round(estimatedMonthlyPayment),
      annualTaxSavings: Math.round(estimatedTaxSavings),
      netMonthlyCost: Math.round(Math.max(0, estimatedNetCost)),
      isEstimate: true
    };
  } catch (error) {
    console.error('Preview generation error:', error);
    return null;
  }
}

// Export validation utilities
export { EnhancedQuoteEngine };