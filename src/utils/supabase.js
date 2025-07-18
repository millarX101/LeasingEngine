// src/utils/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Quote saving will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function saveQuote(quoteData) {
  if (!supabase) {
    console.warn('Supabase not configured - quote not saved');
    return { success: false, error: 'Database not configured' };
  }

  try {
    // First, let's try to get the table schema to understand what columns exist
    const { data: schemaData, error: schemaError } = await supabase
      .from('quotes')
      .select('*')
      .limit(0);

    // Create a minimal record with only essential fields to avoid column mismatch errors
    const dbRecord = {
      // Essential customer info
      client_name: quoteData.customerName || null,
      client_email: quoteData.customerEmail || null,
      client_phone: quoteData.customerPhone || null,
      
      // Essential vehicle info
      vehicle_make: quoteData.vehicleMake || null,
      vehicle_model: quoteData.vehicleModel || null,
      vehicle_year: quoteData.vehicleYear || null,
      vehicle_price: quoteData.vehiclePrice || 0,
      
      // Essential finance info
      monthly_payment: quoteData.monthlyPayment || 0,
      term_years: quoteData.termYears || 3,
      
      // Status
      status: 'draft'
    };

    // Try to add additional fields that might exist
    const optionalFields = {
      employer: quoteData.employer,
      state: quoteData.state,
      vehicle_trim: quoteData.vehicleTrim,
      engine_size: quoteData.engineSize,
      fuel_type: quoteData.fuelType,
      body_style: quoteData.bodyStyle,
      is_ev: quoteData.isEV,
      annual_kms: quoteData.annualKms,
      pay_cycle: quoteData.payCycle,
      fbt_method: quoteData.fbtMethod,
      business_use_percent: quoteData.businessUsePercent,
      naf: quoteData.naf,
      establishment_fee: quoteData.establishmentFee,
      brokerage: quoteData.brokerage,
      base_rate: quoteData.baseRate,
      balloon_payment: quoteData.balloonPayment,
      stamp_duty: quoteData.stampDuty,
      registration: quoteData.registration,
      insurance: quoteData.runningCosts?.insurance,
      fuel_cost: quoteData.runningCosts?.fuel,
      maintenance_cost: quoteData.runningCosts?.service,
      tyre_cost: quoteData.runningCosts?.tyres,
      management_fee: quoteData.runningCosts?.managementFee,
      total_annual_cost: quoteData.runningCosts?.total,
      tax_savings: quoteData.taxSavings,
      net_annual_cost: (quoteData.runningCosts?.total || 0) - (quoteData.taxSavings || 0),
      pay_amount: quoteData.payAmount,
      // Try both possible column names for salary
      income: quoteData.income,
      annual_salary: quoteData.income
    };

    // Add optional fields that have values
    Object.entries(optionalFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        dbRecord[key] = value;
      }
    });

    const { data, error } = await supabase
      .from('quotes')
      .insert([dbRecord])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      
      // If it's a column not found error, try with just the essential fields
      if (error.message.includes('column') && error.message.includes('not found')) {
        console.log('Retrying with minimal fields due to schema mismatch...');
        
        const minimalRecord = {
          client_name: quoteData.customerName || null,
          client_email: quoteData.customerEmail || null,
          client_phone: quoteData.customerPhone || null,
          vehicle_make: quoteData.vehicleMake || null,
          vehicle_model: quoteData.vehicleModel || null,
          vehicle_price: quoteData.vehiclePrice || 0,
          monthly_payment: quoteData.monthlyPayment || 0,
          status: 'draft'
        };

        const { data: retryData, error: retryError } = await supabase
          .from('quotes')
          .insert([minimalRecord])
          .select();

        if (retryError) {
          return { success: false, error: retryError.message };
        }

        console.log('Quote saved with minimal fields:', retryData[0]);
        return { success: true, data: retryData[0] };
      }
      
      return { success: false, error: error.message };
    }

    console.log('Quote saved successfully:', data[0]);
    return { success: true, data: data[0] };
  } catch (err) {
    console.error('Error saving quote:', err);
    return { success: false, error: err.message };
  }
}
