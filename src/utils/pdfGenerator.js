import jsPDF from 'jspdf';

export function generateQuotePDF(quoteData) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('MXDealerAdvantage Novated Lease Quote', 10, 20);

  doc.setFontSize(12);
  Object.entries(quoteData).forEach(([key, value], index) => {
    doc.text(`${key}: ${value}`, 10, 40 + index * 10);
  });

  return doc.output('blob'); // return as Blob for email
}
