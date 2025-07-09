// src/components/QuoteCard.jsx
import html2pdf from "html2pdf.js";
import { formatCurrency } from "../utils/formatCurrency";

// helper: divisor by pay-cycle
const CYCLE_DIV = { Weekly: 52, Fortnightly: 26, Monthly: 12 };

export default function QuoteCard({ q }) {
  if (!q || !q.quote) return <p className="text-red-500">Quote data unavailable.</p>;

  const { oopPerCycle, effectiveRate, finance, running, leasePerCycle } = q.quote;
  const div      = CYCLE_DIV[q.data.payCycle] ?? 12;        // fall-back monthly
  const runSum   = Object.values(running).reduce((s, v) => s + v, 0);
  const financePerCycle = q.data.payCycle === "Monthly"
    ? finance.monthlyPayment
    : (finance.monthlyPayment * 12) / div;

  // Totals we want to display
  const totalPerCycle   = financePerCycle + runSum;         // Finance + Running
  const preTaxDeduct    = totalPerCycle;                    // whole salary-sacrifice
  const gstRate         = 0.10;
  const isECM           = q.data.ecm === "Employee Contribution Method";
  const postTaxDeduct   = isECM ? (runSum * (1 + gstRate)) : 0; // only ECM

  /* pdf download */
  const handleDownloadPDF = () => {
    const element = document.getElementById(`quote-${q.id}`);
    html2pdf()
      .set({
        margin:      0.3,
        filename:    `${q.quoteRef}.pdf`,
        image:       { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF:       { unit: "in", format: "a4", orientation: "portrait" }
      })
      .from(element)
      .save();
  };

  const runningLabels = {
    registration: "Registration",
    insurance:    "Insurance",
    service:      "Servicing & Maintenance",
    tyres:        "Tyres",
    fuel:         q.data.isEV ? "Charging" : "Fuel"
  };
  const runningKeys = ["registration", "insurance", "service", "tyres", "fuel"];

  return (
    <div
      id={`quote-${q.id}`}
      className="bg-white rounded-2xl shadow-lg p-8 space-y-6 text-gray-800
                 print:shadow-none print:rounded-none print:p-8
                 print:w-[7.5in] print:break-after-page"
    >
      {/* ─────────── Header ─────────── */}
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row">
        <div>
          <h2 className="text-xl font-bold text-purple-800">millarX Lease Summary</h2>
          <p className="text-sm text-gray-500">Quote Ref: {q.quoteRef}</p>
        </div>
        <div className="text-right mt-4 md:mt-0">
          <p className="text-lg font-semibold text-gray-700">Cost to your pocket per pay</p>
          <p className="text-3xl font-bold text-purple-700">{formatCurrency(oopPerCycle)}</p>
          <p className="text-sm text-gray-500">Pay cycle: {q.data.payCycle}</p>
        </div>
      </div>

      {/* Effective rate */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <p className="text-sm font-semibold text-purple-900">Effective Interest Rate</p>
        <p className="text-lg font-bold text-purple-700">
          {effectiveRate ? `${effectiveRate.toFixed(2)} %` : "N/A"}
        </p>
      </div>

      {/* ─────────── Cost tables ─────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* finance */}
        <Box title="Fixed Finance Costs" colour="purple">
          <Line label="Amount Financed" val={finance.amountFinanced}/>
          <Line label="Payment / pay-cycle" val={financePerCycle}/>
          <Line label="Balloon" val={finance.balloon}/>
          <Line label="Fees" val={29}/>
        </Box>

        {/* running */}
        <Box title="Budgeted Running Costs" colour="orange">
          {runningKeys.map(k => (
            running[k] !== undefined &&
              <Line key={k} label={runningLabels[k]} val={running[k]} />
          ))}
        </Box>
      </div>

      {/* ─────────── Totals strip ─────────── */}
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <TotalCard label="Finance + Running" val={totalPerCycle}/>
        <TotalCard label="Pre-tax deduction" val={preTaxDeduct}/>
        {isECM &&
          <TotalCard label="Post-tax deduction (incl GST)" val={postTaxDeduct}/>}
      </div>

      {/* ─────────── Terms, declaration & actions ─────────── */}
      {/* (unchanged from your previous version) */}
      {/* … paste the same Terms/Declaration + buttons block here … */}
    </div>
  );
}

/* ────────── small helpers ────────── */

const Box = ({ title, colour, children }) => (
  <div>
    <h3 className={`text-md font-semibold text-${colour}-800 mb-2`}>{title}</h3>
    <div className={`bg-${colour}-100 rounded p-4 space-y-2 text-sm`}>
      {children}
    </div>
  </div>
);
const Line = ({ label, val }) => (
  <p>{label}: {formatCurrency(val)}</p>
);
const TotalCard = ({ label, val }) => (
  <div className="bg-gray-100 rounded-md p-3 text-center">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold">{formatCurrency(val)}</p>
  </div>
);
