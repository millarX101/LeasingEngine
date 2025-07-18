// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';

export function generateQuotePDF(quoteData) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 30;
    
    // Helper function to add text with auto line break
    const addText = (text, x, y, options = {}) => {
      doc.setFontSize(options.fontSize || 10);
      
      // Handle color properly - jsPDF expects either a single number or separate RGB values
      if (options.color) {
        if (Array.isArray(options.color)) {
          // RGB array format [r, g, b]
          doc.setTextColor(options.color[0], options.color[1], options.color[2]);
        } else {
          // Single number format
          doc.setTextColor(options.color);
        }
      } else {
        doc.setTextColor(0); // Default black
      }
      
      if (options.bold) doc.setFont(undefined, 'bold');
      else doc.setFont(undefined, 'normal');
      
      doc.text(text, x, y);
      return y + (options.lineHeight || 6);
    };
    
    // Header
    yPosition = addText('millarX DriveIQ', 20, yPosition, { fontSize: 20, color: [40, 116, 166], bold: true });
    yPosition = addText('Vehicle Finance Quote', 20, yPosition, { fontSize: 16, bold: true, lineHeight: 8 });
    
    // Date (top right)
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-AU')}`, pageWidth - 60, 30);
    
    yPosition += 10;
    
    // Customer Details Section
    yPosition = addText('Customer Details', 20, yPosition, { fontSize: 14, bold: true, lineHeight: 10 });
    yPosition = addText(`Name: ${quoteData.customerName || 'Not provided'}`, 20, yPosition);
    yPosition = addText(`Email: ${quoteData.customerEmail || 'Not provided'}`, 20, yPosition);
    yPosition = addText(`Phone: ${quoteData.customerPhone || 'Not provided'}`, 20, yPosition);
    yPosition = addText(`State: ${quoteData.state || 'Not provided'}`, 20, yPosition);
    
    yPosition += 10;
    
    // Vehicle Details Section
    yPosition = addText('Vehicle Details', 20, yPosition, { fontSize: 14, bold: true, lineHeight: 10 });
    const vehicleName = `${quoteData.vehicleMake || ''} ${quoteData.vehicleModel || ''}`.trim() || 'Not specified';
    yPosition = addText(`Vehicle: ${vehicleName}`, 20, yPosition);
    yPosition = addText(`Purchase Price: $${(quoteData.vehiclePrice || 0).toLocaleString()}`, 20, yPosition);
    yPosition = addText(`Stamp Duty: $${(quoteData.stampDuty || 0).toLocaleString()}`, 20, yPosition);
    yPosition = addText(`Registration: $${(quoteData.registration || 0).toLocaleString()}`, 20, yPosition);
    
    yPosition += 10;
    
    // Finance Details Section
    yPosition = addText('Finance Details', 20, yPosition, { fontSize: 14, bold: true, lineHeight: 10 });
    yPosition = addText(`Term: ${quoteData.termYears || 0} years`, 20, yPosition);
    const fbtMethodText = quoteData.fbtMethod === 'ecm' ? 'Employee Contribution Method' : 'Operating Cost Method';
    yPosition = addText(`FBT Method: ${fbtMethodText}`, 20, yPosition);
    yPosition = addText(`Monthly Payment: $${(quoteData.monthlyPayment || 0).toLocaleString()}`, 20, yPosition, { bold: true });
    yPosition = addText(`Balloon Payment: $${(quoteData.balloonPayment || 0).toLocaleString()}`, 20, yPosition);
    yPosition = addText(`All-Up Rate: ${(quoteData.allUpRate || 0).toFixed(2)}% p.a.`, 20, yPosition, { bold: true });
    
    if (quoteData.taxSavings > 0) {
      yPosition = addText(`Annual Tax Savings: $${(quoteData.taxSavings || 0).toLocaleString()}`, 20, yPosition, { color: [0, 128, 0] });
    }
    
    if (quoteData.reportableBenefit > 0) {
      yPosition = addText(`Reportable Fringe Benefit: $${(quoteData.reportableBenefit || 0).toLocaleString()}`, 20, yPosition);
    }
    
    // Running Costs (if available)
    if (quoteData.runningCosts) {
      yPosition += 10;
      yPosition = addText('Estimated Annual Running Costs', 20, yPosition, { fontSize: 14, bold: true, lineHeight: 10 });
      yPosition = addText(`Insurance: ${(quoteData.runningCosts.insurance || 0).toLocaleString()}`, 20, yPosition);
      yPosition = addText(`Registration: ${(quoteData.runningCosts.rego || 0).toLocaleString()}`, 20, yPosition);
      yPosition = addText(`Fuel/Electricity: ${(quoteData.runningCosts.fuel || 0).toLocaleString()}`, 20, yPosition);
      yPosition = addText(`Service & Maintenance: ${(quoteData.runningCosts.service || 0).toLocaleString()}`, 20, yPosition);
      yPosition = addText(`Tyres: ${(quoteData.runningCosts.tyres || 0).toLocaleString()}`, 20, yPosition);
      yPosition = addText(`Management Fee: ${(quoteData.runningCosts.managementFee || 0).toLocaleString()}`, 20, yPosition);
      yPosition = addText(`Total Annual Running Costs: ${(quoteData.runningCosts.total || 0).toLocaleString()}`, 20, yPosition, { bold: true });
    }
    
    // Footer
    const footerY = doc.internal.pageSize.height - 30;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('This quote is indicative only and subject to credit approval.', 20, footerY);
    doc.text('Terms and conditions apply. Contact millarX for full details.', 20, footerY + 8);
    
    return doc;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
}

// Helper function to download PDF
export function downloadQuotePDF(quoteData) {
  try {
    const doc = generateQuotePDF(quoteData);
    const filename = `millarX_DriveIQ_Quote_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

// Helper function to get PDF as blob for email
export function getQuotePDFBlob(quoteData) {
  try {
    const doc = generateQuotePDF(quoteData);
    return doc.output('blob');
  } catch (error) {
    console.error('Error creating PDF blob:', error);
    throw error;
  }
}
