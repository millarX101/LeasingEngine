import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { generateFullQuote } from "./utils/fullQuoteGenerator";
import QuoteDropdowns from "./QuoteDropdowns";
import { generateCarSceneImage } from "./utils/aiImageClient";

const purple = "bg-purple-700";
const purpleHover = "hover:bg-purple-800";

export default function App() {
  const [formData, setFormData] = useState({
    clientName: "", clientEmail: "",
    make: "", model: "", year: "", trim: "",
    state: "VIC", isEV: false, carType: "",
    price: 0, salary: 0, kms: 15000,
    termYears: 5, payCycle: "Monthly",
    ecm: "Employee Contribution Method",
    businessUsePercent: 0
  });

  const [quotes, setQuotes] = useState([]);

  const generateQuoteID = () => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const serial = quotes.length + 1;
    return `Q-${dateStr}-${String(serial).padStart(3, "0")}`;
  };

  const handleChange = ({ target }) => {
    const { name, type, value } = target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? +value || 0 : value
    }));
  };

  const handleDropdown = fields =>
    setFormData(prev => ({ ...prev, ...fields }));

  const handleGenerateQuote = async () => {
    try {
      const { make, model, year } = formData;
      const query = new URLSearchParams({ make, model, year }).toString();
      const res = await fetch(`/api/details?${query}`); // proxy via vite.config or Netlify function
      if (!res.ok) throw new Error("API error");

      const { carType, isEV, runningCosts } = await res.json();
      const fullForm  = { ...formData, carType, isEV };
      const quoteData = generateFullQuote(fullForm, runningCosts);

      const imageUrl  = await generateCarSceneImage(make, model, carType);

      setQuotes(prev => [
        ...prev,
        {
          id:        uuidv4(),
          quoteRef:  generateQuoteID(),
          data:      fullForm,
          quote:     quoteData,
          imageUrl:  imageUrl || "",
          selected:  false
        }
      ]);
    } catch (err) {
      console.error("Fetch/generate error:", err);
      alert("Could not retrieve vehicle info or generate image.");
    }
  };

  const toggleSelection = id =>
    setQuotes(prev => prev.map(q =>
      q.id === id ? { ...q, selected: !q.selected } : q
    ));

  const handlePrintSelectedQuotes = () => {
    const selected = quotes.filter(q => q.selected);
    if (!selected.length) return alert("No quotes selected for PDF.");

    const win = window.open("", "_blank", "width=1000,height=800");
    win.document.write(`
      <html><head><title>Quotes</title></head><body>
      ${selected.map(renderQuoteHTML).join("")}
      </body></html>`);
    win.document.close();
    win.print();
  };

  /* ---- render single quote to HTML (for PDF) ---- */
  const renderQuoteHTML = q => `
    <div style="padding:30px;font-family:Arial;">
      <h2 style="color:#7c3aed;">${q.data.termYears}-Year Quote | ${q.quoteRef}</h2>
      <p>${q.data.clientName} | ${q.data.clientEmail}</p>
      <h1 style="font-size:2rem;">$${q.quote.oopPerCycle?.toFixed(2)} / ${q.data.payCycle.toLowerCase()}</h1>

      <div style="display:flex;gap:30px;margin:20px 0;">
        <div style="flex:1;background:#7c3aed;color:white;padding:20px;border-radius:8px;">
          <h3>Finance</h3>
          <p>Financed: $${q.quote.finance?.displayAmountFinanced?.toFixed(2)}</p>
          <p>Payment: $${q.quote.finance?.monthlyPayment?.toFixed(2)}</p>
          <p>Balloon: $${q.quote.finance?.balloon?.toFixed(2)}</p>
          <p>Fee: $29</p>
        </div>
        <div style="flex:1;background:#ff8c00;color:white;padding:20px;border-radius:8px;">
          <h3>Running Costs</h3>
          ${Object.entries(q.quote.running)
            .filter(([k])=>k!=="total")
            .map(([k,v])=>`<p>${k}: $${v.toFixed(2)}</p>`).join("")}
        </div>
      </div>
      ${q.imageUrl ? `<img src="${q.imageUrl}" style="width:100%;border-radius:8px;margin-top:20px;" />` : ""}
      <hr style="margin:40px 0;" />
    </div>`;

  /* --------------- UI --------------- */
  return (
    <div className="min-h-screen bg-purple-50 text-gray-800">
      {/* header */}
      <header className="bg-white shadow px-6 py-4 flex items-center gap-3">
        <img src="/assets/millarx-logo.png" alt="millarX" className="h-8" />
        <h1 className="text-xl font-bold text-purple-800">
          millarX&nbsp;DriveIQ – Novated Quotes
        </h1>
      </header>

      {/* form */}
      <main className="max-w-5xl mx-auto p-6">
        <section className="bg-white p-6 rounded-xl shadow space-y-6">
          {/* client details */}
          <div className="grid md:grid-cols-2 gap-4">
            <TextInput label="Client Name"  name="clientName"  value={formData.clientName}  onChange={handleChange} />
            <TextInput label="Client Email" name="clientEmail" value={formData.clientEmail} onChange={handleChange} />
            <SelectInput label="State" name="state" value={formData.state} onChange={handleChange}
              options={["VIC","NSW","QLD","SA","WA","TAS","ACT","NT"]} />
          </div>

          {/* vehicle dropdowns */}
          <QuoteDropdowns
            make={formData.make}
            model={formData.model}
            year={formData.year}
            onChange={handleDropdown}
          />

          {/* other vehicle / salary inputs */}
          <div className="grid md:grid-cols-2 gap-4">
            <TextInput label="Variant" name="trim" value={formData.trim} onChange={handleChange} />
            <NumberInput label="Price (Driveaway)" name="price" value={formData.price} onChange={handleChange} />
            <NumberInput label="Salary" name="salary" value={formData.salary} onChange={handleChange} />
            <NumberInput label="Annual KMs" name="kms" value={formData.kms} onChange={handleChange} />
            <SelectInput label="Term" name="termYears" value={formData.termYears} onChange={handleChange}
              options={[1,2,3,4,5].map(y=>`${y} Year`)} values={[1,2,3,4,5]} />
            <SelectInput label="Pay Cycle" name="payCycle" value={formData.payCycle} onChange={handleChange}
              options={["Weekly","Fortnightly","Monthly"]} />
            <SelectInput label="FBT Method" name="ecm" value={formData.ecm} onChange={handleChange}
              options={["Employee Contribution Method","Operating Cost Method"]} />
            {formData.ecm==="Operating Cost Method" && (
              <NumberInput label="Business Use %" name="businessUsePercent"
                value={formData.businessUsePercent} onChange={handleChange} />
            )}
          </div>

          <button
            onClick={handleGenerateQuote}
            className={`px-6 py-3 rounded text-white ${purple} ${purpleHover}`}
          >
            Generate Quote
          </button>
        </section>

        {/* print button */}
        {quotes.length > 0 && (
          <div className="mt-6">
            <button
              onClick={handlePrintSelectedQuotes}
              className="px-6 py-3 rounded bg-gray-700 text-white hover:bg-gray-800"
            >
              Print Selected Quotes to PDF
            </button>
          </div>
        )}

        {/* quote cards */}
        <section className="mt-8 space-y-8">
          {quotes.map(q=>(
            <div key={q.id} className="bg-white p-6 rounded-xl shadow space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-purple-700 font-bold">
                  {q.data.termYears}-Year Quote&nbsp;|&nbsp;{q.quoteRef}
                </h2>
                <label className="text-sm">
                  <input type="checkbox"
                         className="mr-1"
                         checked={q.selected}
                         onChange={()=>toggleSelection(q.id)}/>
                  Include in PDF
                </label>
              </div>

              <p className="text-sm">{q.data.clientName} • {q.data.clientEmail}</p>
              <p className="text-2xl font-semibold">
                ${q.quote.oopPerCycle?.toFixed(2)} / {q.data.payCycle.toLowerCase()}
              </p>

              {/* finance + running */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card heading="Finance" bg="bg-purple-700">
                  <p>Financed: ${q.quote.finance?.displayAmountFinanced?.toFixed(2)}</p>
                  <p>Payment: ${q.quote.finance?.monthlyPayment?.toFixed(2)}</p>
                  <p>Balloon: ${q.quote.finance?.balloon?.toFixed(2)}</p>
                  <p>Fee: $29</p>
                </Card>
                <Card heading="Running Costs" bg="bg-orange-600">
                  {Object.entries(q.quote.running)
                    .filter(([k])=>k!=="total")
                    .map(([k,v])=>(
                      <p key={k}>{k}: ${v.toFixed(2)}</p>
                    ))}
                </Card>
              </div>

              {q.imageUrl && (
                <img
                  src={q.imageUrl}
                  alt="Car"
                  className="w-full rounded-lg mt-4"
                />
              )}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

/* ------------- small reusable UI wrappers ---------------- */

const TextInput = ({ label, ...props }) => (
  <label className="text-sm space-y-1">
    {label}
    <input
      {...props}
      className="w-full p-3 border rounded focus:ring-2 focus:ring-purple-600"
    />
  </label>
);

const NumberInput = TextInput;

const SelectInput = ({ label, options, values, ...props }) => (
  <label className="text-sm space-y-1">
    {label}
    <select
      {...props}
      className="w-full p-3 border rounded focus:ring-2 focus:ring-purple-600"
    >
      {(values || options).map((opt,i)=>(
        <option key={opt} value={values ? values[i] : opt}>{opt}</option>
      ))}
    </select>
  </label>
);

const Card = ({ heading, bg, children }) => (
  <div className={`${bg} text-white p-4 rounded-lg space-y-1`}>
    <h3 className="font-semibold">{heading}</h3>
    {children}
  </div>
);
