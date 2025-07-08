import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { generateFullQuote } from "./utils/fullQuoteGenerator";
import QuoteDropdowns from "./QuoteDropdowns";
import { generateCarSceneImage } from "./utils/carImageGenerator";
import QuoteCard from "./components/QuoteCard";

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
      const fullForm = { ...formData };

      if (!fullForm.price || fullForm.price < 1000) {
        alert("Please enter a valid driveaway price (above $1,000).");
        return;
      }
      if (!fullForm.salary || fullForm.salary < 20000) {
        alert("Please enter a valid annual salary (above $20,000).");
        return;
      }

      const runningCosts = {}; // Placeholder
      const quoteData = generateFullQuote(fullForm, runningCosts);

      let imageUrl = "";
      try {
        imageUrl = await generateCarSceneImage(
          fullForm.make, fullForm.model, fullForm.carType
        );
      } catch (imageError) {
        console.warn("Image generation failed:", imageError);
      }

      setQuotes(prev => [
        ...prev,
        {
          id: uuidv4(),
          quoteRef: generateQuoteID(),
          data: fullForm,
          quote: quoteData,
          imageUrl,
          selected: false
        }
      ]);
    } catch (err) {
      console.error("Quote generation failed:", err);
      alert("Could not generate quote.");
    }
  };

  const toggleSelection = id =>
    setQuotes(prev => prev.map(q =>
      q.id === id ? { ...q, selected: !q.selected } : q
    ));

  return (
    <div className="min-h-screen bg-purple-50 text-gray-800">
      <header className="bg-white shadow px-6 py-4 flex items-center gap-4">
        <img
          src="https://static.wixstatic.com/media/9c690e_2af82b66d9ad42dd9c186c2782642d00~mv2.png"
          alt="millarX"
          className="h-16"
        />
        <h1 className="text-2xl font-bold text-purple-800">
          millarX DriveIQ – Novated Quotes
        </h1>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <section className="bg-white p-8 rounded-2xl shadow space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <TextInput label="Client Name" name="clientName" value={formData.clientName} onChange={handleChange} />
            <TextInput label="Client Email" name="clientEmail" value={formData.clientEmail} onChange={handleChange} />
            <SelectInput label="State" name="state" value={formData.state} onChange={handleChange}
              options={["VIC", "NSW", "QLD", "SA", "WA", "TAS", "ACT", "NT"]} />
          </div>

          <QuoteDropdowns
            make={formData.make}
            model={formData.model}
            year={formData.year}
            onChange={handleDropdown}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <TextInput label="Variant" name="trim" value={formData.trim} onChange={handleChange} />
            <NumberInput label="Price (Driveaway)" name="price" value={formData.price} onChange={handleChange} />
            <NumberInput label="Salary" name="salary" value={formData.salary} onChange={handleChange} />
            <NumberInput label="Annual KMs" name="kms" value={formData.kms} onChange={handleChange} />
            <SelectInput label="Term" name="termYears" value={formData.termYears} onChange={handleChange}
              options={[1, 2, 3, 4, 5].map(y => `${y} Year`)} values={[1, 2, 3, 4, 5]} />
            <SelectInput label="Pay Cycle" name="payCycle" value={formData.payCycle} onChange={handleChange}
              options={["Weekly", "Fortnightly", "Monthly"]} />
            <SelectInput label="FBT Method" name="ecm" value={formData.ecm} onChange={handleChange}
              options={["Employee Contribution Method", "Operating Cost Method"]} />
            {formData.ecm === "Operating Cost Method" && (
              <NumberInput label="Business Use %" name="businessUsePercent"
                value={formData.businessUsePercent} onChange={handleChange} />
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerateQuote}
              className={`px-6 py-3 rounded text-white ${purple} ${purpleHover}`}
            >
              Generate Quote
            </button>
          </div>
        </section>

        <section className="mt-10 space-y-8">
          {quotes.map(q => (
            <div key={q.id} className="bg-white p-6 rounded-xl shadow space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-purple-700 font-bold text-lg">
                  {q.data.termYears}-Year Quote | {q.quoteRef}
                </h2>
                <label className="text-sm">
                  <input type="checkbox"
                         className="mr-1"
                         checked={q.selected}
                         onChange={() => toggleSelection(q.id)} />
                  Include in Summary
                </label>
              </div>

              <p className="text-sm text-gray-600">{q.data.clientName} • {q.data.clientEmail}</p>
              <p className="text-2xl font-semibold">
                ${q.quote?.oopPerCycle?.toFixed(2) || "0.00"} / {q.data.payCycle.toLowerCase()}
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <Card heading="Finance Details" bg="bg-purple-700">
                  <p>Financed: ${q.quote?.finance?.amountFinanced?.toFixed(2) || "0.00"}</p>
                  <p>Payment: ${q.quote?.finance?.monthlyPayment?.toFixed(2) || "0.00"}</p>
                  <p>Balloon: ${q.quote?.finance?.balloon?.toFixed(2) || "0.00"}</p>
                </Card>
                <Card heading="Running Costs" bg="bg-orange-600">
                  {Object.entries(q.quote?.running || {})
                    .filter(([k]) => k !== "total")
                    .map(([k, v]) => (
                      <p key={k}>{k}: ${v.toFixed(2)}</p>
                    ))}
                </Card>
              </div>

              {q.imageUrl && (
                <img
                  src={q.imageUrl}
                  alt="Vehicle Scene"
                  className="w-full rounded-lg mt-4 border"
                />
              )}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

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
      {(values || options).map((opt, i) => (
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
