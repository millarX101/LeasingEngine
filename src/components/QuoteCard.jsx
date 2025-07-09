/*  QuoteCard.jsx  */
import html2pdf from "html2pdf.js";
import { formatCurrency } from "../utils/formatCurrency";

export default function QuoteCard({ q }) {
  /* ---------- PDF download ---------- */
  const handleDownloadPDF = () => {
    const el = document.getElementById(`quote-${q.id}`);
    html2pdf()
      .set({
        margin: 0.3,
        filename: `${q.quoteRef}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
      })
      .from(el)
      .save();
  };

  if (!q?.quote) return <p className="text-red-500">Quote data unavailable.</p>;

  /* ---------- shorthands ---------- */
  const { oopPerCycle, effectiveRate, finance, running } = q.quote;
  const v = q.data;                               // vehicle meta

  /* ---------- EV charging cost calculation ---------- */
  const calculateEVChargingCost = () => {
    if (!v.isEV) return running.fuel;
    
    const annualKms = 15000; // Default annual kilometers
    const costPerKm = 0.042; // 4.2c per km
    const annualChargingCost = annualKms * costPerKm;
    
    // Calculate per pay period
    const periodsPerYear = {
      'Weekly': 52,
      'Fortnightly': 26,
      'Monthly': 12
    };
    
    const periods = periodsPerYear[v.payCycle] || 12;
    return annualChargingCost / periods;
  };

  /* ---------- running-cost labels ---------- */
  const runningLabels = {
    registration: "Registration",
    insurance: "Insurance",
    service: "Servicing & Maintenance",
    tyres: "Tyres",
    fuel: v.isEV ? "Charging" : "Fuel"
  };
  const runningKeys = [
    "registration",
    "insurance",
    "service",
    "tyres",
    "fuel"
  ];

  /* ---------- calculate corrected running costs ---------- */
  const correctedRunning = {
    ...running,
    fuel: v.isEV ? calculateEVChargingCost() : running.fuel
  };

  /* ---------- markup ---------- */
  return (
    <div
      id={`quote-${q.id}`}
      className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden
                 print:rounded-none print:shadow-none print:border-none print:break-after-page"
    >
      {/* ───────── header with gradient ───────── */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="text-white">
            <h1 className="text-2xl font-bold mb-1">millarX Lease Summary</h1>
            <p className="text-purple-100 text-sm">
              Quote Reference • {q.quoteRef}
            </p>
          </div>
          
          {/* Main price highlight */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 text-center border border-white/20">
            <p className="text-purple-100 text-sm font-medium mb-1">Total Payment</p>
            <p className="text-3xl font-bold text-white mb-1">
              {formatCurrency(oopPerCycle)}
            </p>
            <p className="text-purple-200 text-sm">per {v.payCycle}</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* ───────── vehicle info with image ───────── */}
        <div className="flex flex-col lg:flex-row gap-6">
          {q.imageUrl && (
            <div className="lg:w-1/2">
              <img
                src={q.imageUrl}
                alt={`${v.make} ${v.model}`}
                className="w-full h-64 object-cover rounded-xl shadow-lg border border-gray-200"
              />
            </div>
          )}
          
          <div className={`${q.imageUrl ? 'lg:w-1/2' : 'w-full'} flex flex-col justify-center`}>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {[v.year, v.make, v.model].filter(Boolean).join(" ")}
              </h2>
              {v.trim && (
                <p className="text-lg text-gray-600 mb-4">{v.trim}</p>
              )}
              
              {/* Effective rate highlight */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Effective Interest Rate
                    </p>
                    <p className="text-2xl font-bold text-purple-700">
                      {effectiveRate ? `${effectiveRate.toFixed(2)}%` : "N/A"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───────── cost breakdown cards ───────── */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Finance costs */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-purple-900">
                Fixed Finance Costs
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Amount Financed</span>
                  <span className="font-bold text-purple-700">{formatCurrency(finance.amountFinanced)}</span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Monthly Payment</span>
                  <span className="font-bold text-purple-700">{formatCurrency(finance.monthlyPayment)}</span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Balloon Payment</span>
                  <span className="font-bold text-purple-700">{formatCurrency(finance.balloon)}</span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Fees</span>
                  <span className="font-bold text-purple-700">{formatCurrency(29)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Running costs */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-orange-900">
                Budgeted Running Costs
              </h3>
            </div>
            
            <div className="space-y-3">
              {runningKeys.map(
                (k) =>
                  correctedRunning[k] !== undefined && (
                    <div key={k} className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">{runningLabels[k]}</span>
                        <span className="font-bold text-orange-700">{formatCurrency(correctedRunning[k])}</span>
                      </div>
                    </div>
                  )
              )}
            </div>
          </div>
        </div>

        {/* ───────── total payment summary ───────── */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Total Out of Your Pocket</h3>
              <p className="text-indigo-100 text-sm">Fixed Finance + Budgeted Running Costs</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold mb-1">
                {formatCurrency(
                  (finance.monthlyPayment + 29 + 
                   Object.values(correctedRunning).reduce((sum, cost) => sum + (cost || 0), 0))
                )}
              </p>
              <p className="text-indigo-200 text-sm">per {v.payCycle}</p>
            </div>
          </div>
        </div>

        {/* ───────── terms and conditions ───────── */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Terms and Conditions
          </h3>

          <div className="bg-white rounded-xl p-5 shadow-sm text-sm text-gray-700 leading-relaxed">
            <p className="mb-4">
              To proceed with your novated lease, please sign this quote and return it to{" "}
              <a href="mailto:ben@millarx.com.au" className="text-purple-700 underline font-medium">
                ben@millarx.com.au
              </a>
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>This quote is a guide only and does not consider your personal financial circumstances.</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Quote valid for 30 business days from issue.</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p><strong>ICE vehicles:</strong> pocket cost = Pre-tax + Post-tax (ECM) + net tax-savings (GST & income-tax).</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p><strong>FBT-exempt EVs:</strong> all deductions are <em>pre-tax</em>; no ECM applies.</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Reportable Fringe Benefits Tax (RFBT) is calculated using the <em>Type 2 gross-up factor</em> and reported on your PAYG summary where required.</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Running-cost budgets are estimates; millarX may adjust them to maintain a cash-positive balance.</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Surplus funds at lease end may be paid as taxable salary or rolled into a new benefit.</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Lease payments may change with final vehicle price, interest rates or statutory charges at settlement.</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>You are irrevocably committed to accepting delivery of the quoted vehicle; cancellation can attract penalties.</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>millarX is not responsible for supplier or delivery delays.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───────── signature section ───────── */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-4">Employee Declaration</h3>
          <p className="text-gray-700 mb-6">
            I confirm I have read and understood the above terms and agree to proceed with the quote as presented.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Signature</label>
              <div className="border-b-2 border-gray-400 pb-2 h-12"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <div className="border-b-2 border-gray-400 pb-2 h-12"></div>
            </div>
          </div>
        </div>

        {/* ───────── contact info ───────── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">millarX Pty Ltd</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  <a href="mailto:ben@millarx.com.au" className="text-purple-700 underline">
                    ben@millarx.com.au
                  </a>
                </p>
                <p>
                  <span className="font-medium">Mobile:</span> 0413 153 802
                </p>
                <p className="text-gray-400">ABN 76 673 339 359</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────── action buttons (screen only) ───────── */}
      <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 html2pdf__ignore">
        <div className="flex flex-wrap justify-end gap-4">
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
          <button
            onClick={() => alert("Coming soon – submit to millarX")}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
}