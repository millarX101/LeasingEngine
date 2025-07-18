// src/utils/emailService.js
import emailjs from '@emailjs/browser';
import { getQuotePDFBlob } from './pdfGenerator.js';

const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) {
  console.warn('EmailJS credentials not found. Email functionality will be disabled.');
}

export async function sendQuoteEmail(quoteData) {
  if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) {
    console.warn('EmailJS not configured - email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  if (!quoteData.customerEmail) {
    return { success: false, error: 'Customer email not provided' };
  }

  try {
    // Initialize EmailJS
    emailjs.init(PUBLIC_KEY);

    // Generate PDF blob
    const pdfBlob = getQuotePDFBlob(quoteData);

    // Convert PDF blob to base64 for attachment
    let pdfBase64 = '';
    if (pdfBlob) {
      const reader = new FileReader();
      pdfBase64 = await new Promise((resolve) => {
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(pdfBlob);
      });
    }

    // Prepare email template parameters
    const templateParams = {
      to_email: quoteData.customerEmail,
      to_name: quoteData.customerName || 'Valued Customer',
      customer_name: quoteData.customerName || 'Valued Customer',
      vehicle_details: `${quoteData.vehicleMake || ''} ${quoteData.vehicleModel || ''}`.trim() || 'Vehicle',
      purchase_price: `$${(quoteData.vehiclePrice || 0).toLocaleString()}`,
      monthly_payment: `$${(quoteData.monthlyPayment || 0).toLocaleString()}`,
      balloon_payment: `$${(quoteData.balloonPayment || 0).toLocaleString()}`,
      all_up_rate: `${(quoteData.allUpRate || 0).toFixed(2)}%`,
      term_years: quoteData.termYears || 0,
      fbt_method: quoteData.fbtMethod === 'ecm' ? 'Employee Contribution Method' : 'Operating Cost Method',
      tax_savings: quoteData.taxSavings > 0 ? `$${quoteData.taxSavings.toLocaleString()}` : 'N/A',
      quote_date: new Date().toLocaleDateString('en-AU'),
      pdf_attachment: pdfBase64,
      pdf_filename: `millarX_DriveIQ_Quote_${new Date().toISOString().split('T')[0]}.pdf`
    };

    // Send email
    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
    
    if (response.status === 200) {
      return { success: true, message: 'Quote sent successfully!' };
    } else {
      return { success: false, error: 'Failed to send email' };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export function isEmailConfigured() {
  return !!(PUBLIC_KEY && SERVICE_ID && TEMPLATE_ID);
}