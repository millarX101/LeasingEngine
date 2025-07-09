import html2pdf from "html2pdf.js";
import { formatCurrency } from "../utils/formatCurrency";

export default function QuoteCard({ q }) {
  const handleDownloadPDF = () => {
    const element = document.getElementById(`quote-${q.id}`);
    const opt = {
      margin: 0.3,
      filename: `${q.quoteRef}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  if (!q || !q.quote) {
    return <p className="text-red-500">Quote data unavailable.</p>;
  }

  const { oopPerCycle, effectiveRate, finance, running } = q.quote;

  const runningLabels = {
    registration: "Registration",
    insurance: "Insurance",
    service: "Servicing & Maintenance",
    tyres: "Tyres",
    fuel: q.data.isEV ? "Charging" : "Fuel",
  };

  const runningKeys = ["registration", "insurance", "service", "tyres", "fuel"];

  return (
    <div
      id={`quote-${q.id}`}
      className="bg-white rounded-2xl shadow-lg p-8 space-y-6 text-gray-800 print:shadow-none print:rounded-none print:p-10"
    >
      {/* 📸 Car Image */}
      {q.imageUrl && (
        <img src={q.imageUrl} alt="Car" className="w-full h-auto rounded-xl border mb-6" />
      )}

      {/* 🔢 Summary Section */}
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row">
        <div>
          <h2 className="text-xl font-bold text-purple-800">millarX Lease Summary</h2>
          <p className="text-sm text-gray-500">Quote Reference: {q.quoteRef}</p>
        </div>
        <div className="text-right mt-4 md:mt-0">
          <p className="text-lg font-semibold text-gray-700">Cost to your pocket per pay</p>
          <p className="text-3xl font-bold text-purple-700">{formatCurrency(oopPerCycle)}</p>
          <p className="text-sm text-gray-500">Pay cycle: {q.data.payCycle}</p>
        </div>
      </div>

      {/* 📈 Effective Rate */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <p className="text-sm font-semibold text-purple-900">Effective Interest Rate:</p>
        <p className="text-lg font-bold text-purple-700">
          {effectiveRate ? `${effectiveRate.toFixed(2)}%` : "N/A"}
        </p>
      </div>

      {/* 💰 Cost Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Finance Costs */}
        <div>
          <h3 className="text-md font-semibold text-purple-800 mb-2">Fixed Finance Costs</h3>
          <div className="bg-purple-100 rounded p-4 space-y-2 text-sm">
            <p>Amount Financed: {formatCurrency(finance.amountFinanced)}</p>
            <p>Monthly Payment: {formatCurrency(finance.monthlyPayment)}</p>
            <p>Balloon: {formatCurrency(finance.balloon)}</p>
            <p>Fees: {formatCurrency(29)}</p>
          </div>
        </div>

        {/* Running Costs */}
        <div>
          <h3 className="text-md font-semibold text-orange-700 mb-2">Budgeted Running Costs</h3>
          <div className="bg-orange-100 rounded p-4 space-y-2 text-sm">
            {runningKeys.map((k) =>
              running[k] !== undefined ? (
                <p key={k}>
                  {runningLabels[k]}: {formatCurrency(running[k])}
                </p>
              ) : null
            )}
          </div>
        </div>
      </div>

      {/* 📜 Terms & Declaration */}
      <div className="border-t border-gray-300 pt-6 mt-10 text-xs text-gray-600 space-y-3 leading-relaxed print:pt-10 print:mt-10">
        <p className="font-semibold text-gray-700">Terms and Conditions</p>

        <p>
          To proceed with your novated lease, please sign this quote and return it to{" "}
          <a href="mailto:ben@millarx.com.au" className="text-purple-700 underline">
            ben@millarx.com.au
          </a>.
        </p>

        <ul className="list-disc list-inside space-y-1">
          <li>This Vehicle Salary Packaging Quote is a guide only and does not consider your personal financial circumstances.</li>
          <li>The quote is valid for 30 business days from the date of issue.</li>
          <li>Running cost budgets are estimates. Where actual expenses exceed the allocation, millarX may adjust the budget to maintain a cash-positive balance.</li>
          <li>Any surplus funds at lease end may be paid as taxable salary or rolled over into a new benefit.</li>
          <li>Lease payments are subject to change based on final vehicle price, interest rates, or statutory changes at the time of delivery.</li>
          <li>You are irrevocably committed to accepting delivery of the quoted vehicle. Cancellation may result in penalties.</li>
          <li>millarX is not responsible for vehicle supply or delivery delays.</li>
          <li>millarX is not a licensed financial advisor. You are encouraged to seek independent advice.</li>
          <li>You confirm the products and budgets have been selected based on your own needs.</li>
        </ul>

        {/* ✍ Declaration */}
        <div className="pt-6 space-y-4 text-gray-700">
          <p className="font-semibold">Employee Declaration</p>
          <p>I confirm I have read and understood the above terms and agree to proceed with the quote as presented.</p>
          <div className="flex flex-col md:flex-row md:items-center md:gap-12 mt-4">
            <div className="border-b border-gray-400 w-64 pb-1">Signature</div>
            <div className="border-b border-gray-400 w-64 pb-1 mt-4 md:mt-0">Date</div>
          </div>
        </div>

        {/* 📞 Contact Info */}
        <div className="pt-6 border-t border-gray-200 mt-6 text-xs">
          <p className="text-gray-500">millarX Pty Ltd</p>
          <p>
            <span className="font-medium">Email:</span>{" "}
            <a href="mailto:ben@millarx.com.au" className="text-purple-700 underline">
              ben@millarx.com.au
            </a>
          </p>
          <p><span className="font-medium">Mobile:</span> 0413 153 802</p>
          <p className="text-gray-400 mt-2">ABN 76 673 339 359</p>
        </div>
      </div>

      {/* 📎 Action Buttons (not in print) */}
      <div className="flex flex-wrap justify-end gap-4 mt-6 print:hidden">
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-purple-700 text-white text-sm rounded hover:bg-purple-800"
        >
          Download PDF
        </button>
        <button
          onClick={() => alert("Coming soon – submit to millarX")}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
        >
          Submit for Approval
        </button>
      </div>
    </div>
  );
}
