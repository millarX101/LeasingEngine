export async function sendQuoteEmail({ pdfBlob, clientEmail, salespersonEmail }) {
  const formData = new FormData();
  formData.append('pdf', pdfBlob, 'quote.pdf');
  formData.append('clientEmail', clientEmail);
  formData.append('salespersonEmail', salespersonEmail);

  return fetch('http://localhost:4000/api/send-quote', {
    method: 'POST',
    body: formData,
  });
}
