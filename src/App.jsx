import React, { useState, useMemo } from 'react';
import { Calculator, Car, DollarSign, FileText, TrendingUp, Clock, CheckCircle, Download, Mail, Send, ExternalLink } from 'lucide-react';

// Import utility functions from actual files
import { calculateFinance } from './utils/financeCalculator.js';
import { calculateStampDuty } from './utils/stampDutyCalculator.js';
import { calculateRego } from './utils/regoCalculator.js';
import { calculateInsurance } from './utils/insuranceCalculator.js';
import { calculateRunningCosts } from './utils/runningCosts.js';
import { calculateIncomeTaxSavings } from './utils/taxCalculator.js';
import { TERM_RATES, ESTABLISHMENT_FEE } from './utils/config.js';

// Import new services
import { saveQuote } from './utils/supabase.js';
import { downloadQuotePDF } from './utils/pdfGenerator.js';
import { sendQuoteEmail, isEmailConfigured } from './utils/emailService.js';

// CORRECTED FBT and RFBT calculations for novated leases
function calculateFBTAndRFBT(costs, fbtMethod, isEV, businessUsePercent = 0, vehiclePrice = 0, stampDuty = 0, rego = 0) {
  const { totalAnnual } = costs;

  // EV FBT exemption thresholds (2024-25)
  const EV_FBT_THRESHOLD = 84916; // Luxury car tax threshold for EVs
  const FBT_RATE = 0.47; // 47%
  const STATUTORY_RATE = 0.20; // 20%
  
  // Calculate FBT base value (vehicle price minus government on-road costs)
  const governmentOnRoadCosts = stampDuty + rego;
  const fbtBaseValue = vehiclePrice - governmentOnRoadCosts;
  
  let preTaxAmount = 0;
  let postTaxAmount = 0;
  let fbtTaxableValue = 0;
  let fbtLiability = 0;
  let employeeContribution = 0;
  let rfbt = 0;

  if (isEV && vehiclePrice <= EV_FBT_THRESHOLD) {
    // EV FBT Exemption - 100% pre-tax, but reportable
    preTaxAmount = totalAnnual;
    postTaxAmount = 0;
    fbtTaxableValue = 0;
    fbtLiability = 0;
    employeeContribution = 0;
    rfbt = totalAnnual; // Full amount is reportable for EVs under exemption
    
  } else if (fbtMethod === 'Employee Contribution Method') {
    // ECM: Employee pays 20% of FBT base value post-tax
    
    // Step 1: Calculate the FBT base value (vehicle price minus government charges)
    const fbtBaseValue = vehiclePrice - governmentOnRoadCosts;
    
    // Step 2: Employee contribution is 20% of FBT base value (paid post-tax)
    employeeContribution = fbtBaseValue * 0.20; // 20% of base value
    
    // Step 3: Split the total annual cost
    postTaxAmount = employeeContribution;
    preTaxAmount = totalAnnual - postTaxAmount;
    
    // Step 4: FBT calculation for reference
    fbtTaxableValue = fbtBaseValue * STATUTORY_RATE; // 20% for FBT purposes
    
    // Result: FBT liability is reduced to zero by employee contribution
    fbtLiability = 0;
    rfbt = 0; // No RFBT under properly structured ECM
    
  } else {
    // OCM: Operating Cost Method based on business/private use split
    const businessUseDecimal = businessUsePercent / 100;
    const privateUseDecimal = (100 - businessUsePercent) / 100;
    
    // Only private use portion is subject to FBT
    preTaxAmount = totalAnnual * businessUseDecimal; // Business use is pre-tax
    postTaxAmount = totalAnnual * privateUseDecimal; // Private use is post-tax
    
    // FBT is calculated on private use portion of total operating costs
    fbtTaxableValue = totalAnnual * privateUseDecimal;
    fbtLiability = 0; // Should be zero if properly structured (only business use is salary sacrificed)
    employeeContribution = 0;
    rfbt = postTaxAmount; // Private use component is reportable
  }

  return {
    fbtBaseValue: Math.round(fbtBaseValue),
    fbtTaxableValue: Math.round(fbtTaxableValue),
    fbtLiability: Math.round(fbtLiability),
    employeeContribution: Math.round(employeeContribution),
    preTaxAmount: Math.round(preTaxAmount),
    postTaxAmount: Math.round(postTaxAmount),
    rfbt: Math.round(rfbt),
    method: fbtMethod,
    isEVExempt: isEV && vehiclePrice <= EV_FBT_THRESHOLD,
    businessUsePercent
  };
}

// Enhanced tax calculation with CORRECT FBT handling
function calculateEnhancedTaxSavings(income, costs, fbtMethod, isEV, businessUsePercent = 0, vehiclePrice = 0, stampDuty = 0, rego = 0) {
  const fbtCalc = calculateFBTAndRFBT(costs, fbtMethod, isEV, businessUsePercent, vehiclePrice, stampDuty, rego);
  
  // Tax savings only apply to the pre-tax component
  const incomeTaxSavings = calculateIncomeTaxSavings(income, fbtCalc.preTaxAmount);
  
  // Medicare levy savings (2% of pre-tax amount)
  const medicareLevy = fbtCalc.preTaxAmount * 0.02;
  
  const totalTaxSavings = incomeTaxSavings + medicareLevy;
  
  // Net cost = total cost - tax savings
  const netAnnualCost = costs.totalAnnual - totalTaxSavings;
  
  return {
    ...fbtCalc,
    incomeTaxSavings: Math.round(incomeTaxSavings),
    medicareLevy: Math.round(medicareLevy),
    totalTaxSavings: Math.round(totalTaxSavings),
    netAnnualCost: Math.round(netAnnualCost)
  };
}

export default function NovatedLeaseCalculator() {
  const [activeStep, setActiveStep] = useState(1);
  
  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    phone: '',
    make: '',
    model: '',
    year: '',
    trim: '',
    price: 0,
    engineSize: 2.0,
    fuelType: 'Petrol',
    bodyStyle: 'sedan',
    state: 'VIC',
    isEV: false,
    salary: 0,
    kms: 15000,
    termYears: 5,
    payCycle: 'Monthly',
    fbtMethod: 'Employee Contribution Method',
    businessUsePercent: 20, // Default to 20% for OCM
    employer: '',
    startDate: ''
  });

  const [quote, setQuote] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);

  const steps = [
    { id: 1, title: 'Personal Details', icon: FileText },
    { id: 2, title: 'Vehicle Selection', icon: Car },
    { id: 3, title: 'Financial Details', icon: DollarSign },
    { id: 4, title: 'Quote Results', icon: Calculator }
  ];

  const handleInputChange = (name, value) => {
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      
      // When EV is selected, set engine size to 0 and fuel type to Electric
      if (name === 'isEV' && value === true) {
        updated.engineSize = 0;
        updated.fuelType = 'Electric';
      }
      // When EV is deselected, reset engine size to default
      else if (name === 'isEV' && value === false && prev.engineSize === 0) {
        updated.engineSize = 2.0;
        if (updated.fuelType === 'Electric') {
          updated.fuelType = 'Petrol';
        }
      }
      
      return updated;
    });
  };

  // Get quick preview for sidebar
  const quickPreview = useMemo(() => {
    if (form.price > 0 && form.salary > 0) {
      const stampDuty = calculateStampDuty(form.state, form.price, form.isEV);
      const rego = calculateRego(form.state);
      const finance = calculateFinance(form.price, stampDuty, rego, form.termYears);
      
      // Quick tax savings estimate
      const estimatedAnnualCosts = finance.monthlyPayment * 12 + 6000; // Finance + running costs estimate
      const estimatedTaxSavings = form.isEV && form.price <= 84916 ? 
        estimatedAnnualCosts * 0.32 : // EV gets higher savings
        estimatedAnnualCosts * 0.25; // Regular vehicle
      
      return {
        monthlyPayment: finance.monthlyPayment,
        baseRate: finance.baseRate,
        estimatedTaxSavings
      };
    }
    return null;
  }, [form.price, form.state, form.termYears, form.salary, form.isEV]);

  const generateQuote = async () => {
    setIsCalculating(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const stampDuty = calculateStampDuty(form.state, form.price, form.isEV);
      const rego = calculateRego(form.state);
      const insurance = calculateInsurance(form.isEV ? 'EV' : 'SEDAN');
      
      const finance = calculateFinance(form.price, stampDuty, rego, form.termYears);
      const runningCosts = calculateRunningCosts({
        engineType: form.isEV ? 'electric' : 'petrol',
        engineSize: form.engineSize,
        fuelType: form.fuelType,
        bodyStyle: form.bodyStyle,
        annualKms: form.kms
      });
      
      // Annual costs breakdown - Finance + Running costs + Management fee
      const annualFinanceCost = finance.monthlyPayment * 12;
      const managementFee = 20 * 1.1 * 12; // $20+GST per month = $264 per year
      const annualRunningCosts = rego + insurance + runningCosts.fuel + runningCosts.service + runningCosts.tyres + managementFee;
      const totalAnnualCosts = annualFinanceCost + annualRunningCosts;
      
      const costs = {
        stampDuty,
        rego,
        insurance,
        runningCosts,
        managementFee,
        annualFinanceCost,
        annualRunningCosts,
        totalAnnual: totalAnnualCosts
      };
      
      // Enhanced tax calculation with CORRECTED FBT handling
      const taxCalc = calculateEnhancedTaxSavings(
        form.salary, 
        costs, 
        form.fbtMethod, 
        form.isEV, 
        form.businessUsePercent,
        form.price,  // vehicle price
        stampDuty,   // stamp duty
        rego         // registration
      );
      
      const payFrequency = form.payCycle === 'Weekly' ? 52 : form.payCycle === 'Fortnightly' ? 26 : 12;
      const payAmount = taxCalc.netAnnualCost / payFrequency;
      
      const quoteData = {
        // Data structure for database
        customerName: form.clientName,
        customerEmail: form.clientEmail,
        customerPhone: form.phone,
        employer: form.employer,
        state: form.state,
        vehicleMake: form.make,
        vehicleModel: form.model,
        vehicleYear: form.year,
        vehicleTrim: form.trim,
        vehiclePrice: form.price,
        engineSize: form.engineSize,
        fuelType: form.fuelType,
        bodyStyle: form.bodyStyle,
        isEV: form.isEV,
        income: form.salary,
        annualKms: form.kms,
        termYears: form.termYears,
        payCycle: form.payCycle,
        fbtMethod: form.fbtMethod,
        businessUsePercent: form.businessUsePercent,
        
        // Calculated values
        amountFinanced: finance.amountFinanced,
        monthlyPayment: finance.monthlyPayment,
        balloonPayment: finance.balloon,
        baseRate: finance.baseRate,
        establishmentFee: ESTABLISHMENT_FEE,
        brokerage: finance.brokerage,
        naf: finance.naf,
        stampDuty,
        registration: rego,
        runningCosts: {
          insurance,
          rego,
          fuel: runningCosts.fuel,
          service: runningCosts.service,
          tyres: runningCosts.tyres,
          managementFee,
          total: annualRunningCosts
        },
        
        // Tax calculations
        taxSavings: taxCalc.totalTaxSavings,
        reportableBenefit: taxCalc.rfbt,
        
        // Additional data for display
        costs,
        taxDetails: taxCalc,
        payAmount,
        
        // Quote metadata
        id: `Q-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
      
      setQuote(quoteData);
      setActiveStep(4);
    } catch (error) {
      console.error('Quote generation failed:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle quote submission
  const handleSubmitApplication = async () => {
    if (!quote) return;
    
    setIsSubmitting(true);
    setSubmissionStatus(null);
    
    try {
      // Save quote to Supabase
      const saveResult = await saveQuote(quote);
      if (!saveResult.success) {
        throw new Error(saveResult.error);
      }

      setSubmissionStatus('success');
      
      // Redirect to application form after short delay
      setTimeout(() => {
        const applicationUrl = `https://www.millarx.com.au/finance-application-from?quote=${quote.id}`;
        window.open(applicationUrl, '_blank');
      }, 2000);
      
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!quote) return;
    
    setIsDownloading(true);
    try {
      await downloadQuotePDF(quote);
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle email quote
  const handleEmailQuote = async () => {
    if (!quote) return;
    
    setIsEmailing(true);
    try {
      const result = await sendQuoteEmail(quote);
      if (result.success) {
        alert(`Quote emailed successfully to ${quote.customerEmail}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Email error:', error);
      alert('Error sending email. Please try again or contact us directly.');
    } finally {
      setIsEmailing(false);
    }
  };

  const canProceed = (step) => {
    switch (step) {
      case 1:
        return form.clientName && form.clientEmail && form.phone;
      case 2:
        return form.make && form.model && form.year && form.price > 0;
      case 3:
        return form.salary > 0 && form.kms > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-purple-600 text-white p-2 rounded-lg">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">millarX DriveIQ</h1>
                <p className="text-sm text-gray-600">Novated Lease Calculator</p>
              </div>
            </div>

            {quote && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Quote ID</p>
                <p className="font-mono text-purple-600">{quote.id}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  activeStep >= step.id 
                    ? 'bg-purple-600 border-purple-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {activeStep > step.id ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 w-24 mx-4 ${
                    activeStep > step.id ? 'bg-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            {steps.map(step => (
              <div key={step.id} className="text-center">
                <p className={`text-sm font-medium ${
                  activeStep >= step.id ? 'text-purple-600' : 'text-gray-400'
                }`}>
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Step 1: Personal Details */}
              {activeStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Details</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={form.clientName}
                        onChange={(e) => handleInputChange('clientName', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        value={form.clientEmail}
                        onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="0400 123 456"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employer</label>
                      <input
                        type="text"
                        value={form.employer}
                        onChange={(e) => handleInputChange('employer', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Company Name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <select
                      value={form.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'].map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Vehicle Selection */}
              {activeStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Vehicle Selection</h2>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                      <input
                        type="text"
                        value={form.make}
                        onChange={(e) => handleInputChange('make', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Toyota"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                      <input
                        type="text"
                        value={form.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Camry"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                      <input
                        type="text"
                        value={form.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="2024"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Variant/Trim</label>
                    <input
                      type="text"
                      value={form.trim}
                      onChange={(e) => handleInputChange('trim', e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ascent Sport"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Drive-Away Price *</label>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="45000"
                      />
                    </div>
                    
                    {!form.isEV && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Engine Size (L)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={form.engineSize}
                          onChange={(e) => handleInputChange('engineSize', parseFloat(e.target.value) || 0)}
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="2.0"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                      <select
                        value={form.fuelType}
                        onChange={(e) => handleInputChange('fuelType', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Electric">Electric</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Body Style</label>
                      <select
                        value={form.bodyStyle}
                        onChange={(e) => handleInputChange('bodyStyle', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="sedan">Sedan</option>
                        <option value="hatchback">Hatchback</option>
                        <option value="suv">SUV</option>
                        <option value="pickup">Ute</option>
                        <option value="coupe">Coupe</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.isEV}
                      onChange={(e) => handleInputChange('isEV', e.target.checked)}
                      className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                    />
                    <label className="ml-3 text-sm font-medium text-gray-700">
                      This is an Electric Vehicle (EV)
                    </label>
                  </div>
                </div>
              )}

              {/* Step 3: Financial Details */}
              {activeStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Details</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Annual Salary (before tax) *</label>
                      <input
                        type="number"
                        value={form.salary}
                        onChange={(e) => handleInputChange('salary', parseInt(e.target.value) || 0)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="80000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Annual Kilometres *</label>
                      <input
                        type="number"
                        value={form.kms}
                        onChange={(e) => handleInputChange('kms', parseInt(e.target.value) || 0)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="15000"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lease Term</label>
                      <select
                        value={form.termYears}
                        onChange={(e) => handleInputChange('termYears', parseInt(e.target.value))}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {[1, 2, 3, 4, 5].map(year => (
                          <option key={year} value={year}>{year} Year{year > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pay Cycle</label>
                      <select
                        value={form.payCycle}
                        onChange={(e) => handleInputChange('payCycle', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="Weekly">Weekly</option>
                        <option value="Fortnightly">Fortnightly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">FBT Method</label>
                    <select
                      value={form.fbtMethod}
                      onChange={(e) => handleInputChange('fbtMethod', e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="Employee Contribution Method">Employee Contribution Method (ECM)</option>
                      <option value="Operating Cost Method">Operating Cost Method (OCM)</option>
                    </select>
                    <p className="text-sm text-gray-600 mt-1">
                      {form.fbtMethod === 'Employee Contribution Method' 
                        ? 'Employee pays 20% of car value post-tax, remainder is pre-tax' 
                        : 'Business use % pre-tax, personal use % post-tax'}
                    </p>
                  </div>
                  
                  {form.fbtMethod === "Operating Cost Method" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Use Percentage</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.businessUsePercent}
                        onChange={(e) => handleInputChange('businessUsePercent', parseInt(e.target.value) || 0)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="20"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Only business use % is pre-tax. Typical range: 20-80%
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Quote Results - UPDATED WITH CORRECTED FBT DISPLAY */}
              {activeStep === 4 && quote && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Novated Lease Quote</h2>
                    <p className="text-gray-600">Complete quote with corrected FBT calculations</p>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm">Your {form.payCycle} Deduction</p>
                          <p className="text-3xl font-bold">${Math.round(quote.payAmount).toLocaleString()}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-purple-200" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm">Annual Tax Savings</p>
                          <p className="text-3xl font-bold">${Math.round(quote.taxDetails.totalTaxSavings).toLocaleString()}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-200" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Base Rate ({quote.termYears}yr)</p>
                          <p className="text-3xl font-bold">{(quote.baseRate * 100).toFixed(2)}%</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-blue-200" />
                      </div>
                    </div>
                  </div>

                  {/* EV RFBT Notice */}
                  {quote.isEV && quote.taxDetails.rfbt > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                        Electric Vehicle - RFBT Information
                      </h3>
                      <div className="text-yellow-700 space-y-2">
                        <p><strong>EV FBT Status:</strong> {quote.taxDetails.isEVExempt ? 'FBT Exempt' : 'Subject to FBT'}</p>
                        <p><strong>Reportable Fringe Benefit (RFBT):</strong> ${Math.round(quote.taxDetails.rfbt).toLocaleString()}</p>
                        <p className="text-sm">
                          This RFBT amount will appear on your payment summary but doesn't affect your tax payable.
                          It may impact certain income-tested government benefits.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CORRECTED FBT Method Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      FBT Method: {quote.taxDetails.method}
                    </h3>
                    <div className="text-blue-700 space-y-2">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p><strong>Vehicle Price:</strong> ${quote.vehiclePrice.toLocaleString()}</p>
                          <p><strong>FBT Base Value:</strong> ${quote.taxDetails.fbtBaseValue.toLocaleString()}</p>
                          <p><strong>FBT Taxable Value (20%):</strong> ${quote.taxDetails.fbtTaxableValue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p><strong>Pre-tax Amount:</strong> ${quote.taxDetails.preTaxAmount.toLocaleString()}</p>
                          <p><strong>Post-tax Amount:</strong> ${quote.taxDetails.postTaxAmount.toLocaleString()}</p>
                          <p><strong>FBT Liability:</strong> $0 (Offset by employee contribution)</p>
                        </div>
                      </div>
                      
                      {quote.taxDetails.method === 'Employee Contribution Method' ? (
                        <div className="mt-3 p-3 bg-blue-100 rounded">
                          <p className="text-sm">
                            <strong>ECM Calculation:</strong> Employee pays ${quote.taxDetails.employeeContribution.toLocaleString()} post-tax 
                            (${quote.taxDetails.fbtBaseValue.toLocaleString()} × 20% = ${(quote.taxDetails.fbtBaseValue * 0.20).toLocaleString()}). 
                            Remaining ${quote.taxDetails.preTaxAmount.toLocaleString()} is salary sacrificed pre-tax.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-blue-100 rounded">
                          <p className="text-sm">
                            <strong>OCM Calculation:</strong> {quote.taxDetails.businessUsePercent}% business use 
                            (${quote.taxDetails.preTaxAmount.toLocaleString()} pre-tax), {100 - quote.taxDetails.businessUsePercent}% personal use 
                            (${quote.taxDetails.postTaxAmount.toLocaleString()} post-tax).
                          </p>
                        </div>
                      )}
                      
                      {quote.taxDetails.rfbt > 0 && (
                        <p><strong>Reportable Benefit (RFBT):</strong> ${quote.taxDetails.rfbt.toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4">Vehicle & Finance</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Vehicle Price</span>
                          <span className="font-medium">${quote.vehiclePrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Net Amount Financed (NAF)</span>
                          <span className="font-medium">${Math.round(quote.naf).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Establishment Fee</span>
                          <span className="font-medium">${quote.establishmentFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Brokerage (2%)</span>
                          <span className="font-medium">${Math.round(quote.brokerage).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600">Total Amount Financed</span>
                          <span className="font-medium">${Math.round(quote.amountFinanced).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Rate ({quote.termYears}yr)</span>
                          <span className="font-medium text-green-600">{(quote.baseRate * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monthly Payment</span>
                          <span className="font-medium text-lg">${Math.round(quote.monthlyPayment).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Balloon Payment</span>
                          <span className="font-medium">${Math.round(quote.balloonPayment).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Annual Running Costs */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4">Annual Running Costs</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Registration</span>
                          <span className="font-medium">${quote.runningCosts.rego.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Insurance</span>
                          <span className="font-medium">${quote.runningCosts.insurance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{quote.isEV ? 'Electricity' : 'Fuel'}</span>
                          <span className="font-medium">${Math.round(quote.runningCosts.fuel).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Maintenance</span>
                          <span className="font-medium">${Math.round(quote.runningCosts.service).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tyres</span>
                          <span className="font-medium">${Math.round(quote.runningCosts.tyres).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Management Fee</span>
                          <span className="font-medium">${Math.round(quote.runningCosts.managementFee).toLocaleString()}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total Annual Cost</span>
                          <span>${Math.round(quote.costs.totalAnnual).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tax Savings Breakdown */}
                  <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 text-green-800">Tax Savings Breakdown</h3>
                    <div className="grid md:grid-cols-2 gap-6 text-green-700">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Pre-tax Salary Sacrifice</span>
                          <span className="font-medium">${quote.taxDetails.preTaxAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Income Tax Savings</span>
                          <span className="font-medium">${quote.taxDetails.incomeTaxSavings.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Medicare Levy Savings</span>
                          <span className="font-medium">${quote.taxDetails.medicareLevy.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-green-200 pt-2 flex justify-between font-semibold">
                          <span>Total Annual Savings</span>
                          <span>${quote.taxDetails.totalTaxSavings.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total Annual Cost</span>
                          <span className="font-medium">${Math.round(quote.costs.totalAnnual).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Less: Tax Savings</span>
                          <span className="font-medium">-${quote.taxDetails.totalTaxSavings.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-green-200 pt-2 flex justify-between font-semibold">
                          <span>Net Annual Cost</span>
                          <span>${quote.taxDetails.netAnnualCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg">
                          <span>{quote.payCycle} Deduction</span>
                          <span>${Math.round(quote.payAmount).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Application Actions */}
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 text-purple-900">Ready to Apply?</h3>
                    <p className="text-gray-600 mb-4">This quote uses corrected FBT calculations and is ready for submission.</p>
                    
                    {/* Success Message */}
                    {submissionStatus === 'success' && (
                      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Quote submitted successfully!</span>
                        </div>
                        <p className="text-green-700 text-sm mt-1">
                          Opening application form... You can also access it later with Quote ID: {quote.id}
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {submissionStatus === 'error' && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 font-medium">Submission failed. Please try again or contact us directly.</p>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={handleSubmitApplication}
                        disabled={isSubmitting || submissionStatus === 'success'}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Submitting...
                          </>
                        ) : submissionStatus === 'success' ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Submitted
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit Application
                          </>
                        )}
                      </button>
                      
                      <button 
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        className="border border-purple-600 text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isDownloading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Download PDF
                          </>
                        )}
                      </button>
                      
                      <button 
                        onClick={handleEmailQuote}
                        disabled={isEmailing}
                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isEmailing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            Email Quote
                          </>
                        )}
                      </button>
                    </div>
                    
                    {submissionStatus === 'success' && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          <ExternalLink className="w-4 h-4 inline mr-1" />
                          <a 
                            href={`https://www.millarx.com.au/finance-application-from?quote=${quote.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Click here if the application form doesn't open automatically
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                  onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                  disabled={activeStep === 1}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {activeStep < 3 ? (
                  <button
                    onClick={() => setActiveStep(activeStep + 1)}
                    disabled={!canProceed(activeStep)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Step
                  </button>
                ) : activeStep === 3 ? (
                  <button
                    onClick={generateQuote}
                    disabled={!canProceed(activeStep) || isCalculating}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isCalculating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4" />
                        Generate Quote
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Real-time Preview */}
            {(form.price > 0 && form.salary > 0) && activeStep < 4 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Quick Preview
                </h3>
                <div className="space-y-3 text-sm">
                  {quickPreview && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Payment</span>
                        <span className="font-medium">
                          ${Math.round(quickPreview.monthlyPayment).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Rate</span>
                        <span className="font-medium text-blue-600">{(quickPreview.baseRate * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Est. Tax Savings/Year</span>
                        <span className="font-medium text-green-600">
                          ${Math.round(quickPreview.estimatedTaxSavings).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    FBT Method: {form.fbtMethod.replace('Employee Contribution Method', 'ECM').replace('Operating Cost Method', 'OCM')}
                    {form.termYears && (
                      <span className="block">
                        Rate: {((TERM_RATES[form.termYears] || TERM_RATES[5]) * 100).toFixed(2)}% ({form.termYears}yr)
                      </span>
                    )}
                    {form.isEV && <span className="text-green-600 block">✓ EV FBT Exempt</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Benefits */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Novated Lease Benefits</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Fixed rate @ {((TERM_RATES[form.termYears] || TERM_RATES[5]) * 100).toFixed(2)}% for {form.termYears} year term</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Reduce taxable income and save thousands</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Bundle all car expenses into one payment</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use pre-tax dollars for fuel, insurance, maintenance</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>$22/month management fee covers all administration</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>GST savings on vehicle purchase and running costs</span>
                </li>
              </ul>
            </div>

            {/* Rate Structure */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Our Competitive Rates</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>5 Years</span>
                  <span className="font-medium text-green-600">7.30%</span>
                </div>
                <div className="flex justify-between">
                  <span>4 Years</span>
                  <span className="font-medium text-green-600">7.35%</span>
                </div>
                <div className="flex justify-between">
                  <span>3 Years</span>
                  <span className="font-medium text-green-600">7.39%</span>
                </div>
                <div className="flex justify-between">
                  <span>2 Years</span>
                  <span className="font-medium">8.65%</span>
                </div>
                <div className="flex justify-between">
                  <span>1 Year</span>
                  <span className="font-medium">10.00%</span>
                </div>
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                  Asset-backed funding rates • Well under market • Fixed for term
                </div>
              </div>
            </div>

            {/* Why These Numbers Matter */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">Why These Numbers Matter</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Fixed Rates:</strong> {form.termYears}yr = {((TERM_RATES[form.termYears] || TERM_RATES[5]) * 100).toFixed(2)}% (competitive asset-backed rates)</p>
                <p><strong>ECM Method:</strong> Employee pays 20% of car value post-tax, rest is pre-tax</p>
                <p><strong>1 Month Deferral:</strong> Lower than competitors using 2 month deferral</p>
                <p><strong>FBT Transparency:</strong> Clear breakdown of pre-tax vs post-tax components</p>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
              <p className="text-purple-100 text-sm mb-4">
                Our experts are here to help you get the best deal.
              </p>
              <div className="space-y-2 text-sm">
                <p>📞 0492 886 857</p>
                <p>✉️ info@millarx.com.au</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}